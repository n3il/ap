import React from 'react';

import { Box, Text } from '@/components/ui';

type TokenType =
  | 'comment'
  | 'string'
  | 'keyword'
  | 'number'
  | 'operator'
  | 'punctuation'
  | 'function'
  | 'plain';

interface Token {
  type: TokenType;
  value: string;
}

const patterns: Record<Exclude<TokenType, 'plain'>, RegExp> = {
  comment: /\/\/.*|\/\*[\s\S]*?\*\/|#.*/g,
  string: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g,
  keyword:
    /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch|throw|new|this|super|extends|static|public|private|protected|void|int|string|boolean|true|false|null|undefined|typeof|instanceof|in|of|break|continue|switch|case|def|lambda|yield|with|as|assert|pass|raise|finally|global|nonlocal|del|is|not|and|or|print|range|len|self|None|True|False|package|interface|implements|enum|type|struct|map|chan|go|defer|select|fallthrough|goto|func|make|append|copy|delete|panic|recover)\b/g,
  number: /\b\d+\.?\d*\b/g,
  operator: /[+\-*/%=<>!&|^~?:]+/g,
  punctuation: /[{}\[\]();,.]/g,
  function: /\b([a-zA-Z_]\w*)\s*(?=\()/g,
};

const tokenize = (code: string): Token[] => {
  const matches: Array<Token & { start: number; end: number }> = [];

  (Object.entries(patterns) as Array<[Exclude<TokenType, 'plain'>, RegExp]>).forEach(
    ([type, pattern]) => {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(code)) != null) {
        matches.push({
          type,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    },
  );

  matches.sort((a, b) => a.start - b.start);

  const filtered: typeof matches = [];
  let lastEnd = 0;
  matches.forEach((match) => {
    if (match.start >= lastEnd) {
      filtered.push(match);
      lastEnd = match.end;
    }
  });

  const tokens: Token[] = [];
  let cursor = 0;

  filtered.forEach((match) => {
    if (match.start > cursor) {
      tokens.push({
        type: 'plain',
        value: code.slice(cursor, match.start),
      });
    }
    tokens.push({
      type: match.type,
      value: match.value,
    });
    cursor = match.end;
  });

  if (cursor < code.length) {
    tokens.push({
      type: 'plain',
      value: code.slice(cursor),
    });
  }

  return tokens;
};

const tokenStyles: Record<TokenType, { color?: string; fontWeight?: 'bold'; fontStyle?: 'italic' }> = {
  comment: { color: '#6a737d', fontStyle: 'italic' },
  string: { color: '#032f62' },
  keyword: { color: '#d73a49', fontWeight: 'bold' },
  number: { color: '#005cc5' },
  operator: { color: '#d73a49' },
  function: { color: '#6f42c1' },
  punctuation: { color: '#24292e' },
  plain: { color: '#24292e' },
};

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const tokens = tokenize(code ?? '');

  return (
    <Box
      sx={{
        backgroundColor: 'surface',
        borderWidth: 1,
        borderColor: 'border',
        borderRadius: 'md',
        padding: 4,
        marginVertical: 2.5,
      }}
    >
      <Text
        variant="sm"
        sx={{
          fontFamily: 'monospace',
          lineHeight: 20,
        }}
      >
        {tokens.map((token, index) => (
          <Text key={`${token.type}-${index}`} style={tokenStyles[token.type]}>
            {token.value}
          </Text>
        ))}
      </Text>
    </Box>
  );
}
