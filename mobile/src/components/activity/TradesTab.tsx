import { Text, View } from "@/components/ui";

export default function TradesTab() {
  return (
    <View
      sx={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 6,
      }}
    >
      <Text
        sx={{
          color: "mutedForeground",
          fontSize: 18,
          textAlign: "center",
          marginBottom: 2,
        }}
      >
        Trades
      </Text>
      <Text sx={{ color: "secondary500", fontSize: 14, textAlign: "center" }}>
        Coming soon
      </Text>
    </View>
  );
}
