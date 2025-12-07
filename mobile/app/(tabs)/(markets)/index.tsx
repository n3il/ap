import ContainerView from "@/components/ContainerView";
import TradingViewChart from "@/components/trading/TradingViewChart";
import { Dimensions, View } from "@/components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export default function MarketsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{
      flex: 1,
      backgroundColor: "#111",
      paddingTop: insets.top,
      paddingBottom: insets.bottom * 3
    }}>
      <TradingViewChart symbol={"BTC"}  />
    </View>
  );
}
