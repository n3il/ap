import GlassCard from "@/components/GlassCard";
import { Text } from "@/components/ui";

export default function WalletAddressCard({
  address,
  isOwnAgent = false,
  variant = "full",
}) {
  const shortAddress = address
    ? `${address.slice(0, 8)}...${address.slice(-6)}`
    : "Hyperliquid wallet not linked";

  if (variant === "short") {
    return (
      <Text
        variant="xs"
        tone="muted"
        sx={{ fontFamily: "monospace", opacity: 0.5 }}
      >
        {shortAddress}
      </Text>
    );
  }

  return (
    <GlassCard>
      <Text
        variant="xs"
        sx={{
          color: "mutedForeground",
          marginBottom: 1.5,
          textTransform: "uppercase",
          letterSpacing: 1,
          fontSize: 9,
        }}
      >
        Hyperliquid Wallet
      </Text>
      <Text
        variant="sm"
        sx={{
          color: "textTertiary",
          fontFamily: "monospace",
          fontSize: 11,
        }}
      >
        {address || "Not linked"}
      </Text>
      {!isOwnAgent && (
        <Text
          variant="xs"
          sx={{
            color: "textSecondary",
            marginTop: 1.5,
            fontSize: 10,
            lineHeight: 14,
          }}
        >
          Wallet metadata is shared by the creator. Clone this agent to supply
          your own Hyperliquid address before activating trades.
        </Text>
      )}
    </GlassCard>
  );
}
