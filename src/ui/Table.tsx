import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  title: string;
  items: string[][];
  widths?: number[];
}

export function Table({ title, items, widths }: Props) {
  if (items.length === 0) {
    return (
      <Box flexDirection="column">
        <Text bold color="yellow">{title}</Text>
        <Text dimColor>  暂无数据</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="yellow">{title}</Text>
      {items.map((row, i) => (
        <Box key={i}>
          {row.map((cell, j) => (
            <Text key={j} width={widths?.[j]} wrap="truncate">
              {cell}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}
