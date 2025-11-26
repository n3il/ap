import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StatusBadge, Text, TouchableOpacity, View } from "@/components/ui";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { useColors } from "@/theme";
import { LLM_PROVIDERS } from "./CreateAgentModal";

export default function AgentBalanceHeader({ agent, onMenuPress }) {
  const { colors: palette, success, error, withOpacity } = useColors();

  const { equity, unrealizedPnl, realizedPnl, enrichedPositions } =
    useAccountBalance(agent?.id, false);

  const totalPnl = (realizedPnl || 0) + (unrealizedPnl || 0);
  const pnlSign = totalPnl > 0 ? "+" : "";
  const isActive = Boolean(agent?.is_active);
  const providerLabel = LLM_PROVIDERS[agent?.llm_provider] || "Unknown";

  // Gradient colors
  const gradientColors = [
    palette.brand500 || "#FF6B35",
    palette.brand600 || "#F7931E",
    palette.accent || "#E91E63",
  ];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
      }}
    >
      <View
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <View sx={{ flexDirection: "row", alignItems: "center" }}>
          <View
            sx={{
              width: 40,
              height: 40,
              borderRadius: "full",
              backgroundColor: withOpacity("#FFFFFF", 0.2),
              justifyContent: "center",
              alignItems: "center",
              marginRight: 3,
            }}
          >
            <MaterialCommunityIcons name="robot" size={24} color="#FFFFFF" />
          </View>
          <Text sx={{ fontSize: 18, fontWeight: "600", color: "#FFFFFF" }}>
            {agent?.name || "Agent"}
          </Text>
        </View>

        {onMenuPress && (
          <TouchableOpacity onPress={onMenuPress}>
            <MaterialCommunityIcons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <Text
        sx={{
          fontSize: 12,
          color: withOpacity("#FFFFFF", 0.8),
          marginBottom: 4,
        }}
      >
        {providerLabel} " {agent?.model_name || "N/A"}
      </Text>

      <View sx={{ marginVertical: 4 }}>
        <Text
          sx={{
            fontSize: 14,
            color: withOpacity("#FFFFFF", 0.9),
            marginBottom: 1,
          }}
        >
          Total Balance
        </Text>
        <Text
          sx={{
            fontSize: 48,
            fontWeight: "700",
            color: "#FFFFFF",
            letterSpacing: -2,
          }}
        >
          $
          {equity.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>

      {totalPnl !== 0 && (
        <View
          sx={{
            backgroundColor: withOpacity("#000000", 0.3),
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 20,
            alignSelf: "flex-start",
            marginBottom: 4,
          }}
        >
          <Text sx={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
            {pnlSign}$
            {Math.abs(totalPnl).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      )}

      <View
        sx={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginTop: 3,
        }}
      >
        <View sx={{ alignItems: "center" }}>
          <MaterialCommunityIcons name="send" size={24} color="#FFFFFF" />
          <Text sx={{ fontSize: 12, color: "#FFFFFF", marginTop: 1 }}>
            Trade
          </Text>
        </View>

        <View sx={{ alignItems: "center" }}>
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          <Text sx={{ fontSize: 12, color: "#FFFFFF", marginTop: 1 }}>
            Deposit
          </Text>
        </View>

        <View sx={{ alignItems: "center" }}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={24}
            color="#FFFFFF"
          />
          <Text sx={{ fontSize: 12, color: "#FFFFFF", marginTop: 1 }}>
            Details
          </Text>
        </View>
      </View>

      <View sx={{ position: "absolute", top: 24, right: 24 }}>
        <View
          sx={{
            backgroundColor: isActive
              ? withOpacity(success, 0.2)
              : withOpacity("#FFFFFF", 0.2),
            paddingHorizontal: 3,
            paddingVertical: 1.5,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isActive ? success : withOpacity("#FFFFFF", 0.5),
          }}
        >
          <Text
            sx={{
              fontSize: 10,
              fontWeight: "600",
              color: "#FFFFFF",
              textTransform: "uppercase",
            }}
          >
            {isActive ? "Active" : "Paused"}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
