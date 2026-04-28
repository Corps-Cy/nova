import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme.js';

interface Props {
  title: string;
}

export function Header({ title }: Props) {
  return (
    <Box borderStyle="round" borderColor={colors.primary} paddingX={1}>
      <Text bold color={colors.primary}>◆ {title}</Text>
    </Box>
  );
}
