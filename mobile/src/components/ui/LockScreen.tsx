import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import ContainerView from "@/components/ContainerView";
import View from "@/components/ui/View";
import { ROUTES } from "@/config/routes";
import { useColors } from "@/theme";

export default function LockScreen() {
  const router = useRouter();
  const { colors: palette } = useColors();
  return (
    <ContainerView>
      <View sx={{ justifyContent: "center", alignItems: "center", flex: 1 }}>
        <Pressable onPress={() => router.push(ROUTES.AUTH_INDEX.path)}>
          <MaterialIcons
            name="lock"
            size={64}
            color={palette.muted?.DEFAULT ?? palette.muted}
          />
        </Pressable>
      </View>
    </ContainerView>
  );
}
