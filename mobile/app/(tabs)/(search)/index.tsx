import { ScrollView } from "react-native";
import ContainerView from "@/components/ContainerView";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/theme";
import { View } from "dripsy";

export default function SearchIndex() {
  const { colors: palette } = useColors();
  return (
    <ContainerView>
      <ScrollView>
        <View
          sx={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            padding: 10,
            opacity: 0.1,
          }}
        >
          <MaterialCommunityIcons name="magnify" size={90} color={palette.foreground} />
        </View>
      </ScrollView>
    </ContainerView>
  );
}
