import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme.js';

interface Option {
  label: string;
  value: string;
  description?: string;
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
      onSelect(options[parseInt(input) - 1].value);
    }
    if (input === 'q' || input === 'Q') {
      onSelect('__cancel__');
    }
  });

  return (
    <Box flexDirection="column" marginY={1}>
      {title && (
        <Box marginBottom={0}>
          <Text bold color={colors.primary}>  {title}</Text>
        </Box>
      )}
      {options.map((opt, i) => {
        const active = i === cursor;
        return (
          <Box key={opt.value}>
            <Text color={active ? colors.primary : 'gray'}>
              {active ? '❯' : ' '}
            </Text>
            <Text color={active ? colors.primary : 'gray'}>
              {active ? ' ' : ' '}
            </Text>
            <Text bold={active} color={active ? 'white' : 'gray'}>
              {opt.label}
            </Text>
            {opt.description && (
              <Text dimColor>  {opt.description}</Text>
            )}
          </Box>
        );
      })}
      <Box marginTop={0}>
        <Text dimColor>  ↑↓ 移动 · 回车选择 · 数字快捷 · q 取消</Text>
      </Box>
    </Box>
  );
}
