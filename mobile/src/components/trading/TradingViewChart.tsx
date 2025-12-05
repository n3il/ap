import { WebView } from "react-native-webview";
import React, { useRef, useEffect } from "react";

const TradingViewChart = ({ symbol = "BTC", theme = "dark" }) => {
  const webViewRef = useRef(null);

  const sendMessage = (msg) => {
    webViewRef.current?.postMessage(JSON.stringify(msg));
  };

  useEffect(() => {
    sendMessage({ type: "updateSymbol", symbol: `BINANCE:${symbol}USD` });
  }, [symbol]);

  useEffect(() => {
    sendMessage({ type: "updateTheme", theme });
  }, [theme]);

  return (
    <WebView
      style={{ flex: 1, backgroundColor: '#111' }}
      ref={webViewRef}
      source={require("@assets/webview/tradingview.html")}
      originWhitelist={["*"]}
      javaScriptEnabled
    />
  );
};

export default TradingViewChart;