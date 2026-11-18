'use client'

import { useChat } from '@ai-sdk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { Download, MessageSquare, RotateCcw, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AppFrame } from '@/components/app-frame'
import { ResumePreview } from '@/components/resume-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import type { TemplateId } from '@/lib/constants'
import type { ModelConfigPublic, ResumeDetail } from '@/lib/types'
import { cn } from '@/lib/utils'

function toUiMessages(detail: ResumeDetail): UIMessage[] {
  return detail.messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: [{ type: 'text' as const, text: message.content }],
  }))
}

function messageText(message: UIMessage) {
  return message.parts.map((part) => (part.type === 'text' ? part.text : '')).join('')
}

export default function WorkspacePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const resume = useQuery({
    queryKey: ['resume', id],
    queryFn: () => api<ResumeDetail>(`/api/resumes/${id}`),
  })

  if (resume.isLoading) {
    return (
      <AppFrame title="工作区">
        <p className="text-sm text-[#8C8FA8]">加载中…</p>
      </AppFrame>
    )
  }
  if (resume.error || !resume.data) {
    return (
      <AppFrame title="工作区">
        <p className="text-sm text-[#B42318]">{resume.error?.message ?? '简历不存在'}</p>
      </AppFrame>
    )
  }

  return <WorkspaceReady id={id} detail={resume.data} />
}

