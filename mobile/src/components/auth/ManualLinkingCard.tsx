import { makeRedirectUri } from "expo-auth-session";
import { GlassView } from "expo-glass-effect";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { supabase } from "@/config/supabase";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";

type Identity = {
  identity_id: string;
  provider: string;
  identity_data?: {
    email?: string;
    username?: string;
    [key: string]: unknown;
  };
};

const AVAILABLE_PROVIDERS = [
  {
    id: "google",
    label: "Google",
    description: "Link your Google account for quicker sign-ins.",
  },
  {
    id: "apple",
    label: "Apple",
    description: "Link your Apple ID for Sign in with Apple.",
  },
];

function extractCodeFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get("code");
    if (code) return code;
    if (url.includes("#")) {
      const hashParams = new URLSearchParams(url.split("#")[1]);
      return hashParams.get("code");
    }
  } catch (_error) {
    // ignore malformed URLs
  }
  return null;
}

export default function ManualLinkingCard() {
  const colors = useColors();
  const { isDark } = useTheme();
  const palette = colors.colors;
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"default" | "error" | "success">(
    "default",
  );

  const linkedProviders = useMemo(() => {
    return identities.map((identity) => {
      const email =
        typeof identity.identity_data?.email === "string"
          ? identity.identity_data?.email
          : undefined;
      const username =
        typeof identity.identity_data?.username === "string"
          ? identity.identity_data?.username
          : undefined;
      return {
        ...identity,
        label:
          identity.provider.charAt(0).toUpperCase() +
          identity.provider.slice(1),
        detail: email || username || "Linked",
      };
    });
  }, [identities]);

  const pendingProviders = useMemo(
    () =>
      AVAILABLE_PROVIDERS.filter(
        (provider) =>
          !identities.some((identity) => identity.provider === provider.id),
      ),
    [identities],
  );

  const canUnlink = linkedProviders.length > 1;

  useEffect(() => {
    refreshIdentities();
  }, []);

  async function refreshIdentities() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getUserIdentities();
      if (error) throw error;
      setIdentities(data?.identities ?? []);
    } catch (error) {
      console.error("Failed to load linked identities", error);
      setStatusTone("error");
      setStatusMessage("Unable to load linked identities right now.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLink(provider: string) {
    setStatusMessage(null);
    setLinkingProvider(provider);
    try {
      const redirectTo = makeRedirectUri({
        scheme: process.env.EXPO_PUBLIC_REDIRECT_URL,
      });
      const { data, error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
        );
        if (result.type === "success" && result.url) {
          const code = extractCodeFromUrl(result.url);
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
        }
      }

      setStatusTone("success");
      setStatusMessage(
        "If prompted, approve the new login in your browser to finish linking. Refresh to see updates.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to link identity.";
      setStatusTone("error");
      setStatusMessage(message);
    } finally {
      setLinkingProvider(null);
      await refreshIdentities();
    }
  }

  async function handleUnlink(identity: Identity) {
    if (!canUnlink) {
      Alert.alert(
        "Cannot unlink",
        "You need at least one other login method linked before removing this provider.",
      );
      return;
    }

    setStatusMessage(null);
    setUnlinkingId(identity.identity_id);
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;

      setStatusTone("success");
      setStatusMessage("Identity unlinked successfully.");
      await refreshIdentities();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to unlink this provider.";
      setStatusTone("error");
      setStatusMessage(message);
    } finally {
      setUnlinkingId(null);
    }
  }

  const successColor =
    (colors.success as any)?.DEFAULT ??
    (colors.success as any) ??
    palette.brand500 ??
    palette.info ??
    "#22c55e";
  const errorColor =
    (colors.error as any)?.DEFAULT ??
    (colors.error as any) ??
    palette.error ??
    palette.brand500 ??
    "#ef4444";

  return (
    <GlassView
      glassEffectStyle="clear"
      tintColor={
        isDark
          ? colors.withOpacity(palette.background, 0.9)
          : colors.withOpacity(palette.foreground, 0.9)
      }
      style={{
        borderRadius: 24,
        padding: 20,
      }}
    >
      <View>
        <Text variant="lg" sx={{ fontWeight: "700", color: "textPrimary" }}>
          Manual identity linking
        </Text>
        <Text variant="sm" tone="muted" sx={{ marginTop: 2 }}>
          Connect additional OAuth providers to this account so you can sign in
          with any linked identity. Requires manual approval in your browser.
        </Text>
      </View>

      {statusMessage ? (
        <Text
          variant="xs"
          sx={{
            color:
              statusTone === "error"
                ? errorColor
                : statusTone === "success"
                  ? successColor
                  : "textPrimary",
            backgroundColor: colors.withOpacity(
              statusTone === "error"
                ? errorColor
                : statusTone === "success"
                  ? successColor
                  : (palette.brand500 ?? palette.info),
              0.08,
            ),
            padding: 6,
            borderRadius: 12,
          }}
        >
          {statusMessage}
        </Text>
      ) : null}

      <View sx={{ gap: 3 }}>
        <Text
          variant="xs"
          tone="muted"
          sx={{ letterSpacing: 1, textTransform: "uppercase" }}
        >
          Linked providers
        </Text>
        <View sx={{ gap: 3 }}>
          {isLoading ? (
            <View
              sx={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                paddingVertical: 2,
              }}
            >
              <ActivityIndicator color={colors.primary} />
              <Text tone="muted">Loading providers…</Text>
            </View>
          ) : linkedProviders.length ? (
            linkedProviders.map((identity) => (
              <View
                key={identity.identity_id}
                sx={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 3,
                }}
              >
                <View>
                  <Text sx={{ fontWeight: "600", color: "textPrimary" }}>
                    {identity.label}
                  </Text>
                  <Text variant="xs" tone="muted">
                    {identity.detail}
                  </Text>
                </View>
                {identity.provider !== "email" ? (
                  <TouchableOpacity
                    onPress={() => handleUnlink(identity)}
                    disabled={unlinkingId === identity.identity_id}
                    sx={{
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      borderRadius: "full",
                      backgroundColor: "surface",
                      borderWidth: 1,
                      borderColor: "border",
                    }}
                  >
                    {unlinkingId === identity.identity_id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text variant="sm" tone="muted">
                        Unlink
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          ) : (
            <Text tone="muted">No linked providers yet.</Text>
          )}
        </View>
      </View>

      {pendingProviders.length ? (
        <View sx={{ gap: 3 }}>
          <Text
            variant="xs"
            tone="muted"
            sx={{ letterSpacing: 1, textTransform: "uppercase" }}
          >
            Add another login
          </Text>
          <View sx={{ gap: 3 }}>
            {pendingProviders.map((provider) => (
              <View
                key={provider.id}
                sx={{
                  paddingVertical: 3,
                  borderTopWidth: 1,
                  borderColor: "border",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View sx={{ flex: 1, paddingRight: 3 }}>
                  <Text sx={{ fontWeight: "600", color: "textPrimary" }}>
                    {provider.label}
                  </Text>
                  <Text variant="xs" tone="muted">
                    {provider.description}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleLink(provider.id)}
                  disabled={linkingProvider === provider.id}
                  sx={{
                    borderRadius: "xl",
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    backgroundColor: "accent",
                  }}
                >
                  {linkingProvider === provider.id ? (
                    <ActivityIndicator color={colors.colors.accentForeground} />
                  ) : (
                    <Text
                      sx={{
                        color: "foreground",
                        fontWeight: "600",
                      }}
                    >
                      Link
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text variant="xs" tone="subtle">
          All supported providers are already linked to this account.
        </Text>
      )}
    </GlassView>
  );
}
