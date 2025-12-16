import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
  Card,
} from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";
import { usePrivy, useLinkWithOAuth, useUnlinkOAuth } from "@privy-io/expo";

type LinkedAccount = {
  type: string;
  address?: string;
  email?: string;
  phone?: string;
  username?: string;
  subject?: string;
  [key: string]: unknown;
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

export default function ManualLinkingCard() {
  const colors = useColors();
  const { isDark } = useTheme();
  const palette = colors.colors;
  const { user } = usePrivy();
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"default" | "error" | "success">(
    "default",
  );

  const { link: linkWithOAuth } = useLinkWithOAuth({
    onSuccess: (user) => {
      setStatusTone("success");
      setStatusMessage("Account linked successfully!");
      setLinkingProvider(null);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to link identity.";
      setStatusTone("error");
      setStatusMessage(message);
      setLinkingProvider(null);
    },
  });

  const { unlink: unlinkOAuth } = useUnlinkOAuth({
    onSuccess: (user) => {
      setStatusTone("success");
      setStatusMessage("Identity unlinked successfully.");
      setUnlinkingId(null);
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to unlink this provider.";
      setStatusTone("error");
      setStatusMessage(message);
      setUnlinkingId(null);
    },
  });

  const linkedAccounts = useMemo(() => {
    if (!user?.linked_accounts) return [];

    return user.linked_accounts.map((account: LinkedAccount) => {
      const accountType = account.type;
      const email =
        typeof account.email === "string" ? account.email : undefined;
      const username =
        typeof account.username === "string" ? account.username : undefined;
      const phone =
        typeof account.phone === "string" ? account.phone : undefined;

      return {
        ...account,
        id: `${accountType}-${account.subject || account.address || account.email || account.phone}`,
        label:
          accountType.charAt(0).toUpperCase() + accountType.slice(1),
        detail: email || username || phone || "Linked",
        provider: accountType,
      };
    });
  }, [user?.linked_accounts]);

  const linkedOAuthProviders = useMemo(
    () => linkedAccounts.filter((acc) =>
      AVAILABLE_PROVIDERS.some(p => p.id === acc.provider)
    ),
    [linkedAccounts],
  );

  const pendingProviders = useMemo(
    () =>
      AVAILABLE_PROVIDERS.filter(
        (provider) =>
          !linkedAccounts.some((account) => account.provider === provider.id),
      ),
    [linkedAccounts],
  );

  const canUnlink = linkedAccounts.length > 1;

  async function handleLink(provider: string) {
    setStatusMessage(null);
    setLinkingProvider(provider);
    try {
      await linkWithOAuth({ provider });
    } catch (error) {
      // Error handled by onError callback
      console.error("Link error:", error);
    }
  }

  async function handleUnlink(account: any) {
    if (!canUnlink) {
      Alert.alert(
        "Cannot unlink",
        "You need at least one other login method linked before removing this provider.",
      );
      return;
    }

    setStatusMessage(null);
    setUnlinkingId(account.id);
    try {
      await unlinkOAuth({
        provider: account.provider,
        subject: account.subject,
      });
    } catch (error) {
      // Error handled by onError callback
      console.error("Unlink error:", error);
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
    <View
      style={{
        padding: 20,
      }}
    >
      <View>
        <Text variant="lg" sx={{ fontWeight: "700", color: "textPrimary" }}>
          Linked Accounts
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
            paddingVertical: 6,
            borderRadius: 12,
            textAlign: "left"
          }}
        >
          {statusMessage}
        </Text>
      ) : null}

      <View sx={{ gap: 3 }}>
        <View sx={{ gap: 3 }}>
          {linkedOAuthProviders.map((account) => (
              <View
                key={account.id}
                sx={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 3,
                }}
              >
                <View>
                  <Text sx={{ fontWeight: "600", color: "textPrimary" }}>
                    {account.label}
                  </Text>
                  <Text variant="xs" tone="muted">
                    {account.detail}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleUnlink(account)}
                  disabled={unlinkingId === account.id || !canUnlink}
                  sx={{
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    borderRadius: "full",
                    backgroundColor: "surface",
                    borderWidth: 1,
                    borderColor: "border",
                    opacity: !canUnlink ? 0.5 : 1,
                  }}
                >
                  {unlinkingId === account.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text variant="sm" tone="muted">
                      Unlink
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))
          })
        </View>
      </View>

      {pendingProviders.length ? (
        <View sx={{ gap: 3 }}>
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
    </View>
  );
}