function WorkspaceReady({ id, detail }: { id: string; detail: ResumeDetail }) {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(detail.title)
  const [body, setBody] = useState(detail.body)
  const [templateId, setTemplateId] = useState<TemplateId>(detail.lastTemplateId)
  const [chatOpen, setChatOpen] = useState(searchParams.get('intent') === 'create')
  const [draft, setDraft] = useState('')
  const [pane, setPane] = useState<'chat' | 'edit' | 'preview'>('edit')
  const skipSave = useRef(true)

  const modelConfig = useQuery({
    queryKey: ['model-config'],
    queryFn: () => api<ModelConfigPublic>('/api/me/model-config'),
  })

  useEffect(() => {
    skipSave.current = true
    setTitle(detail.title)
    setBody(detail.body)
    setTemplateId(detail.lastTemplateId)
  }, [detail.title, detail.body, detail.lastTemplateId])

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    const handle = setTimeout(() => {
      void api(`/api/resumes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      }).catch((err: Error) => toast.error(err.message))
    }, 600)
    return () => clearTimeout(handle)
  }, [body, id])

  const transport = useMemo(
    () => new DefaultChatTransport({ api: `/api/resumes/${id}/messages` }),
    [id],
  )

  const chat = useChat({
    id,
    messages: toUiMessages(detail),
    transport,
    onFinish: () => {
      void queryClient.invalidateQueries({ queryKey: ['resume', id] })
    },
    onError: (err) => toast.error(err.message),
  })

  const restore = useMutation({
    mutationFn: () =>
      api<{ body: string; previousBody: string }>(`/api/resumes/${id}/restore`, { method: 'POST' }),
    onSuccess: (data) => {
      skipSave.current = true
      setBody(data.body)
      void queryClient.invalidateQueries({ queryKey: ['resume', id] })
      toast.success('已恢复到上一版正文')
    },
    onError: (err) => toast.error(err.message),
  })

  async function saveTitle() {
    const next = title.trim()
    if (!next || next === detail.title) return
    try {
      await api(`/api/resumes/${id}`, { method: 'PATCH', body: JSON.stringify({ title: next }) })
      void queryClient.invalidateQueries({ queryKey: ['resumes'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存标题失败')
    }
  }

  async function changeTemplate(next: TemplateId) {
    setTemplateId(next)
    try {
      await api(`/api/resumes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ lastTemplateId: next }),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存模板失败')
    }
  }

  async function exportFile(format: 'pdf' | 'docx') {
    try {
      const res = await fetch(`/api/resumes/${id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, templateId }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? '导出失败')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title || 'resume'}.${format === 'pdf' ? 'pdf' : 'docx'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '导出失败')
    }
  }

  const busy = chat.status === 'submitted' || chat.status === 'streaming'
  const configured = modelConfig.data?.configured === true
  const emptyBody = body.trim().length === 0

  const chatPane = (
    <div className="flex h-full min-h-[320px] flex-col rounded-2xl border border-[#E7E9F3] bg-white">
      <div className="flex items-center justify-between border-b border-[#E7E9F3] px-4 py-3">
        <div>
          <p className="text-sm font-bold">对话</p>
          <p className="text-[12px] text-[#8C8FA8]">{emptyBody ? '创建模式' : '润色模式'}</p>
        </div>
        <Sparkles className="size-4 text-[#5A6ACF]" />
      </div>
      {!configured ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
          <p className="text-sm text-[#565A78]">还没有模型配置，对话不可用。</p>
          <Link href="/account" className="inline-flex">
            <Button className="h-10 bg-[#5A6ACF] hover:bg-[#4f5dbb]">去个人中心配置</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-3 overflow-auto p-4">
            {chat.messages.length === 0 ? (
              <p className="text-sm text-[#8C8FA8]">
                {emptyBody ? '从姓名、经历、教育开始提问吧。' : '说说你想怎么改这篇正文。'}
              </p>
            ) : (
              chat.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'max-w-[95%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'ml-auto bg-[#5A6ACF] text-white'
                      : 'bg-[#F6F7FB] text-[#14152B]',
                  )}
                >
                  {messageText(message) || (message.role === 'assistant' ? '…' : '')}
                </div>
              ))
            )}
          </div>
          <form
            className="border-t border-[#E7E9F3] p-3"
            onSubmit={(event) => {
              event.preventDefault()
              const text = draft.trim()
              if (!text || busy) return
              setDraft('')
              void chat.sendMessage({ text })
            }}
          >
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="输入消息"
              className="min-h-20"
            />
            <Button
              type="submit"
              className="mt-2 h-10 w-full bg-[#5A6ACF] hover:bg-[#4f5dbb]"
              disabled={busy || !draft.trim()}
            >
              {busy ? '生成中…' : '发送'}
            </Button>
          </form>
        </>
      )}
    </div>
  )

  const editorPane = (
    <Textarea
      value={body}
      onChange={(event) => setBody(event.target.value)}
      placeholder={`文首写姓名和联系方式，然后是：\n## 个人总结\n## 工作经历\n## 教育经历\n## 项目经历\n## 技能`}
      className="h-full min-h-[320px] resize-none rounded-2xl border-[#E7E9F3] bg-white p-4 font-mono text-[13px] leading-relaxed"
    />
  )

  const previewPane = <ResumePreview body={body} templateId={templateId} />

  return (
    <AppFrame
      title={
        <Input
          aria-label="简历标题"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => void saveTitle()}
          className="h-8 max-w-md border-transparent bg-transparent text-[16px] font-bold tracking-tight text-[#14152B] shadow-none focus-visible:border-[#E7E9F3] focus-visible:bg-white"
        />
      }
      actions={
        <>
          <select
            aria-label="模板"
            className="h-10 rounded-lg border border-[#E7E9F3] bg-white px-3 text-sm"
            value={templateId}
            onChange={(event) => void changeTemplate(event.target.value as TemplateId)}
          >
            <option value="single">单栏</option>
            <option value="double">双栏</option>
          </select>
          {detail.previousBody != null ? (
            <Button variant="outline" className="h-10" onClick={() => restore.mutate()} disabled={restore.isPending}>
              <RotateCcw />
              恢复修订
            </Button>
          ) : null}
          <Button variant="outline" className="h-10" onClick={() => void exportFile('pdf')}>
            <Download />
            PDF
          </Button>
          <Button variant="outline" className="h-10" onClick={() => void exportFile('docx')}>
            <Download />
            Word
          </Button>
          <Button
            variant={chatOpen ? 'default' : 'outline'}
            className={cn('h-10', chatOpen && 'bg-[#5A6ACF] hover:bg-[#4f5dbb]')}
            onClick={() => {
              setChatOpen((open) => !open)
              setPane('chat')
            }}
          >
            <MessageSquare />
            对话
          </Button>
        </>
      }
    >
      <div className="mb-3 flex gap-2 lg:hidden">
        {(['chat', 'edit', 'preview'] as const).map((item) => (
          <Button
            key={item}
            variant={pane === item ? 'default' : 'outline'}
            className={cn('h-9', pane === item && 'bg-[#5A6ACF] hover:bg-[#4f5dbb]')}
            onClick={() => setPane(item)}
          >
            {item === 'chat' ? '对话' : item === 'edit' ? '编辑' : '预览'}
          </Button>
        ))}
      </div>

      <div
        className={cn(
          'hidden h-[calc(100vh-8.5rem)] gap-4 lg:grid',
          chatOpen
            ? 'lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(280px,1fr)]'
            : 'lg:grid-cols-[minmax(0,1fr)_minmax(280px,1fr)]',
        )}
      >
        {chatOpen ? chatPane : null}
        {editorPane}
        {previewPane}
      </div>

      <div className="lg:hidden">
        {pane === 'chat' ? chatPane : pane === 'edit' ? editorPane : previewPane}
      </div>
    </AppFrame>
  )
}
