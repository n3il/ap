import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { TouchableOpacity, View } from "@/components/ui";
import { useColors } from "@/theme";

const AgentHeader = ({ isOwnAgent = false, onManagePress }) => {
  const router = useRouter();
  const { colors: palette } = useColors();

  return (
    <BlurView intensity={80} tint="dark" style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={palette.foreground}
          />
        </TouchableOpacity>

        <View style={styles.spacer} />

        {isOwnAgent && onManagePress && (
          <TouchableOpacity onPress={onManagePress} style={styles.manageButton}>
            <MaterialCommunityIcons
              name="dots-horizontal"
              size={22}
              color={palette.brand300 ?? palette.brand400 ?? palette.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === "ios" ? 44 : 0, // Status bar height
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 8,
  },
  backButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  spacer: {
    flex: 1,
  },
  manageButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
});

export default AgentHeader;
