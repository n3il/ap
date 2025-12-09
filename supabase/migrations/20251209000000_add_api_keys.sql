-- Add API key functionality to the database

-- Create api_keys table
CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "user_id" uuid NOT NULL,
    "name" text NOT NULL,
    "key_hash" text NOT NULL,
    "key_prefix" text NOT NULL,
    "scopes" jsonb DEFAULT '["read"]'::jsonb NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "expires_at" timestamp with time zone,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "api_keys_user_id_name_key" UNIQUE ("user_id", "name")
);

ALTER TABLE "public"."api_keys" OWNER TO "postgres";

COMMENT ON TABLE "public"."api_keys" IS 'Stores hashed API keys for user authentication and authorization';
COMMENT ON COLUMN "public"."api_keys"."key_hash" IS 'SHA-256 hash of the API key for secure storage';
COMMENT ON COLUMN "public"."api_keys"."key_prefix" IS 'First 8 characters of the key for display (e.g., sk_live_12345678...)';
COMMENT ON COLUMN "public"."api_keys"."scopes" IS 'JSON array of permission scopes (e.g., ["read", "write", "admin"])';

-- Create foreign key constraint
ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "auth"."users"("id")
    ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX "idx_api_keys_user_id" ON "public"."api_keys" USING btree ("user_id");
CREATE INDEX "idx_api_keys_key_hash" ON "public"."api_keys" USING btree ("key_hash");
CREATE INDEX "idx_api_keys_is_active" ON "public"."api_keys" USING btree ("is_active") WHERE "is_active" = true;

-- Create trigger for updated_at
CREATE TRIGGER "update_api_keys_updated_at"
    BEFORE UPDATE ON "public"."api_keys"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_updated_at"();

-- Function to generate a new API key
CREATE OR REPLACE FUNCTION "public"."generate_api_key"(
    p_user_id uuid,
    p_name text,
    p_scopes jsonb DEFAULT '["read"]'::jsonb,
    p_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_api_key text;
    v_key_hash text;
    v_key_prefix text;
    v_api_key_id uuid;
BEGIN
    -- Verify the user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User does not exist';
    END IF;

    -- Generate a secure random API key (sk_live_ + 32 random bytes as hex)
    v_api_key := 'sk_live_' || encode(extensions.gen_random_bytes(32), 'hex');

    -- Create SHA-256 hash of the API key
    v_key_hash := encode(extensions.digest(v_api_key, 'sha256'), 'hex');

    -- Extract prefix for display (first 8 chars after sk_live_)
    v_key_prefix := substring(v_api_key, 1, 16);

    -- Insert the API key record
    INSERT INTO public.api_keys (
        user_id,
        name,
        key_hash,
        key_prefix,
        scopes,
        expires_at
    ) VALUES (
        p_user_id,
        p_name,
        v_key_hash,
        v_key_prefix,
        p_scopes,
        p_expires_at
    ) RETURNING id INTO v_api_key_id;

    -- Return the plain API key (only time it's visible) and metadata
    RETURN jsonb_build_object(
        'id', v_api_key_id,
        'api_key', v_api_key,
        'key_prefix', v_key_prefix,
        'name', p_name,
        'scopes', p_scopes,
        'expires_at', p_expires_at,
        'warning', 'Store this API key securely. It will not be shown again.'
    );
END;
$$;

ALTER FUNCTION "public"."generate_api_key"(uuid, text, jsonb, timestamp with time zone) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."generate_api_key"(uuid, text, jsonb, timestamp with time zone) IS
    'Generates a new API key for a user. Returns the plain key once - it cannot be retrieved again.';

-- Function to validate an API key
CREATE OR REPLACE FUNCTION "public"."validate_api_key"(p_api_key text)
RETURNS TABLE(
    user_id uuid,
    api_key_id uuid,
    scopes jsonb,
    is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_key_hash text;
BEGIN
    -- Hash the provided API key
    v_key_hash := encode(extensions.digest(p_api_key, 'sha256'), 'hex');

    -- Look up the API key and validate
    RETURN QUERY
    SELECT
        ak.user_id,
        ak.id as api_key_id,
        ak.scopes,
        CASE
            WHEN ak.is_active = true
                AND (ak.expires_at IS NULL OR ak.expires_at > now())
            THEN true
            ELSE false
        END as is_valid
    FROM public.api_keys ak
    WHERE ak.key_hash = v_key_hash;

    -- Update last_used_at if key was found and valid
    UPDATE public.api_keys
    SET last_used_at = now()
    WHERE key_hash = v_key_hash
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now());
END;
$$;

ALTER FUNCTION "public"."validate_api_key"(text) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."validate_api_key"(text) IS
    'Validates an API key and returns user_id, scopes, and validity status. Updates last_used_at on success.';

-- Function to revoke an API key
CREATE OR REPLACE FUNCTION "public"."revoke_api_key"(p_api_key_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Deactivate the API key (only if owned by the user)
    UPDATE public.api_keys
    SET is_active = false, updated_at = now()
    WHERE id = p_api_key_id AND user_id = p_user_id;

    RETURN FOUND;
END;
$$;

ALTER FUNCTION "public"."revoke_api_key"(uuid, uuid) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."revoke_api_key"(uuid, uuid) IS
    'Revokes (deactivates) an API key. Returns true if successful.';

-- Row Level Security (RLS) policies
ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;

-- Users can view their own API keys
CREATE POLICY "Users can view their own API keys"
    ON "public"."api_keys"
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own API keys (via function only)
CREATE POLICY "Users can create their own API keys"
    ON "public"."api_keys"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update their own API keys"
    ON "public"."api_keys"
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete their own API keys"
    ON "public"."api_keys"
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can access all API keys for validation
CREATE POLICY "Service role can access all API keys"
    ON "public"."api_keys"
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."generate_api_key"(uuid, text, jsonb, timestamp with time zone) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."generate_api_key"(uuid, text, jsonb, timestamp with time zone) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."validate_api_key"(text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."validate_api_key"(text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."validate_api_key"(text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."revoke_api_key"(uuid, uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."revoke_api_key"(uuid, uuid) TO "service_role";
