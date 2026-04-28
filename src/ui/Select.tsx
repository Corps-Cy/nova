import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  onSelect: (value: string) => void;
  title?: string;
}

export function Select({ options, onSelect, title }: Props) {
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) setCursor(c => Math.max(0, c - 1));
    if (key.downArrow) setCursor(c => Math.min(options.length - 1, c + 1));
    if (key.return) onSelect(options[cursor].value);
    if (input >= '1' && input <= String(options.length)) {
      const idx = parseInt(input) - 1;
      onSelect(options[idx].value);
    }
  });

  return (
    <Box flexDirection="column">
      {title && <Text bold>{title}</Text>}
      {options.map((opt, i) => (
        <Box key={opt.value}>
          <Text color={i === cursor ? 'cyan' : 'gray'}>
            {i === cursor ? '❯ ' : '  '}
          </Text>
          <Text color={i === cursor ? 'cyan' : 'white'}>
            {opt.label}
          </Text>
        </Box>
      ))}
      <Text dimColor>↑↓ 选择，回车确认</Text>
    </Box>
  );
}
