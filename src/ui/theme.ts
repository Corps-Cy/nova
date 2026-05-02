export const VERSION = '0.8.0';

/**
 * Nova Theme System
 * 
 * 设计理念：深色终端 + 高对比度强调色
 * 主色调：青蓝 (#06b6d4) — 科技感、专业、冷静
 * 辅助色：琥珀 (#f59e0b) — 温暖、行动、重要
 * 状态色：语义化，直觉映射
 */

export const theme = {
  /** 主品牌色 - 青蓝 */
  primary: '#06b6d4',
  /** 辅助强调色 - 琥珀 */
  accent: '#f59e0b',
  /** 成功/完成 */
  success: '#22c55e',
  /** 警告/进行中 */
  warning: '#eab308',
  /** 错误/高优先 */
  error: '#ef4444',
  /** 信息 */
  info: '#3b82f6',
  /** 暗淡/次要文字 */
  muted: '#6b7280',
  /** 品牌色（兼容 ink 命名） */
  brand: 'cyan',
  accentInk: 'yellow',
} as const;

/** Ink 兼容的颜色映射 */
export const colors = {
  primary: 'cyan' as const,
  accent: 'yellow' as const,
  success: 'green' as const,
  warning: 'yellow' as const,
  error: 'red' as const,
  info: 'blue' as const,
  muted: 'gray' as const,
  brand: 'cyan' as const,
} as const;

/** 状态 → 颜色/标签 映射 */
export const statusMap: Record<string, { color: string; label: string }> = {
  // 任务状态
  todo:        { color: 'gray',   label: '待办' },
  doing:       { color: 'yellow', label: '进行中' },
  done:        { color: 'green',  label: '已完成' },
  // 项目状态
  requirement: { color: 'blue',   label: '需求中' },
  development: { color: 'yellow', label: '开发中' },
  review:      { color: 'magenta',label: '验收中' },
  delivered:   { color: 'green',  label: '已交付' },
  // 优先级
  high:        { color: 'red',    label: '高' },
  medium:      { color: 'yellow', label: '中' },
  low:         { color: 'gray',   label: '低' },
};
