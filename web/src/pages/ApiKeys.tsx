import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Dialog, DialogHeader, DialogFooter } from '@/components/ui/Dialog'
import { apiKeyApi } from '@/api/stats'
import { useToast } from '@/hooks/useToast'
import type { ApiKey } from '@/types'
import { Plus, Copy, Trash2, Key } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showKey, setShowKey] = useState<string | null>(null)
  const { addToast } = useToast()

  const load = () => {
    setLoading(true)
    apiKeyApi.list()
      .then(setKeys)
      .catch(() => addToast('加载失败', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      const res = await apiKeyApi.create(newKeyName.trim())
      addToast('创建成功，请立即复制 Key', 'success')
      setShowKey(res.key)
      setCreateOpen(false)
      setNewKeyName('')
      load()
    } catch (err: any) {
      addToast(err.message || '创建失败', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除？')) return
    try {
      await apiKeyApi.delete(id)
      addToast('已删除', 'success')
      load()
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    addToast('已复制', 'success')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-brand" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-100">API Keys</h2>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" />创建 Key</Button>
      </div>

      {/* Show new key alert */}
      {showKey && (
        <Card className="border-amber-800/50 bg-amber-950/20">
          <CardContent className="p-4">
            <p className="text-sm text-amber-300 mb-2">请立即复制，此 Key 不会再次显示：</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-zinc-900 px-3 py-2 text-sm text-zinc-200 font-mono break-all">{showKey}</code>
              <Button size="sm" variant="secondary" onClick={() => copyKey(showKey)}><Copy className="h-4 w-4" /></Button>
            </div>
            <Button size="sm" variant="ghost" className="mt-2 text-zinc-500" onClick={() => setShowKey(null)}>关闭</Button>
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {keys.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-zinc-500">
              <Key className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">暂无 API Key</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>最后使用</TableHead>
                  <TableHead className="w-20"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium text-zinc-200">{k.name}</TableCell>
                    <TableCell>
                      <code className="text-xs text-zinc-500 font-mono">{k.key.slice(0, 12)}...</code>
                    </TableCell>
                    <TableCell className="text-zinc-500">{formatDate(k.created_at)}</TableCell>
                    <TableCell className="text-zinc-500">{k.last_used ? formatDate(k.last_used) : '-'}</TableCell>
                    <TableCell>
                      <button onClick={() => handleDelete(k.id)} className="text-zinc-600 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </div>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogHeader onClose={() => setCreateOpen(false)}>创建 API Key</DialogHeader>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">名称</label>
          <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Key 用途" />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>取消</Button>
          <Button onClick={handleCreate} disabled={creating || !newKeyName.trim()}>{creating ? '创建中...' : '创建'}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
