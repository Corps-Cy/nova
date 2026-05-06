import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { authApi } from '@/api/auth'

export default function Settings() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [name, setName] = useState(user?.name || '')
  const [savingName, setSavingName] = useState(false)
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  const handleSaveName = async () => {
    if (!name.trim()) return
    setSavingName(true)
    try {
      await authApi.updateProfile(name.trim())
      addToast('已更新', 'success')
    } catch (err: any) {
      addToast(err.message || '更新失败', 'error')
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd) return
    setSavingPwd(true)
    try {
      await authApi.changePassword(oldPwd, newPwd)
      addToast('密码已修改', 'success')
      setOldPwd('')
      setNewPwd('')
    } catch (err: any) {
      addToast(err.message || '修改失败', 'error')
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-zinc-100">个人设置</h2>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">邮箱</label>
            <Input value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">名称</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="你的名称" />
          </div>
          <Button onClick={handleSaveName} disabled={savingName || name === user?.name}>{savingName ? '保存中...' : '保存'}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">当前密码</label>
            <Input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">新密码</label>
            <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          </div>
          <Button onClick={handleChangePassword} disabled={savingPwd || !oldPwd || !newPwd}>{savingPwd ? '修改中...' : '修改密码'}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
