import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  title: string;
}

export function Header({ title }: Props) {
  return (
    <Box borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">🚀 {title}</Text>
    </Box>
  );
}
