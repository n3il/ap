import TimeFrameSelector from "@/components/chart/TimeFrameSelector";
// import { Button } from "@/components/ui/button";
// import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ChartToolBar() {
  return (
    <>
      <TimeFrameSelector />

      {/* <View sx={{ alignItems: 'flex-end', marginTop: 0, width: '100%', display: 'none' }}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setExpanded(!expanded)}
          sx={{ opacity: 0.3 }}
        >
          {expanded
          ? (
            <MaterialCommunityIcons name="fullscreen-exit" size={24} color="white" />
          )
          : (
            <MaterialCommunityIcons name="fullscreen" size={24} color="white" />
          )}
        </Button>
      </View> */}
    </>
  )
}