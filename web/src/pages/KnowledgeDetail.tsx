import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Dialog, DialogHeader, DialogFooter } from '@/components/ui/Dialog'
import { knowledgeApi } from '@/api/knowledge'
import { documentApi } from '@/api/document'
import { useToast } from '@/hooks/useToast'
import type { KnowledgeBase, Document } from '@/types'
import { ChevronRight, Upload, Link2, Trash2, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function KnowledgeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [kb, setKb] = useState<KnowledgeBase | null>(null)
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [urlOpen, setUrlOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  const load = () => {
    if (!id) return
    setLoading(true)
    Promise.all([knowledgeApi.get(id), documentApi.list(id)])
      .then(([k, d]) => { setKb(k); setDocs(d) })
      .catch(() => addToast('加载失败', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setUploading(true)
    try {
      await documentApi.upload(id, file)
      addToast('上传成功', 'success')
      load()
    } catch (err: any) {
      addToast(err.message || '上传失败', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleImportUrl = async () => {
    if (!url.trim() || !id) return
    setImporting(true)
    try {
      await documentApi.importUrl(id, url.trim())
      addToast('导入成功', 'success')
      setUrlOpen(false)
      setUrl('')
      load()
    } catch (err: any) {
      addToast(err.message || '导入失败', 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('确认删除该文档？')) return
    if (!id) return
    try {
      await documentApi.delete(id, docId)
      addToast('已删除', 'success')
      load()
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-brand" /></div>
  }

  if (!kb) return <p className="text-zinc-500">知识库不存在</p>

  const statusVariant = (s: string) => s === 'ready' ? 'success' : s === 'error' ? 'error' : 'warning'

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-zinc-500">
        <Link to="/knowledge" className="hover:text-zinc-300">知识库</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-zinc-200">{kb.name}</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">{kb.name}</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{kb.description || '无描述'}</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.txt,.md,.doc,.docx,.csv" onChange={handleUpload} />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-1" />{uploading ? '上传中...' : '上传文档'}
          </Button>
          <Button variant="secondary" onClick={() => setUrlOpen(true)}>
            <Link2 className="h-4 w-4 mr-1" />URL导入
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>文档列表</CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-zinc-500">
              <FileText className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">暂无文档</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文件名</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead>分块数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-16"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium text-zinc-200">{doc.filename}</TableCell>
                    <TableCell className="text-zinc-500">{doc.source || '-'}</TableCell>
                    <TableCell>{doc.chunk_count}</TableCell>
                    <TableCell><Badge variant={statusVariant(doc.status)}>{doc.status}</Badge></TableCell>
                    <TableCell className="text-zinc-500">{formatDate(doc.created_at)}</TableCell>
                    <TableCell>
                      <button onClick={() => handleDelete(doc.id)} className="text-zinc-600 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={urlOpen} onClose={() => setUrlOpen(false)}>
        <DialogHeader onClose={() => setUrlOpen(false)}>URL 导入</DialogHeader>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/page" />
        <DialogFooter>
          <Button variant="secondary" onClick={() => setUrlOpen(false)}>取消</Button>
          <Button onClick={handleImportUrl} disabled={importing || !url.trim()}>{importing ? '导入中...' : '导入'}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
