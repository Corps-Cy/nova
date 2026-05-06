import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { knowledgeApi } from '@/api/knowledge'
import { statsApi } from '@/api/stats'
import { useToast } from '@/hooks/useToast'
import type { KnowledgeBase, ChatMessage } from '@/types'
import { Send, Database, Bot, User, Loader2 } from 'lucide-react'

export default function Chat() {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [selectedKb, setSelectedKb] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [kbsLoading, setKbsLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()

  useEffect(() => {
    knowledgeApi.list()
      .then((list) => {
        setKbs(list)
        if (list.length > 0 && !selectedKb) setSelectedKb(list[0].id)
      })
      .catch(() => addToast('加载知识库失败', 'error'))
      .finally(() => setKbsLoading(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !selectedKb || loading) return
    const q = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res = await statsApi.query(selectedKb, q)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.answer, sources: res.sources, latency_ms: res.latency_ms }])
    } catch (err: any) {
      addToast(err.message || '查询失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (kbsLoading) {
    return <div className="flex items-center justify-center h-64"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-brand" /></div>
  }

  return (
    <div className="flex h-[calc(100vh-7.5rem)] gap-4">
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 space-y-2 overflow-auto">
        <h3 className="text-sm font-medium text-zinc-400 px-2">选择知识库</h3>
        {kbs.length === 0 ? (
          <p className="text-sm text-zinc-600 px-2">暂无知识库</p>
        ) : (
          kbs.map((kb) => (
            <button
              key={kb.id}
              onClick={() => { setSelectedKb(kb.id); setMessages([]) }}
              className={`w-full rounded-lg p-3 text-left text-sm transition-colors ${selectedKb === kb.id ? 'bg-brand/10 border border-brand/30 text-brand-light' : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
            >
              <p className="font-medium truncate">{kb.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{kb.document_count} 文档</p>
            </button>
          ))
        )}
      </div>

      {/* Chat */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <Bot className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">选择知识库开始对话</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand/20">
                      <Bot className="h-4 w-4 text-brand-light" />
                    </div>
                  )}
                  <div className={`max-w-[70%] rounded-lg px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-brand text-white' : 'bg-zinc-800 text-zinc-200'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.latency_ms && <p className="text-xs opacity-50 mt-1">{msg.latency_ms}ms</p>}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800">
                      <User className="h-4 w-4 text-zinc-400" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/20">
                    <Bot className="h-4 w-4 text-brand-light" />
                  </div>
                  <div className="rounded-lg bg-zinc-800 px-4 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
          <div className="border-t border-zinc-800 p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="输入问题..."
                disabled={!selectedKb}
              />
              <Button onClick={handleSend} disabled={!selectedKb || !input.trim() || loading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
