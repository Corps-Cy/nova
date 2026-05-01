import React from 'react';
import { Box, Text } from 'ink';

interface Col {
  key: string;
  label: string;
  width: number;
  align?: 'left' | 'right';
  render?: (value: any, row: Record<string, any>) => React.ReactNode;
}

interface Props {
  columns: Col[];
  rows: Record<string, any>[];
  emptyText?: string;
  footer?: string;
}

export function Table({ columns, rows, emptyText = '暂无数据', footer }: Props) {
  if (rows.length === 0) {
    return (
      <Box flexDirection="column" marginY={1}>
        <Box>
          <Text dimColor>  💤 {emptyText}</Text>
        </Box>
      </Box>
    );
  }

  const separator = columns.map(c => '─'.repeat(c.width + 2)).join('─');

  return (
    <Box flexDirection="column" marginY={1}>
      {/* Header row */}
      <Box>
        <Text color="gray">  </Text>
        {columns.map(col => (
          <Text key={col.key} bold color="gray" width={col.width + 2} wrap="truncate-end">
            {col.label}
          </Text>
        ))}
      </Box>
      {/* Separator */}
      <Box>
        <Text color="gray">  </Text>
        <Text color="gray">{separator}</Text>
      </Box>
      {/* Data rows */}
      {rows.map((row, i) => (
        <Box key={i}>
          <Text color="gray">  </Text>
          {columns.map(col => {
            const raw = row[col.key];
            if (col.render) {
              return <Box key={col.key} width={col.width + 2}>{col.render(raw, row)}</Box>;
            }
            return (
              <Text key={col.key} width={col.width + 2} wrap="truncate-end">
                {String(raw ?? '')}
              </Text>
            );
          })}
        </Box>
      ))}
      {/* Footer */}
      {footer && (
        <Box marginTop={0}>
          <Text color="gray">  {footer}</Text>
        </Box>
      )}
    </Box>
  );
}
