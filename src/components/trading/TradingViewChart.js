import React, { useRef, useMemo } from 'react';
import { View, Dimensions, ActivityIndicator } from '@/components/ui';
import WebView from 'react-native-webview';

import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';

const { width } = Dimensions.get('window');

export default function TradingViewChart({
  symbol = 'BTCUSD',
  theme: preferredTheme = null,
  height = 400,
}) {
  const webViewRef = useRef(null);
  const { colorScheme, theme } = useTheme();

  const chartTheme = (preferredTheme ?? colorScheme ?? 'dark').toLowerCase();
  const isDark = chartTheme === 'dark';

  const htmlContent = useMemo(() => {
    const symbolMap = {
      BTC: 'BTCUSD',
      ETH: 'ETHUSD',
      SOL: 'SOLUSD',
      AVAX: 'AVAXUSD',
      ARB: 'ARBUSD',
      OP: 'OPUSD',
      MATIC: 'MATICUSD',
      DOGE: 'DOGEUSD',
      SUI: 'SUIUSD',
    };

    const tradingViewSymbol = symbolMap[symbol] || `${symbol}USD`;

    const background = isDark ? '#0f172a' : '#ffffff';
    const gridColor = isDark
      ? 'rgba(148, 163, 184, 0.1)'
      : 'rgba(148, 163, 184, 0.2)';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: ${background};
            }
            #tradingview-widget { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="tradingview-widget"></div>
          <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
          <script type="text/javascript">
            try {
              new TradingView.widget({
                "width": "100%",
                "height": "100%",
                "symbol": "BINANCE:${tradingViewSymbol}",
                "interval": "1",
                "timezone": "Etc/UTC",
                "theme": "${isDark ? 'dark' : 'light'}",
                "style": "1",
                "locale": "en",
                "toolbar_bg": "${isDark ? '#0f172a' : '#f1f5f9'}",
                "enable_publishing": false,
                "hide_top_toolbar": false,
                "hide_legend": false,
                "save_image": false,
                "container_id": "tradingview-widget",
                "backgroundColor": "transparent",
                "gridColor": "${gridColor}",
                "allow_symbol_change": false,
                "disabled_features": [
                  "use_localstorage_for_settings",
                  "header_symbol_search",
                  "symbol_search_hot_key"
                ],
                "enabled_features": [
                  "hide_left_toolbar_by_default"
                ]
              });
            } catch (error) {
              console.error('TradingView initialization error:', error);
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'error',
                message: error.message
              }));
            }
          </script>
        </body>
      </html>
    `;
  }, [symbol, chartTheme, isDark]);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.colors.info.DEFAULT} />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'error') {
              console.error('TradingView error:', message.message);
            }
          } catch (e) {
            // Ignore
          }
        }}
      />
    </View>
  );
}

const createStyles = (theme, isDark) => ({
  container: {
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: withOpacity(
      isDark ? theme.colors.background : theme.colors.surface,
      0.9,
    ),
  },
});
