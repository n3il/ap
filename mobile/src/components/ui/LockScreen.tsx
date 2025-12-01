import ContainerView from "@/components/ContainerView";
import View from "@/components/ui/View";
import { ROUTES } from "@/config/routes";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { useColors } from "@/theme";
import { useRouter } from "expo-router";

export default function LockScreen() {
  const router = useRouter()
  const { colors: palette } = useColors();
  return (
    <ContainerView>
      <View sx={{ justifyContent: "center", alignItems: "center", flex: 1 }}>
        <Pressable onPress={() => router.push(ROUTES.AUTH_INDEX.path)}>
          <MaterialIcons name="lock" size={64} color={palette.muted} />
        </Pressable>
      </View>
    </ContainerView>
  );
}