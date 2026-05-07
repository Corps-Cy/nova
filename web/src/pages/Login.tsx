import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sparkles } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      setAuth(res.token, res.user)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      addToast(err.message || '登录失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-indigo-500/8 blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            欢迎回来
          </h1>
          <p className="mt-2 text-zinc-400">
            登录你的 Nova 账号
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                邮箱地址
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                密码
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20"
              />
            </div>
            <Button
              type="submit"
              className="mt-2 h-11 w-full bg-gradient-to-r from-indigo-500 to-violet-600 font-medium text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-700"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  登录中...
                </span>
              ) : '登 录'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              还没有账号？{' '}
              <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                免费注册
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-zinc-600">
          Nova AI · 智能知识库管理平台
        </p>
      </div>
    </div>
  )
}
