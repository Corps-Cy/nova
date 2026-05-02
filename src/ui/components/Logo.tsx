import React from 'react';
import { Box, Text } from 'ink';
import { VERSION } from '../theme.js';

function lerpColor(a: string, b: string, t: number): string {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function gradientChars(text: string, from: string, to: string, bold = false) {
  return text.split('').map((char, i) => {
    const t = text.length === 1 ? 0 : i / (text.length - 1);
    const color = lerpColor(from, to, t);
    return <Text key={i} bold={bold} color={color}>{char}</Text>;
  });
}

const C1 = '#06b6d4';
const C3 = '#ec4899';

/** Full box logo (default `nova` screen) */
function FullLogo() {
  const B = '#4b5563';
  const W = 38;
  const versionStr = `v${VERSION}`;
  const vLen = versionStr.length + 2;
  const barLeft = Math.floor((W - vLen) / 2);
  const barRight = W - vLen - barLeft;

  return (
    <Box flexDirection="column">
      <Text color={B}>{`╭${'─'.repeat(W)}╮`}</Text>
      <Text color={B}>{`│${' '.repeat(W)}│`}</Text>
      <Text>
        <Text color={B}>{`│${' '.repeat(4)}`}</Text>
        {gradientChars('◆  N O V A', C1, C3, true)}
        <Text color={B}>{' '.repeat(W - 12)}│</Text>
      </Text>
      <Text>
        <Text color={B}>{`│${' '.repeat(6)}`}</Text>
        {gradientChars('freelancer toolkit', '#9ca3af', '#e5e7eb')}
        <Text color={B}>{' '.repeat(W - 20)}│</Text>
      </Text>
      <Text color={B}>{`│${' '.repeat(W)}│`}</Text>
      <Text color={B}>{`╰${'─'.repeat(barLeft)} ${versionStr} ${'─'.repeat(barRight)}╯`}</Text>
    </Box>
  );
}

/** Compact single-line logo (Dashboard header) */
function CompactLogo() {
  return (
    <Text>
      <Text color={C1} bold>{'◆'}</Text>
      <Text>{' '}</Text>
      {gradientChars('N O V A', C1, C3, true)}
      <Text>{' '}</Text>
      <Text color="#6b7280">·</Text>
      <Text>{' '}</Text>
      <Text dimColor>{'freelancer toolkit'}</Text>
      <Text>{' '}</Text>
      <Text color="#6b7280">{`v${VERSION}`}</Text>
    </Text>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return compact ? <CompactLogo /> : <FullLogo />;
}
