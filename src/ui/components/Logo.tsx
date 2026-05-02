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

/** Gradient text — all chars wrapped in one <Text> for inline rendering */
function G({ text, from, to, bold }: { text: string; from: string; to: string; bold?: boolean }) {
  const chars = text.split('').map((char, i) => {
    const t = text.length === 1 ? 0 : i / (text.length - 1);
    const color = lerpColor(from, to, t);
    return <Text key={i} bold={bold} color={color}>{char}</Text>;
  });
  return <Text>{chars}</Text>;
}

const CY = '#06b6d4';
const VT = '#8b5cf6';
const PK = '#ec4899';
const BL = '#3b82f6';
const RD = '#f43f5e';
const GR = '#374151';

export function Logo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Text>
        <Text color={CY} bold>{'◆'}</Text>
        <Text>{' '}</Text>
        <G text="N O V A" from={CY} to={PK} bold />
        <Text>{' '}</Text>
        <Text color="#6b7280">·</Text>
        <Text>{' '}</Text>
        <Text dimColor>{'freelancer toolkit'}</Text>
        <Text>{' '}</Text>
        <Text color="#6b7280">{`v${VERSION}`}</Text>
      </Text>
    );
  }

  const W = 42;
  const pad = (n: number) => ' '.repeat(n);

  return (
    <Box flexDirection="column">
      {/* Top */}
      <Text color={GR}>{`╔${'═'.repeat(W)}╗`}</Text>
      <Text color={GR}>{`║${pad(W)}║`}</Text>

      {/* Block art — single Text per line */}
      <Text>
        <Text color={GR}>{'║'}</Text>
        <Text>{pad(2)}</Text>
        <G text="███" from={CY} to={BL} />
        <Text>{'  '}</Text>
        <G text="████" from={BL} to={VT} />
        <Text>{'  '}</Text>
        <G text="██" from={VT} to={PK} />
        <Text>{'  '}</Text>
        <G text="█" from={PK} to={RD} />
        <Text color={GR}>{pad(W - 18)}║</Text>
      </Text>

      {/* N O V A letters */}
      <Text>
        <Text color={GR}>{'║'}</Text>
        <Text>{pad(6)}</Text>
        <G text="N   O   V   A" from={CY} to={PK} bold />
        <Text color={GR}>{pad(W - 20)}║</Text>
      </Text>

      {/* Gradient separator */}
      <Text>
        <Text color={GR}>{'║'}</Text>
        <Text>{pad(2)}</Text>
        <G text="━━━━━━━━━━ ◆ ━━━━━━━━━━" from={CY} to={PK} />
        <Text color={GR}>{pad(W - 24)}║</Text>
      </Text>

      {/* Subtitle */}
      <Text>
        <Text color={GR}>{'║'}</Text>
        <Text>{pad(4)}</Text>
        <G text="freelancer toolkit" from="#9ca3af" to="#e5e7eb" />
        <Text color={GR}>{pad(W - 20)}║</Text>
      </Text>

      <Text color={GR}>{`║${pad(W)}║`}</Text>

      {/* Bottom */}
      <Text color={GR}>{`╚${'═'.repeat(W)}╝`}</Text>
    </Box>
  );
}
