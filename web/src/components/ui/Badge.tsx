import { cn } from '@/lib/utils'

export function Badge({ className = '', variant = 'default', children }: { className?: string; variant?: 'default' | 'success' | 'warning' | 'error'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-zinc-800 text-zinc-300',
        variant === 'success' && 'bg-green-900/50 text-green-400',
        variant === 'warning' && 'bg-yellow-900/50 text-yellow-400',
        variant === 'error' && 'bg-red-900/50 text-red-400',
        className,
      )}
    >
      {children}
    </span>
  )
}
