import {
  Divider,
  LabelValue,
  Stack,
  StatusBadge,
  Text,
  View,
} from "@/components/ui";
import GlassCard from "./GlassCard";

type TradeCardData = {
  id?: string;
  asset: string;
  status: "OPEN" | "CLOSED" | string;
  side: "LONG" | "SHORT" | string;
  realized_pnl?: number;
  size: number | string;
  entry_price: number | string;
  exit_price?: number | string;
  entry_timestamp?: string;
  exit_timestamp?: string;
};

type TradeCardProps = {
  trade: TradeCardData;
};

export default function TradeCard({ trade }: TradeCardProps) {
  const isOpen = trade.status === "OPEN";
  const isLong = trade.side === "LONG";

  const pnl = trade.realized_pnl || 0;
  const pnlColor = pnl >= 0 ? "success" : "error";
  const pnlSign = pnl >= 0 ? "+" : "";

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <GlassCard glassEffectStyle="clear">
      <Stack
        direction="row"
        justify="space-between"
        align="flex-start"
        sx={{ marginBottom: 3 }}
      >
        <Stack direction="row" align="center" spacing={2}>
          <Text variant="lg" sx={{ fontWeight: "700" }}>
            {trade.asset}
          </Text>
          <StatusBadge variant={isLong ? "success" : "error"}>
            {trade.side}
          </StatusBadge>
        </Stack>
        <StatusBadge variant={isOpen ? "accent" : "muted"}>
          {trade.status}
        </StatusBadge>
      </Stack>

      <Stack direction="row" justify="space-between" sx={{ marginBottom: 2 }}>
        <LabelValue label="Size" value={parseFloat(trade.size).toFixed(4)} />
        <LabelValue
          label="Entry Price"
          value={`$${parseFloat(trade.entry_price).toLocaleString()}`}
          sx={{ alignItems: "flex-end" }}
        />
      </Stack>

      {!isOpen && (
        <Stack direction="row" justify="space-between" sx={{ marginBottom: 2 }}>
          <LabelValue
            label="Exit Price"
            value={`$${parseFloat(trade.exit_price).toLocaleString()}`}
          />
          <View sx={{ alignItems: "flex-end" }}>
            <Text variant="xs" tone="muted" sx={{ marginBottom: 1 }}>
              Realized P&L
            </Text>
            <Text variant="body" sx={{ fontWeight: "700", color: pnlColor }}>
              {pnlSign}${Math.abs(pnl).toLocaleString()}
            </Text>
          </View>
        </Stack>
      )}

      <Divider sx={{ marginTop: 2 }} />

      <Stack direction="row" justify="space-between" sx={{ marginTop: 2 }}>
        <View>
          <Text variant="xs" tone="muted">
            Entry
          </Text>
          <Text variant="xs" tone="tertiary">
            {formatDate(trade.entry_timestamp)}
          </Text>
        </View>
        {!isOpen && (
          <View sx={{ alignItems: "flex-end" }}>
            <Text variant="xs" tone="muted">
              Exit
            </Text>
            <Text variant="xs" tone="tertiary">
              {formatDate(trade.exit_timestamp)}
            </Text>
          </View>
        )}
      </Stack>
    </GlassCard>
  );
}
