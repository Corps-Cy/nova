import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsProps {
  value: string
  onValueChange: (v: string) => void
  children: React.ReactNode
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  return <div>{children}</div>
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-zinc-800/50 p-1', className)}>
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  activeValue?: string
  onActiveChange?: (v: string) => void
  children: React.ReactNode
  className?: string
}

export function TabsTrigger({ value, activeValue, onActiveChange, children, className }: TabsTriggerProps) {
  const isActive = activeValue === value
  return (
    <button
      onClick={() => onActiveChange?.(value)}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        isActive ? 'bg-brand text-white' : 'text-zinc-400 hover:text-zinc-200',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mt-4', className)}>{children}</div>
}
