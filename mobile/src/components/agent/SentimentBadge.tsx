import { sentimentToColor } from "@/utils/currency";
import { StatusBadge, Text } from "../ui";



export default function SentimentBadge({
  sentimentScore,
  sentimentWord,
}) {
  return (
    <Text
      variant="xs"
      sx={{
        backgroundColor: sentimentToColor(
          sentimentScore,
        ),
        fontStyle: "italic",
        fontWeight: "900",
        marginBottom: 2,
        paddingHorizontal: 1,
        color: "#fff",
        textAlign: "left",
        alignSelf: 'flex-start',
      }}
    >
      feeling {sentimentWord?.toLowerCase()}{" "}
      {`(${sentimentScore})`}
    </Text>
  )
}