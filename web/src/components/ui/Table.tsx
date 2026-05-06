import * as React from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-sm', className)}>{children}</table>
    </div>
  )
}

export function TableHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <thead className={cn('border-b border-zinc-800 [&_tr]:border-b-0', className)}>{children}</thead>
}

export function TableBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)}>{children}</tbody>
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { children: React.ReactNode }) {
  return (
    <tr className={cn('border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30', className)} {...props}>
      {children}
    </tr>
  )
}

export function TableHead({ className, children }: { className?: string; children: React.ReactNode }) {
  return <th className={cn('h-10 px-4 text-left align-middle font-medium text-zinc-400', className)}>{children}</th>
}

export function TableCell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <td className={cn('p-4 align-middle text-zinc-300', className)}>{children}</td>
}
