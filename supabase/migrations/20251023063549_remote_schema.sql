drop policy "Users can delete their own agents" on "public"."agents";

drop policy "Users can insert their own agents" on "public"."agents";

drop policy "Users can update their own agents" on "public"."agents";

drop policy "Users can view their own agents" on "public"."agents";

drop policy "Backend can insert assessments" on "public"."assessments";

drop policy "Users can view assessments for their agents" on "public"."assessments";

drop policy "Backend can insert trades" on "public"."trades";

drop policy "Backend can update trades" on "public"."trades";

drop policy "Users can view trades for their agents" on "public"."trades";

revoke delete on table "public"."agents" from "anon";

revoke insert on table "public"."agents" from "anon";

revoke references on table "public"."agents" from "anon";

revoke select on table "public"."agents" from "anon";

revoke trigger on table "public"."agents" from "anon";

revoke truncate on table "public"."agents" from "anon";

revoke update on table "public"."agents" from "anon";

revoke delete on table "public"."agents" from "authenticated";

revoke insert on table "public"."agents" from "authenticated";

revoke references on table "public"."agents" from "authenticated";

revoke select on table "public"."agents" from "authenticated";

revoke trigger on table "public"."agents" from "authenticated";

revoke truncate on table "public"."agents" from "authenticated";

revoke update on table "public"."agents" from "authenticated";

revoke delete on table "public"."agents" from "service_role";

revoke insert on table "public"."agents" from "service_role";

revoke references on table "public"."agents" from "service_role";

revoke select on table "public"."agents" from "service_role";

revoke trigger on table "public"."agents" from "service_role";

revoke truncate on table "public"."agents" from "service_role";

revoke update on table "public"."agents" from "service_role";

revoke delete on table "public"."assessments" from "anon";

revoke insert on table "public"."assessments" from "anon";

revoke references on table "public"."assessments" from "anon";

revoke select on table "public"."assessments" from "anon";

revoke trigger on table "public"."assessments" from "anon";

revoke truncate on table "public"."assessments" from "anon";

revoke update on table "public"."assessments" from "anon";

revoke delete on table "public"."assessments" from "authenticated";

revoke insert on table "public"."assessments" from "authenticated";

revoke references on table "public"."assessments" from "authenticated";

revoke select on table "public"."assessments" from "authenticated";

revoke trigger on table "public"."assessments" from "authenticated";

revoke truncate on table "public"."assessments" from "authenticated";

revoke update on table "public"."assessments" from "authenticated";

revoke delete on table "public"."assessments" from "service_role";

revoke insert on table "public"."assessments" from "service_role";

revoke references on table "public"."assessments" from "service_role";

revoke select on table "public"."assessments" from "service_role";

revoke trigger on table "public"."assessments" from "service_role";

revoke truncate on table "public"."assessments" from "service_role";

revoke update on table "public"."assessments" from "service_role";

revoke delete on table "public"."trades" from "anon";

revoke insert on table "public"."trades" from "anon";

revoke references on table "public"."trades" from "anon";

revoke select on table "public"."trades" from "anon";

revoke trigger on table "public"."trades" from "anon";

revoke truncate on table "public"."trades" from "anon";

revoke update on table "public"."trades" from "anon";

revoke delete on table "public"."trades" from "authenticated";

revoke insert on table "public"."trades" from "authenticated";

revoke references on table "public"."trades" from "authenticated";

revoke select on table "public"."trades" from "authenticated";

revoke trigger on table "public"."trades" from "authenticated";

revoke truncate on table "public"."trades" from "authenticated";

revoke update on table "public"."trades" from "authenticated";

revoke delete on table "public"."trades" from "service_role";

revoke insert on table "public"."trades" from "service_role";

revoke references on table "public"."trades" from "service_role";

revoke select on table "public"."trades" from "service_role";

revoke trigger on table "public"."trades" from "service_role";

revoke truncate on table "public"."trades" from "service_role";

revoke update on table "public"."trades" from "service_role";

alter table "public"."agents" drop constraint "agents_user_id_fkey";

alter table "public"."assessments" drop constraint "assessments_agent_id_fkey";

alter table "public"."assessments" drop constraint "assessments_type_check";

alter table "public"."trades" drop constraint "trades_agent_id_fkey";

alter table "public"."trades" drop constraint "trades_side_check";

alter table "public"."trades" drop constraint "trades_status_check";

drop function if exists "public"."trigger_agent_scheduler"();

alter table "public"."agents" drop constraint "agents_pkey";

alter table "public"."assessments" drop constraint "assessments_pkey";

alter table "public"."trades" drop constraint "trades_pkey";

drop index if exists "public"."agents_pkey";

drop index if exists "public"."assessments_pkey";

drop index if exists "public"."idx_agents_is_active";

drop index if exists "public"."idx_agents_user_id";

drop index if exists "public"."idx_assessments_agent_id";

drop index if exists "public"."idx_assessments_timestamp";

drop index if exists "public"."idx_assessments_type";

drop index if exists "public"."idx_trades_agent_id";

drop index if exists "public"."idx_trades_entry_timestamp";

drop index if exists "public"."idx_trades_status";

drop index if exists "public"."trades_pkey";

drop table "public"."agents";

drop table "public"."assessments";

drop table "public"."trades";

create table "public"."profiles" (
    "id" uuid not null,
    "updated_at" timestamp with time zone,
    "username" text,
    "full_name" text,
    "avatar_url" text,
    "website" text,
    "onboarding_completed" boolean default false,
    "email" text,
    "phone_number" text,
    "display_name" text,
    "bio" text,
    "auth_provider" text,
    "email_verified" boolean default false,
    "phone_verified" boolean default false,
    "notifications_enabled" boolean default true,
    "theme" text default 'light'::text,
    "onboarding_data" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."profiles" enable row level security;

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_profiles_onboarding ON public.profiles USING btree (onboarding_completed);

CREATE INDEX idx_profiles_phone ON public.profiles USING btree (phone_number);

CREATE INDEX idx_profiles_provider ON public.profiles USING btree (auth_provider);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."profiles" add constraint "username_length" CHECK ((char_length(username) >= 3)) not valid;

alter table "public"."profiles" validate constraint "username_length";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$function$
;

create policy "Public profiles are viewable by everyone."
on "public"."profiles"
as permissive
for select
to public
using (true);


create policy "Users can insert their own profile"
on "public"."profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Users can insert their own profile."
on "public"."profiles"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = id));


create policy "Users can update own profile."
on "public"."profiles"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = id));


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id))
with check ((auth.uid() = id));


create policy "Users can view their own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));



CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


  create policy "Anyone can upload an avatar."
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'avatars'::text));



  create policy "Avatar images are publicly accessible."
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



