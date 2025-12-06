import { WebView } from "react-native-webview";
import React, { useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";

const TradingViewChart = ({ symbol = "BTC" }) => {
  const { colorScheme } = useTheme()
  const {colors: palette} = useColors()
  const webViewRef = useRef(null);

  const sendMessage = (msg) => {
    webViewRef.current?.postMessage(JSON.stringify(msg));
  };

  useEffect(() => {
    sendMessage({ type: "updateSymbol", symbol: `BINANCE:${symbol}USD` });
  }, [symbol]);

  useEffect(() => {
    sendMessage({ type: "updateTheme", theme: colorScheme });
  }, [colorScheme]);

  return (
    <WebView
      style={{ flex: 1, backgroundColor: palette.backgroundSecondary }}
      ref={webViewRef}
      source={require("@assets/webview/tradingview.html")}
      originWhitelist={["*"]}
      javaScriptEnabled
    />
  );
};

export default TradingViewChart;