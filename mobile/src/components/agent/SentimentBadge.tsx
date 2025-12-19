import { sentimentToColor } from "@/utils/currency";
import { StatusBadge } from "../ui";
import { Text } from "dripsy";

export default function SentimentBadge({ sentimentScore, sentimentWord }) {
  return (
    <Text
      variant="xs"
      sx={{
        backgroundColor: sentimentToColor(sentimentScore),
        fontStyle: "italic",
        fontWeight: "900",
        paddingHorizontal: 1,
        color: "#fff",
        textAlign: "left",
        alignSelf: "flex-start",

        textShadowColor: "rgba(0,0,0,0.6)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }}
    >
      feeling {sentimentWord?.toLowerCase()} {`(${sentimentScore})`}
    </Text>
  );
}
