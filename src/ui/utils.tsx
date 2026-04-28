import React from 'react';
import { Box, Text } from 'ink';

const statusColor: Record<string, string> = {
  todo: 'gray',
  doing: 'yellow',
  done: 'green',
  requirement: 'blue',
  development: 'yellow',
  review: 'magenta',
  delivered: 'green',
};

const statusLabel: Record<string, string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
  requirement: '需求中',
  development: '开发中',
  review: '验收中',
  delivered: '已交付',
  high: '高',
  medium: '中',
  low: '低',
};

export function colorizeStatus(status: string) {
  const color = statusColor[status] || 'white';
  const label = statusLabel[status] || status;
  return <Text color={color}>{label}</Text>;
}

export function formatMoney(n: number) {
  return `¥${n.toLocaleString('zh-CN')}`;
}

export function ellipsis(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + '…' : s;
}
