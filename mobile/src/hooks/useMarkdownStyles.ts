import { useMemo } from "react";
import { useColors } from "@/theme";

export default function useMarkdownStyles() {
  const { colors: palette, withOpacity } = useColors();
  const markdownStyles = useMemo(
    () => ({
      body: {
        color: palette.textPrimary as string,
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "300",
      },
      paragraph: {
        marginTop: 0,
        marginBottom: 8,
        color: palette.textPrimary as string,
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "300",
      },
      heading1: {
        color: palette.textPrimary as string,
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
        marginTop: 12,
      },
      heading2: {
        color: palette.textPrimary as string,
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 6,
        marginTop: 10,
      },
      heading3: {
        color: palette.textPrimary as string,
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
        marginTop: 8,
      },
      strong: {
        fontWeight: "700",
        color: palette.textPrimary as string,
      },
      em: {
        fontStyle: "italic",
        color: palette.textSecondary as string,
      },
      code_inline: {
        backgroundColor: withOpacity(
          palette.surface ?? (palette.background as string),
          0.5,
        ),
        color: palette.primary as string,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: "monospace",
        fontSize: 13,
      },
      code_block: {
        backgroundColor: withOpacity(
          palette.surface ?? (palette.background as string),
          0.5,
        ),
        color: palette.textSecondary as string,
        padding: 12,
        borderRadius: 8,
        fontFamily: "monospace",
        fontSize: 12,
        marginVertical: 8,
      },
      fence: {
        backgroundColor: withOpacity(
          palette.surface ?? (palette.background as string),
          0.5,
        ),
        color: palette.textSecondary as string,
        padding: 12,
        borderRadius: 8,
        fontFamily: "monospace",
        fontSize: 12,
        marginVertical: 8,
      },
      bullet_list: {
        marginVertical: 4,
      },
      ordered_list: {
        marginVertical: 4,
      },
      list_item: {
        marginVertical: 2,
        color: palette.textPrimary as string,
        fontSize: 14,
        lineHeight: 22,
      },
      blockquote: {
        backgroundColor: withOpacity(
          (palette?.surface ?? palette?.background) as string,
          0.3,
        ),
        borderLeftWidth: 3,
        borderLeftColor: palette?.primary as string,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginVertical: 8,
        borderRadius: 4,
      },
      link: {
        color: palette.primary as string,
        textDecorationLine: "underline",
      },
      hr: {
        backgroundColor: withOpacity(palette.foreground as string, 0.2),
        height: 1,
        marginVertical: 12,
      },
    }),
    [palette, withOpacity],
  );

  return markdownStyles;
}
