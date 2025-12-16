import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const appIdentifier = `com.puppetai.app${process.env.APP_VARIANT_EXT || ''}`;

  return {
    ...config,
    name: "Puppet",
    slug: "puppet-ai",
    scheme: [
      "puppetai",
      appIdentifier,
    ],
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icons/Icon-App-83.5x83.5.png",
    backgroundColor: "#000000",
    ios: {
      usesAppleSignIn: true,
      bundleIdentifier: appIdentifier,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSUserNotificationsUsageDescription:
          "This app uses notifications to send you updates, alerts, and important information."
      },
      entitlements: {
        "com.apple.developer.applesignin": ["Default"],
        "aps-environment": "development"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icons/icon-android-adaptive.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: appIdentifier,
      permissions: [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.VIBRATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-system-ui",
      "expo-font",
      [
        "expo-splash-screen", {
          backgroundColor: "#378593",
          image: "./assets/puppet-bare-icon-w.png",
          dark: {
            image: "./assets/puppet-bare-icon.png",
            backgroundColor: "#378593"
          },
          imageWidth: 230
        }
      ],
      "expo-router",
      [
        "expo-video",
        {
          supportsBackgroundPlayback: true,
          supportsPictureInPicture: true
        }
      ],
      "expo-localization",
      "expo-secure-store",
      "expo-web-browser",
      "expo-apple-authentication",
      "expo-notifications",
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          project: "vimana-x4",
          organization: "puppet"
        }
      ],
      [
        "expo-dev-client",
        {
          "launchMode": "most-recent"
        }
      ],
    ],
    updates: {
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/5f885227-49e3-4a41-be3b-9571706c061e"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    extra: {
      privyAppId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
      privyClientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      eas: {
        projectId: "5f885227-49e3-4a41-be3b-9571706c061e"
      }
    },
    owner: "neildesh-vimana"
  }
};
