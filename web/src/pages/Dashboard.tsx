import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { knowledgeApi } from '@/api/knowledge'
import { statsApi } from '@/api/stats'
import type { KnowledgeBase, DashboardStats } from '@/types'
import { Database, Search, Clock, TrendingUp, Plus, MessageSquare } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentKbs, setRecentKbs] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([statsApi.getDashboard(), knowledgeApi.list()])
      .then(([s, kbs]) => {
        if (Array.isArray(s) && s.length > 0) setStats(s[0] as DashboardStats)
        else if (s && typeof s === 'object' && 'kb_count' in s) setStats(s as unknown as DashboardStats)
        setRecentKbs(kbs.slice(0, 5))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-brand" />
      </div>
    )
  }

  const statCards = [
    { label: '知识库', value: stats?.kb_count ?? 0, icon: Database, color: 'text-indigo-400' },
    { label: '总查询', value: stats?.total_queries ?? 0, icon: Search, color: 'text-emerald-400' },
    { label: '平均延迟', value: stats?.avg_latency_ms ? `${stats.avg_latency_ms}ms` : '-', icon: Clock, color: 'text-amber-400' },
    { label: '今日查询', value: stats?.today_queries ?? 0, icon: TrendingUp, color: 'text-sky-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-100">仪表盘</h2>
        <div className="flex gap-2">
          <Link to="/knowledge">
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />新建知识库</Button>
          </Link>
          <Link to="/chat">
            <Button size="sm" variant="secondary"><MessageSquare className="h-4 w-4 mr-1" />对话测试</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-100">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近知识库</CardTitle>
        </CardHeader>
        <CardContent>
          {recentKbs.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">暂无知识库，点击右上角创建</p>
          ) : (
            <div className="space-y-3">
              {recentKbs.map((kb) => (
                <Link key={kb.id} to={`/knowledge/${kb.id}`} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{kb.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{kb.description || '无描述'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{kb.document_count} 文档</Badge>
                    <Badge>{kb.chunk_count} 分块</Badge>
                    <span className="text-xs text-zinc-600">{formatDate(kb.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
