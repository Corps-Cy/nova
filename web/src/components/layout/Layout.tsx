import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import {
  LayoutDashboard,
  Database,
  MessageSquare,
  Key,
  Settings,
  Code2,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/knowledge', label: '知识库', icon: Database },
  { to: '/chat', label: '对话测试', icon: MessageSquare },
  { to: '/api-keys', label: 'API Keys', icon: Key },
  { to: '/widget', label: '嵌入组件', icon: Code2 },
  { to: '/settings', label: '设置', icon: Settings },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, clearAuth } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 border-r border-zinc-800 bg-zinc-950 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center gap-2 px-5 border-b border-zinc-800">
          <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center">
            <span className="text-white font-bold text-xs">N</span>
          </div>
          <span className="text-lg font-bold text-zinc-100">Nova</span>
        </div>
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand/10 text-brand-light'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`
              }
              end={item.to === '/'}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-4 left-3 right-3">
          <div className="rounded-lg bg-zinc-900 p-3">
            <p className="text-sm text-zinc-300 truncate">{user?.name || user?.email}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" className="w-full mt-2 text-zinc-400 hover:text-red-400" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-zinc-200">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-medium text-zinc-400">AI 知识库管理平台</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
