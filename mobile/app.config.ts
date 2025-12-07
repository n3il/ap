export default {
  expo: {
    name: "Puppet",
    slug: "puppet-ai",
    scheme: "com.puppetai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icons/Icon-App-83.5x83.5.png",
    backgroundColor: "#000000",
    ios: {
      usesAppleSignIn: true,
      bundleIdentifier: "com.puppetai.app",
      deploymentTarget: "16.0",
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
      package: "com.puppetai.app",
      usesCleartextTraffic: false
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
          backgroundColor: "#101a2c",
          image: "./assets/puppet-bare-icon-w.png",
          dark: {
            image: "./assets/puppet-bare-icon.png",
            backgroundColor: "#101a2c"
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
      "@sentry/react-native/expo",
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
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: "5f885227-49e3-4a41-be3b-9571706c061e"
      }
    },
    owner: "neildesh-vimana"
  }
};
