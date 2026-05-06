import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { Copy, Code2, Check } from 'lucide-react'

export default function Widget() {
  const { addToast } = useToast()
  const [kbId, setKbId] = useState('YOUR_KB_ID')
  const [copied, setCopied] = useState(false)

  const snippet = `<!-- Nova AI Widget -->
<script src="${window.location.origin}/widget.js" data-kb-id="${kbId}"></script>
<nova-widget position="bottom-right"></nova-widget>`

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    addToast('已复制', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-semibold text-zinc-100">嵌入组件</h2>

      <Card>
        <CardHeader>
          <CardTitle>使用方式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            将以下代码添加到你的网站 HTML 中，即可在页面右下角显示 AI 对话组件。
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">知识库 ID</label>
            <Input value={kbId} onChange={(e) => setKbId(e.target.value)} className="max-w-xs" />
          </div>

          <div className="relative">
            <pre className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 text-sm text-zinc-300 overflow-x-auto font-mono">
              {snippet}
            </pre>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-300"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>配置参数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-4">
              <code className="text-brand-light w-40 flex-shrink-0">data-kb-id</code>
              <span className="text-zinc-400">知识库 ID（必填）</span>
            </div>
            <div className="flex gap-4">
              <code className="text-brand-light w-40 flex-shrink-0">position</code>
              <span className="text-zinc-400">浮动位置：bottom-right（默认）、bottom-left</span>
            </div>
            <div className="flex gap-4">
              <code className="text-brand-light w-40 flex-shrink-0">theme</code>
              <span className="text-zinc-400">主题：dark（默认）、light</span>
            </div>
            <div className="flex gap-4">
              <code className="text-brand-light w-40 flex-shrink-0">placeholder</code>
              <span className="text-zinc-400">输入框占位文本</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>示例</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 text-sm text-zinc-300 font-mono overflow-x-auto">
{`<script src="https://your-domain.com/widget.js" data-kb-id="kb_abc123"></script>
<nova-widget
  position="bottom-right"
  theme="dark"
  placeholder="问我任何问题..."
></nova-widget>`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
