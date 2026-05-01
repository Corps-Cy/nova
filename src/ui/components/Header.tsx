import React from 'react';
import { Box, Text } from 'ink';
import { colors, statusMap } from '../theme.js';

interface Props {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: Props) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box borderStyle="round" borderColor={colors.primary} paddingX={2} paddingY={0}>
        <Box>
          <Text bold color={colors.primary}>◆ </Text>
          <Text bold>{title}</Text>
          {subtitle && <Text dimColor> — {subtitle}</Text>}
        </Box>
      </Box>
    </Box>
  );
}
