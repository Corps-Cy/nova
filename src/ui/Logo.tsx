import { Box, Text } from 'ink';
import React from 'react';
import { VERSION } from './theme.js';

/**
 * CY Logo — 几何风格，终端友好
 * 
 * 设计说明：
 * - 用 Unicode 方块字符构建几何感
 * - "cy" 用粗体 cyan 品牌色
 * - 右下角动态版本号
 * - 适配大多数终端，避免使用特殊图形字符
 */

export function Logo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Box>
        <Text bold color="cyan">
          {'╭─────────────────────╮\n'}
          {'│                     │\n'}
        </Text>
        <Text bold color="cyan">{'│  '}</Text>
        <Text bold color="cyan">◆</Text>
        <Text bold color="white">{' c'}</Text>
        <Text bold color="cyan">{'y'}</Text>
        <Text bold color="white">{' · '}</Text>
        <Text bold color="yellow">freelancer</Text>
        <Text bold color="cyan">{'        │\n'}</Text>
        <Text bold color="cyan">
          {'│                     │\n'}
          {'╰─────────'}
        </Text>
        <Text color="gray">{`v${VERSION}`}</Text>
        <Text bold color="cyan">{'──╯'}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">{'╭──────────────────────────╮'}</Text>
      <Text bold color="cyan">{'│'}</Text>
      <Text color="cyan">{'                          '}</Text>
      <Text bold color="cyan">{'│'}</Text>
      <Text bold color="cyan">{'│  '}</Text>
      <Text bold color="cyan">{'◆'}</Text>
      <Text bold color="white">{' c'}</Text>
      <Text bold color="cyan">{'y'}</Text>
      <Text bold color="white">{' · '}</Text>
      <Text bold color="yellow">{'freelancer toolkit'}</Text>
      <Text color="cyan">{'  '}</Text>
      <Text bold color="cyan">{'│'}</Text>
      <Text bold color="cyan">{'│'}</Text>
      <Text color="cyan">{'                          '}</Text>
      <Text bold color="cyan">{'│'}</Text>
      <Text bold color="cyan">{'╰──────────────'}</Text>
      <Text color="gray">{`v${VERSION}`}</Text>
      <Text bold color="cyan">{'─────╯'}</Text>
    </Box>
  );
}
