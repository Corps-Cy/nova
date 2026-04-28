import React from 'react';
import { Box, Text } from 'ink';

interface Col { key: string; label: string; width: number; align?: 'left' | 'right' }

interface Props {
  title?: string;
  columns: Col[];
  rows: Record<string, any>[];
  emptyText?: string;
}

export function Table({ title, columns, rows, emptyText = '暂无数据' }: Props) {
  if (rows.length === 0) {
    return (
      <Box flexDirection="column">
        {title && <Text bold color="yellow">{title}</Text>}
        <Text dimColor>  {emptyText}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {title && <Box marginBottom={0}>
        <Text bold color="yellow">{title}</Text>
      </Box>}
      {/* Header */}
      <Box>
        {columns.map(col => (
          <Text key={col.key} bold width={col.width + 2} wrap="truncate-end">
            {col.label}
          </Text>
        ))}
      </Box>
      {/* Rows */}
      {rows.map((row, i) => (
        <Box key={i}>
          {columns.map(col => (
            <Text key={col.key} width={col.width + 2} wrap="truncate-end">
              {String(row[col.key] ?? '')}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}
