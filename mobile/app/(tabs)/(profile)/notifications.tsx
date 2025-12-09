import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { FadeInDown } from "react-native-reanimated";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import ContainerView from "@/components/ContainerView";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { AnimatedBox } from "@/components/ui/animated";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";
import { Switch } from "react-native";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const colors = useColors();
  const palette = colors.colors;
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    emailEnabled: true,
    agentAlerts: true,
    tradeExecutions: true,
    priceAlerts: false,
    marketNews: false,
    weeklyReports: true,
  });

  useEffect(() => {
    // Request permissions on mount
    registerForPushNotificationsAsync();

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    // Listen for notification responses (user tapped notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification response:", response);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return;
      }

      // Configure notification channel for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    } catch (error) {
      console.log("Error getting notification permissions:", error);
    }
  };

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTestNotification = async () => {
    if (!notifications.pushEnabled) {
      Alert.alert(
        "Notifications Disabled",
        "Please enable push notifications to test",
      );
      return;
    }

    try {
      // Request permissions if not already granted
      const { status } = await Notifications.getPermissionsAsync();

      if (status !== "granted") {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to test notifications.",
          );
          return;
        }
      }

      // Schedule a local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification 🔔",
          body: "This is a test notification! If you can see this, your notifications are working correctly.",
          data: { test: true },
          sound: true,
        },
        trigger: null, // Send immediately
      });

      Alert.alert(
        "Notification Sent!",
        "Check your notification tray. The notification should appear shortly.",
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("Error sending notification:", error);
      Alert.alert(
        "Error",
        "Failed to send test notification. Please try again.",
      );
    }
  };

  const notificationSections = [
    {
      title: "General",
      items: [
        {
          key: "pushEnabled" as const,
          label: "Push Notifications",
          description: "Receive push notifications on your device",
          icon: "notifications-outline",
        },
        {
          key: "emailEnabled" as const,
          label: "Email Notifications",
          description: "Receive notifications via email",
          icon: "mail-outline",
        },
      ],
    },
    {
      title: "Trading Alerts",
      items: [
        {
          key: "agentAlerts" as const,
          label: "Agent Alerts",
          description: "Get notified about agent activity and status changes",
          icon: "warning-outline",
        },
        {
          key: "tradeExecutions" as const,
          label: "Trade Executions",
          description: "Notifications when trades are executed",
          icon: "swap-horizontal-outline",
        },
        {
          key: "priceAlerts" as const,
          label: "Price Alerts",
          description: "Get alerted when prices hit your targets",
          icon: "trending-up-outline",
        },
      ],
    },
    {
      title: "Updates",
      items: [
        {
          key: "marketNews" as const,
          label: "Market News",
          description: "Receive important market updates and news",
          icon: "newspaper-outline",
        },
        {
          key: "weeklyReports" as const,
          label: "Weekly Reports",
          description: "Get weekly performance summaries",
          icon: "bar-chart-outline",
        },
      ],
    },
  ];

  return (
    <ContainerView style={{ flex: 1 }}>
      <View
        sx={{
          paddingHorizontal: 6,
          paddingTop: 4,
          paddingBottom: 6,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          sx={{
            marginRight: 4,
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "full",
            backgroundColor: "surface",
          }}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <View sx={{ flex: 1 }}>
          <Text variant="2xl" sx={{ fontWeight: "700", color: "textPrimary" }}>
            Notifications
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 18, paddingBottom: "40%" }}
      >
        {notificationSections.map((section, sectionIndex) => (
          <AnimatedBox
            key={section.title}
            entering={FadeInDown.delay(100 + sectionIndex * 100).springify()}
            sx={{ paddingHorizontal: 6 }}
          >
            <GlassView
              glassEffectStyle="clear"

              style={{
                borderRadius: 24,
                padding: 20,
              }}
            >
              <Text
                variant="lg"
                sx={{
                  fontWeight: "700",
                  color: "textPrimary",
                  marginBottom: 4,
                }}
              >
                {section.title}
              </Text>

              {section.items.map((item, itemIndex) => (
                <View key={item.key}>
                  {itemIndex > 0 && (
                    <View sx={{ height: 1, backgroundColor: "border" }} />
                  )}
                  <View
                    sx={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 3,
                    }}
                  >
                    <View
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "full",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 3,
                        backgroundColor: colors.withOpacity(
                          palette.brand500 ?? palette.info,
                          0.15,
                        ),
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={palette.brand500 ?? palette.info}
                      />
                    </View>
                    <View sx={{ flex: 1 }}>
                      <Text
                        sx={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "textPrimary",
                        }}
                      >
                        {item.label}
                      </Text>
                      <Text variant="sm" tone="muted" sx={{ marginTop: 0.5 }}>
                        {item.description}
                      </Text>
                    </View>
                    <Switch
                      value={notifications[item.key]}
                      onValueChange={() => handleToggle(item.key)}
                      trackColor={{
                        false: palette.muted,
                        true: palette.brand500 ?? palette.info,
                      }}
                      thumbColor={
                        notifications[item.key]
                          ? palette.background
                          : palette.mutedForeground
                      }
                    />
                  </View>
                </View>
              ))}
            </GlassView>
          </AnimatedBox>
        ))}

        <AnimatedBox
          entering={FadeInDown.delay(400).springify()}
          sx={{ paddingHorizontal: 6, marginTop: 4 }}
        >
          <TouchableOpacity
            onPress={handleTestNotification}
            activeOpacity={0.8}
            sx={{
              borderRadius: "xl",
              overflow: "hidden",
              backgroundColor: colors.withOpacity(
                palette.brand500 ?? palette.info,
                0.15,
              ),
              borderWidth: 1,
              borderColor: colors.withOpacity(
                palette.brand500 ?? palette.info,
                0.3,
              ),
            }}
          >
            <View
              sx={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 4,
                paddingHorizontal: 6,
              }}
            >
              <Ionicons
                name="rocket-outline"
                size={22}
                color={palette.brand500 ?? palette.info}
              />
              <Text
                sx={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: palette.brand500 ?? palette.info,
                  marginLeft: 2,
                }}
              >
                Test Notifications
              </Text>
            </View>
          </TouchableOpacity>
        </AnimatedBox>
      </ScrollView>
    </ContainerView>
  );
}
