import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme.js';

interface Props {
  placeholder?: string;
  label?: string;
  onSubmit: (value: string) => void;
  mask?: boolean; // password mode
}

export function Input({ placeholder, label, onSubmit, mask }: Props) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(true);

  useInput((input, key) => {
    if (!focused) return;
    if (key.return) {
      if (value.trim()) onSubmit(value.trim());
    } else if (key.backspace || key.delete) {
      setValue(v => v.slice(0, -1));
    } else if (!key.ctrl && !key.meta && input && input.length === 1) {
      setValue(v => v + input);
    }
  });

  const display = mask ? '●'.repeat(value.length) : value;

  return (
    <Box marginY={0}>
      {label && <Text color={colors.primary}>{label}</Text>}
      <Box>
        <Text color={colors.primary}>▸ </Text>
        {display ? (
          <Text>{display}</Text>
        ) : (
          <Text dimColor>{placeholder || ''}</Text>
        )}
        <Text color={focused ? colors.primary : 'gray'}>█</Text>
      </Box>
    </Box>
  );
}
