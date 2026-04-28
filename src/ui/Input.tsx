import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface Props {
  placeholder?: string;
  onSubmit: (value: string) => void;
}

export function Input({ placeholder, onSubmit }: Props) {
  const [value, setValue] = useState('');

  useInput((input, key) => {
    if (key.return) {
      onSubmit(value);
    } else if (key.backspace || key.delete) {
      setValue(v => v.slice(0, -1));
    } else if (!key.ctrl && !key.meta && input) {
      setValue(v => v + input);
    }
  });

  return (
    <Box>
      <Text color="cyan">▸ </Text>
      {value ? <Text>{value}</Text> : <Text dimColor>{placeholder || ''}</Text>}
      <Text color="gray">█</Text>
    </Box>
  );
}
