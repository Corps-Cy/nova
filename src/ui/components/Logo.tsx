import React from 'react';
import { Box, Text } from 'ink';
import { VERSION } from '../theme.js';

/**
 * CY Logo — 彩色渐变版
 * 
 * 设计理念：赛博朋克风，字符级渐变
 * ◆ 图标：cyan → magenta 渐变
 * "nova"：cyan → blue → magenta 渐变
 * "freelancer toolkit"：白色微渐变
 * 版本号：muted 灰色
 */

// Hex 渐变插值
function lerpColor(a: string, b: string, t: number): string {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** 给每个字符渲染不同颜色，形成渐变效果 */
function GradientText({ text, from, to, bold }: { text: string; from: string; to: string; bold?: boolean }) {
  return (
    <>
      {text.split('').map((char, i) => {
        const t = text.length === 1 ? 0 : i / (text.length - 1);
        const color = lerpColor(from, to, t);
        return <Text key={i} bold={bold} color={color}>{char}</Text>;
      })}
    </>
  );
}

/** 单色文字块 */
function C({ children, color, bold }: { children: string; color: string; bold?: boolean }) {
  return <Text bold={bold} color={color}>{children}</Text>;
}

export function Logo({ compact = false }: { compact?: boolean }) {
  // 赛博朋克渐变色板
  const C1 = '#06b6d4'; // cyan
  const C2 = '#8b5cf6'; // violet
  const C3 = '#ec4899'; // pink
  const C4 = '#f43f5e'; // rose
  const C5 = '#3b82f6'; // blue
  const border = '#4b5563'; // gray-600

  if (compact) {
    return (
      <Box flexDirection="column">
        <C color={border}>{'╭───────────────────────╮'}</C>
        <C color={border}>{'│'}</C>
        <Text>{'  '}</Text>
        <GradientText text="◆" from={C1} to={C3} bold />
        <Text>{' '}</Text>
        <GradientText text="c" from={C1} to={C5} bold />
        <GradientText text="y" from={C5} to={C3} bold />
        <Text>{' '}</Text>
        <GradientText text="·" from={C2} to={C3} />
        <Text>{' '}</Text>
        <GradientText text="freelancer" from="#9ca3af" to="#d1d5db" />
        <Text>{'          '}</Text>
        <C color={border}>{'│'}</C>
        <C color={border}>{'╰──────────────'}</C>
        <C color="#6b7280">{`v${VERSION}`}</C>
        <C color={border}>{'─────╯'}</C>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Line 1: top border with gradient accent */}
      <Box>
        <C color={border}>{'╭'}</C>
        <GradientText text="────────────────────────────" from="#374151" to="#1f2937" />
        <C color={border}>{'╮'}</C>
      </Box>

      {/* Line 2: empty */}
      <Box>
        <C color={border}>{'│'}</C>
        <Text>{'                            '}</Text>
        <C color={border}>{'│'}</C>
      </Box>

      {/* Line 3: Logo content */}
      <Box>
        <C color={border}>{'│'}</C>
        <Text>{'  '}</Text>
        {/* Diamond icon with glow */}
        <GradientText text="◆" from={C1} to={C3} bold />
        <Text>{' '}</Text>
        {/* "nova" gradient */}
        <GradientText text="c" from={C1} to={C5} bold />
        <GradientText text="y" from={C5} to={C3} bold />
        <Text>{'  '}</Text>
        {/* Separator dot */}
        <GradientText text="·" from={C2} to={C3} />
        <Text>{' '}</Text>
        {/* Subtitle */}
        <GradientText text="freelancer toolkit" from="#9ca3af" to="#e5e7eb" />
        <Text>{'  '}</Text>
        <C color={border}>{'│'}</C>
      </Box>

      {/* Line 4: decorative gradient bar */}
      <Box>
        <C color={border}>{'│'}</C>
        <Text>{'  '}</Text>
        <GradientText text="────── ◆ ──────" from={C1} to={C3} />
        <Text>{'              '}</Text>
        <C color={border}>{'│'}</C>
      </Box>

      {/* Line 5: empty */}
      <Box>
        <C color={border}>{'│'}</C>
        <Text>{'                            '}</Text>
        <C color={border}>{'│'}</C>
      </Box>

      {/* Line 6: bottom border with version */}
      <Box>
        <C color={border}>{'╰'}</C>
        <GradientText text="──────────────" from="#374151" to="#1f2937" />
        <C color="#6b7280">{`v${VERSION}`}</C>
        <GradientText text="──────" from="#1f2937" to="#374151" />
        <C color={border}>{'╯'}</C>
      </Box>
    </Box>
  );
}
