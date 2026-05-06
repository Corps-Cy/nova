import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Dialog, DialogHeader, DialogFooter } from '@/components/ui/Dialog'
import { knowledgeApi } from '@/api/knowledge'
import { useToast } from '@/hooks/useToast'
import type { KnowledgeBase } from '@/types'
import { Plus, Database, FileText, Puzzle, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Knowledge() {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const { addToast } = useToast()

  const load = () => {
    setLoading(true)
    knowledgeApi.list()
      .then(setKbs)
      .catch(() => addToast('加载失败', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      await knowledgeApi.create(name.trim(), desc.trim())
      addToast('创建成功', 'success')
      setCreateOpen(false)
      setName('')
      setDesc('')
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
      await knowledgeApi.delete(id)
      addToast('已删除', 'success')
      load()
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-brand" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-100">知识库</h2>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" />新建知识库</Button>
      </div>

      {kbs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Database className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm">暂无知识库</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" />创建第一个</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kbs.map((kb) => (
            <Card key={kb.id} className="group hover:border-zinc-700 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link to={`/knowledge/${kb.id}`} className="text-sm font-medium text-zinc-100 hover:text-brand-light truncate block">{kb.name}</Link>
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{kb.description || '无描述'}</p>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); handleDelete(kb.id) }} className="ml-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{kb.document_count} 文档</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Puzzle className="h-3.5 w-3.5" />
                    <span>{kb.chunk_count} 分块</span>
                  </div>
                  <span className="text-xs text-zinc-600 ml-auto">{formatDate(kb.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogHeader onClose={() => setCreateOpen(false)}>新建知识库</DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">名称</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="知识库名称" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">描述</label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="可选描述" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>取消</Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>{creating ? '创建中...' : '创建'}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
