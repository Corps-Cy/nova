import { cn } from '@/lib/utils'

export function Avatar({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-medium text-white', className)}>
      {children}
    </div>
  )
}
