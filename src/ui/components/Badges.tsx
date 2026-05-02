import React from 'react';
import { Box, Text } from 'ink';
import { statusMap, colors } from '../theme.js';

/** 状态标签组件 */
export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status];
  if (!s) return <Text> {status}</Text>;
  return <Text>{' '}<Text color={s.color}>● {s.label}</Text></Text>;
}

/** 优先级标签 */
export function PriorityBadge({ priority }: { priority: string }) {
  const p = statusMap[priority];
  if (!p || priority === 'medium') return <></>;
  const icon = priority === 'high' ? '🔴' : '⚪';
  return (
    <Text color={p.color}> {icon} {p.label}</Text>
  );
}

/** 进度条 */
export function ProgressBar({ value, max, width = 20, color = colors.primary }: { value: number; max: number; width?: number; color?: string }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const filled = Math.round(pct * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return (
    <Text color={color}>{bar} {Math.round(pct * 100)}%</Text>
  );
}

/** 金额高亮 */
export function Money({ amount, bold }: { amount: number; bold?: boolean }) {
  const formatted = `¥${amount.toLocaleString('zh-CN')}`;
  return (
    <Text color={amount > 0 ? 'green' : 'gray'} bold={bold}>{formatted}</Text>
  );
}

/** 分隔线 */
export function Divider({ char = '─', width = 40, color = 'gray' }: { char?: string; width?: number; color?: string }) {
  return <Text color={color}>{char.repeat(width)}</Text>;
}

/** 键值行 */
export function KeyValue({ label, children, indent = 1 }: { label: string; children: React.ReactNode; indent?: number }) {
  return (
    <Box>
      <Text dimColor>{'  '.repeat(indent)}</Text>
      <Text dimColor>{label}:</Text>
      <Text> {children}</Text>
    </Box>
  );
}
