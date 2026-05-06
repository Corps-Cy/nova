import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return
    if (password !== confirm) { addToast('密码不一致', 'error'); return }
    setLoading(true)
    try {
      const res = await authApi.register(email, password)
      setAuth(res.token, res.user)
      navigate('/', { replace: true })
    } catch (err: any) {
      addToast(err.message || '注册失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand">
            <span className="text-xl font-bold text-white">N</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">创建账号</h1>
          <p className="mt-1 text-sm text-zinc-500">注册 Nova 知识库平台</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">名称</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="你的名称" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">邮箱</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">密码</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">确认密码</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </Button>
          <p className="text-center text-sm text-zinc-500">
            已有账号？ <Link to="/login" className="text-brand-light hover:underline">登录</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
