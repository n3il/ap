export default {
  expo: {
    name: "Puppet",
    slug: "puppet-ai",
    scheme: "ap",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icons/Icon-App-83.5x83.5.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/icons/Icon-App-iTunes.png",
      resizeMode: "contain",
      backgroundColor: "#232323"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.puppetai.app",
      deploymentTarget: "16.0",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSExceptionDomains: {
            "pexels.com": {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSIncludesSubdomains: true
            },
            "videos.pexels.com": {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSIncludesSubdomains: true
            },
            "api.hyperliquid.xyz": {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSExceptionRequiresForwardSecrecy: false,
              NSIncludesSubdomains: true
            }
          }
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icons/icon-android-adaptive.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.puppetai.app",
      usesCleartextTraffic: true
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      "expo-dev-client",
      [
        "expo-video",
        {
          supportsBackgroundPlayback: true,
          supportsPictureInPicture: true
        }
      ],
      "expo-localization",
      "expo-secure-store",
      "expo-web-browser"
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: "5f885227-49e3-4a41-be3b-9571706c061e",
      }
    },
    owner: "neildesh-vimana"
  }
};
