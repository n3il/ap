import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Text } from '@/components/ui';
import Markdown from 'react-native-markdown-display';
import { useMutation } from '@tanstack/react-query';
import CodeBlock from '@/components/CodeBlock';
import ContainerView from '@/components/ContainerView';
import GlassVariations from '@/components/GlassVariations';
import { useColors } from '@/theme';

const BASE_URL = 'http://192.168.4.78:24574';

export default function HomeScreen() {
  const colors = useColors();
  const palette = colors.colors;
  const markdownStyles = useMemo(() => {
    const codeBackground = palette.surfaceSecondary ?? palette.surface;
    const borderColor = palette.border ?? palette.surfaceSecondary;
    return {
      body: {
        fontSize: 15,
      },
      heading1: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
      },
      heading2: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
      },
      heading3: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 6,
      },
      code_inline: {
        backgroundColor: colors.withOpacity(codeBackground, 0.8),
        borderRadius: 3,
        padding: 2,
        fontFamily: 'monospace',
        flexWrap: 'wrap',
      },
      code_block: {
        backgroundColor: colors.withOpacity(codeBackground, 0.9),
        borderRadius: 5,
        padding: 10,
        marginVertical: 10,
        fontFamily: 'monospace',
        fontSize: 12,
        flexWrap: 'wrap',
      },
      fence: {
        backgroundColor: colors.withOpacity(codeBackground, 0.9),
        borderRadius: 5,
        padding: 10,
        marginVertical: 10,
        fontFamily: 'monospace',
        flexWrap: 'wrap',
      },
      table: {
        borderWidth: 1,
        borderColor,
        borderRadius: 5,
        marginVertical: 10,
      },
      thead: {
        backgroundColor: colors.withOpacity(codeBackground, 0.8),
      },
      tr: {
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
      },
      th: {
        fontWeight: 'bold',
        padding: 8,
      },
      td: {
        padding: 8,
      },
      link: {
        color: 'info',
      },
      blockquote: {
        backgroundColor: colors.withOpacity(codeBackground, 0.7),
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
        paddingLeft: 10,
        marginVertical: 10,
      },
      list_item: {
        marginVertical: 4,
      },
    };
  }, [colors, palette]);
  const triggerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${BASE_URL}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: "lightning",
          prompt: "",
          api_key: "",
          model: ""
        })
      });
      if (!response.ok) {
        throw new Error('Trigger request failed');
      }
      return response.json();
    },
    onError: (error) => {
      console.error('Trigger request failed:', error);
    },
  });

  return (
    <ContainerView>
      <View sx={{ flex: 1, marginTop: 60 }}>
        <ScrollView
          sx={{ flex: 1, padding: 4 }}
          contentContainerStyle={{ paddingBottom: 500 }}
        >
          <GlassVariations />

          <Markdown
            style={markdownStyles}
            rules={{
              fence: (node, children, parent, styles) => {
                return (
                  <CodeBlock
                    key={node.key}
                    code={node.content}
                    language="go"
                  />
                );
              },
              code_block: (node, children, parent, styles) => {
                return (
                  <CodeBlock
                    key={node.key}
                    code={node.content}
                    language="go"
                  />
                );
              },
            }}
          >
            {triggerMutation.data?.response || ""}
          </Markdown>
        </ScrollView>
      </View>
    </ContainerView>
  );
}
