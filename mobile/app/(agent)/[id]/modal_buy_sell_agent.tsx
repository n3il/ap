
import { Button, Dimensions } from "@/components/ui";
import { View, Text, TextInput } from "dripsy";
import { useState } from "react";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/theme";

const { width, height } = Dimensions.get("window");

export default function BuySellAgentModal() {
  const [amount, setAmount] = useState("");
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const { colors } = useColors();

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    // TODO: Implement actual buy/sell logic
    console.log("Buy/Sell:", { agentId: id, amount: parseFloat(amount) });
    router.back();
  };
  return (
    <View style={{ flex: 1 }}>
      {/* <KeyboardAvoidingView> */}
        <View
          sx={{
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Text variant="sm" tone="muted">
            Amount
          </Text>
          <View sx={{ flexDirection: "row", gap: 2 }}>
            <Text variant="h1" sx={{ fontSize: 48 }}>
              $
            </Text>
            <TextInput
              placeholder="0"
              sx={{ fontSize: 48, textAlign: "center", minWidth: 200 }}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          <View
            sx={{
              flexDirection: "row",
              gap: 2,
              marginTop: 4,
            }}
          >
            {[100, 500, 1000].map((qs) => (
              <Button
                key={qs}
                variant="outline"
                size="sm"
                onPress={() => setAmount(qs.toString())}
              >
                ${qs}
              </Button>
            ))}
          </View>
        </View>
        <View
          sx={{
            marginTop: "auto",
            paddingHorizontal: 4,
            justifyContent: "center",
          }}
        >
          <Button
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Confirm
          </Button>
        </View>
      {/* </KeyboardAvoidingView> */}
    </View>
  );
}
