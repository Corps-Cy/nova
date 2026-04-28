import React from 'react';
import { Text } from 'ink';
import { statusMap } from './theme.js';

export function colorizeStatus(status: string) {
  const s = statusMap[status];
  if (!s) return <Text>{status}</Text>;
  return <Text color={s.color}>{s.label}</Text>;
}

export function formatMoney(n: number) {
  return `¥${n.toLocaleString('zh-CN')}`;
}

export function ellipsis(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + '…' : s;
}
