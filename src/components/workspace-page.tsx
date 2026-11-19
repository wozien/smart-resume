'use client'

import { useChat } from '@ai-sdk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { toast } from 'sonner'
import { AgentChatPane } from '@/components/agent-chat-pane'
import { AppFrame, AppFrameNavButtons } from '@/components/app-frame'
import {
  ResumeArtifactPane,
  type ArtifactMode,
  type SaveStatus,
} from '@/components/resume-artifact-pane'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import type { TemplateId } from '@/lib/constants'
import { takePendingPrompt } from '@/lib/pending-prompt'
import type { ModelConfigPublic, ResumeDetail } from '@/lib/types'
import { cn } from '@/lib/utils'

const RIGHT_PANE_WIDTH_KEY = 'workspace-right-pane-width'
const MIN_CHAT_PANE = 360
const MIN_RIGHT_PANE = 320
const DEFAULT_RIGHT_PANE = 560
const RESIZE_STEP = 24

function readRightPaneWidth(): number {
  try {
    const stored = window.localStorage.getItem(RIGHT_PANE_WIDTH_KEY)
    const parsed = stored ? Number(stored) : Number.NaN
    if (Number.isFinite(parsed) && parsed >= MIN_RIGHT_PANE) return parsed
  } catch {
    // private mode / quota
  }
  return DEFAULT_RIGHT_PANE
}

function persistRightPaneWidth(width: number) {
  try {
    window.localStorage.setItem(RIGHT_PANE_WIDTH_KEY, String(Math.round(width)))
  } catch {
    // private mode / quota
  }
}

function clampRightPaneWidth(next: number, containerWidth: number) {
  const maxRight = Math.max(MIN_RIGHT_PANE, containerWidth - MIN_CHAT_PANE)
  return Math.min(maxRight, Math.max(MIN_RIGHT_PANE, next))
}

function toUiMessages(detail: ResumeDetail): UIMessage[] {
  return detail.messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: [{ type: 'text' as const, text: message.content }],
  }))
}

function hasRunningWriteBodyTool(messages: UIMessage[]): boolean {
  const last = messages.at(-1)
  if (!last || last.role !== 'assistant') return false
  return last.parts.some((part) => {
    const candidate = part as { type?: string; state?: string }
    return (
      candidate.type === 'tool-writeResumeBody' &&
      (candidate.state === 'input-streaming' ||
        candidate.state === 'input-available')
    )
  })
}

function WorkspaceSkeleton() {
  return (
    <div
      className="flex h-full w-full overflow-hidden bg-[#F6F7FB]"
      aria-label="正在加载简历工作台"
    >
      {/* 中栏 Agent 对话骨架屏 */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E7E9F3] bg-white px-4 sm:px-5">
          <div className="flex items-center gap-2.5">
            <AppFrameNavButtons />
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="hidden h-5 w-16 rounded-full sm:block" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        <div className="flex-1 overflow-hidden px-4 py-8 sm:px-6">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
            <div className="flex justify-end">
              <Skeleton className="h-11 w-64 rounded-2xl" />
            </div>
            <div className="flex items-start gap-3">
              <Skeleton className="size-7 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2.5 rounded-2xl border border-[#E7E9F3] bg-white p-4">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-52 rounded-2xl" />
            </div>
            <div className="flex items-start gap-3">
              <Skeleton className="size-7 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2 rounded-2xl border border-[#E7E9F3] bg-white p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-4 pb-4 sm:px-6">
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#E7E9F3] bg-white p-3.5">
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="mt-3 flex items-center justify-between">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="size-8 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 右栏简历预览/源码骨架屏 */}
      <div className="hidden h-full w-[48%] max-w-[780px] min-w-[420px] flex-col border-l border-[#E7E9F3] bg-[#F6F7FB] lg:flex">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E7E9F3] bg-white px-5">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          <div className="mx-auto h-full max-w-[740px] rounded-2xl border border-[#E7E9F3] bg-white p-8">
            <div className="flex flex-col items-center gap-2 border-b border-[#F1F2F8] pb-5">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3.5 w-64" />
            </div>
            <div className="mt-6 space-y-6">
              {[0, 1, 2].map((section) => (
                <div key={section} className="space-y-2.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-11/12" />
                  <Skeleton className="h-3.5 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
      <AppFrame fullBleed>
        <WorkspaceSkeleton />
      </AppFrame>
    )
  }

  if (resume.error || !resume.data) {
    return (
      <AppFrame fullBleed>
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#FEF3F2] text-[#B42318]">
            <AlertCircle className="size-6" />
          </div>
          <p className="text-[15px] font-bold text-[#14152B]">
            {resume.error?.message ?? '未找到这份简历'}
          </p>
          <p className="text-[13px] text-[#8C8FA8]">
            该简历可能已被删除或无权访问，可从左侧选择其它简历或回到首页新建。
          </p>
          <Link href="/" className="mt-1">
            <Button variant="outline" className="h-9 rounded-xl bg-white">
              返回新对话首页
            </Button>
          </Link>
        </div>
      </AppFrame>
    )
  }

  return <WorkspaceReady key={id} id={id} detail={resume.data} />
}

function WorkspaceReady({ id, detail }: { id: string; detail: ResumeDetail }) {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const initialMode: ArtifactMode =
    searchParams.get('mode') === 'source' ? 'source' : 'preview'

  const [title, setTitle] = useState(detail.title)
  const [body, setBody] = useState(detail.body)
  const [templateId, setTemplateId] = useState<TemplateId>(detail.lastTemplateId)
  const [artifactMode, setArtifactMode] = useState<ArtifactMode>(initialMode)
  const [rightPaneOpen, setRightPaneOpen] = useState(true)
  const [rightPaneWidth, setRightPaneWidth] = useState(readRightPaneWidth)
  const [resizing, setResizing] = useState(false)
  const splitRef = useRef<HTMLDivElement>(null)
  const [mobileTab, setMobileTab] = useState<'chat' | 'artifact'>(
    searchParams.get('mode') === 'source' ? 'artifact' : 'chat',
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'docx' | null>(
    null,
  )
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const modelConfig = useQuery({
    queryKey: ['model-config'],
    queryFn: () => api<ModelConfigPublic>('/api/me/model-config'),
  })

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  function handleBodyChange(nextBody: string) {
    setBody(nextBody)
    setSaveStatus('saving')
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      void api(`/api/resumes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ body: nextBody }),
      })
        .then(() => {
          setSaveStatus('saved')
          void queryClient.invalidateQueries({ queryKey: ['resumes'] })
        })
        .catch((err: Error) => {
          setSaveStatus('idle')
          toast.error(err.message)
        })
    }, 600)
  }

  const transport = useMemo(
    () => new DefaultChatTransport({ api: `/api/resumes/${id}/messages` }),
    [id],
  )

  const chat = useChat({
    id,
    messages: toUiMessages(detail),
    transport,
    onFinish: () => {
      void queryClient
        .fetchQuery({
          queryKey: ['resume', id],
          queryFn: () => api<ResumeDetail>(`/api/resumes/${id}`),
        })
        .then((fresh) => {
          setBody(fresh.body)
          setTitle(fresh.title)
          setTemplateId(fresh.lastTemplateId)
        })
        .catch(() => {
          void queryClient.invalidateQueries({ queryKey: ['resume', id] })
        })
      void queryClient.invalidateQueries({ queryKey: ['resumes'] })
    },
    onError: (err) => toast.error(err.message),
  })

  // 如果是从首页欢迎框带着首条消息新建跳转过来的简历，自动触发首条对话
  const { sendMessage } = chat
  useEffect(() => {
    const pending = takePendingPrompt(id)
    if (pending) {
      void sendMessage({ text: pending })
    }
  }, [id, sendMessage])

  const restore = useMutation({
    mutationFn: () =>
      api<{ body: string; previousBody: string }>(
        `/api/resumes/${id}/restore`,
        { method: 'POST' },
      ),
    onSuccess: (data) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      setBody(data.body)
      setSaveStatus('saved')
      void queryClient.invalidateQueries({ queryKey: ['resume', id] })
      void queryClient.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('已恢复到上一版正文')
    },
    onError: (err) => toast.error(err.message),
  })

  async function saveTitle() {
    const next = title.trim()
    if (!next) {
      setTitle(detail.title)
      return
    }
    if (next === detail.title) return
    try {
      await api(`/api/resumes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: next }),
      })
      void queryClient.invalidateQueries({ queryKey: ['resumes'] })
      void queryClient.invalidateQueries({ queryKey: ['resume', id] })
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
    if (exportingFormat !== null) return
    setExportingFormat(format)
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
    } finally {
      setExportingFormat(null)
    }
  }

  const configured = modelConfig.data?.configured === true
  const emptyBody = body.trim().length === 0
  const aiSyncing = hasRunningWriteBodyTool(chat.messages)

  function handleInspectPreview() {
    setRightPaneOpen(true)
    setArtifactMode('preview')
    setMobileTab('artifact')
  }

  const applyRightPaneWidth = useCallback((next: number) => {
    const containerWidth = splitRef.current?.getBoundingClientRect().width ?? 0
    const clamped = clampRightPaneWidth(next, containerWidth || next)
    setRightPaneWidth(clamped)
    persistRightPaneWidth(clamped)
    return clamped
  }, [])

  function handleResizePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)
    setResizing(true)
  }

  function handleResizePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const container = splitRef.current?.getBoundingClientRect()
    if (!container) return
    applyRightPaneWidth(container.right - event.clientX)
  }

  function handleResizePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    setResizing(false)
  }

  function handleResizeKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      applyRightPaneWidth(rightPaneWidth + RESIZE_STEP)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      applyRightPaneWidth(rightPaneWidth - RESIZE_STEP)
    } else if (event.key === 'Home') {
      event.preventDefault()
      applyRightPaneWidth(MIN_RIGHT_PANE)
    } else if (event.key === 'End') {
      event.preventDefault()
      const containerWidth = splitRef.current?.getBoundingClientRect().width ?? 0
      applyRightPaneWidth(containerWidth - MIN_CHAT_PANE)
    }
  }

  return (
    <AppFrame fullBleed>
      <div
        ref={splitRef}
        className={cn(
          'flex h-full w-full overflow-hidden',
          resizing && 'cursor-col-resize select-none',
        )}
      >
        {/* 中间栏：沉浸式简历 Agent 对话区 */}
        <div
          className={cn(
            'h-full min-w-0 flex-1 overflow-hidden',
            mobileTab === 'chat' ? 'flex' : 'hidden lg:flex',
          )}
        >
          <AgentChatPane
            title={title}
            onTitleChange={setTitle}
            onTitleSave={() => void saveTitle()}
            emptyBody={emptyBody}
            configured={configured}
            configLoading={modelConfig.isLoading}
            messages={chat.messages}
            status={chat.status}
            onSendMessage={(text) => void chat.sendMessage({ text })}
            rightPaneOpen={rightPaneOpen}
            onToggleRightPane={() => setRightPaneOpen((open) => !open)}
            mobileTab={mobileTab}
            onMobileTabChange={setMobileTab}
            onInspectPreview={handleInspectPreview}
          />
        </div>

        {rightPaneOpen ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="调整对话栏与简历栏宽度"
            aria-valuemin={MIN_RIGHT_PANE}
            aria-valuemax={1200}
            aria-valuenow={Math.round(rightPaneWidth)}
            tabIndex={0}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
            onKeyDown={handleResizeKeyDown}
            className={cn(
              'relative z-20 hidden w-px shrink-0 cursor-col-resize touch-none bg-border outline-none lg:block',
              'before:pointer-events-none before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-border before:content-[""]',
              'hover:before:w-0.5 hover:before:bg-[#5A6ACF] focus-visible:before:w-0.5 focus-visible:before:bg-[#5A6ACF]',
              'after:absolute after:inset-y-0 after:left-0 after:-right-3 after:content-[""]',
              resizing && 'before:w-0.5 before:bg-[#5A6ACF]',
            )}
          />
        ) : null}

        {/* 最右栏：简历预览与 Markdown 源码合一面板 */}
        <div
          className={cn(
            'h-full flex-col overflow-hidden bg-[#F6F7FB]',
            mobileTab === 'artifact' ? 'flex w-full' : 'hidden',
            rightPaneOpen
              ? 'lg:flex lg:w-(--right-pane-width) lg:shrink-0'
              : 'lg:hidden',
          )}
          style={
            {
              '--right-pane-width': `${rightPaneWidth}px`,
            } as CSSProperties
          }
        >
          {/* 小屏下处于「简历」视图时提供返回对话的顶栏切换 */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#E7E9F3] bg-white px-3 lg:hidden">
            <div className="flex min-w-0 items-center gap-1.5">
              <AppFrameNavButtons />
              <span className="truncate text-[14px] font-bold text-[#14152B]">
                {title}
              </span>
            </div>
            <div
              role="tablist"
              aria-label="工作区视图切换"
              className="flex rounded-lg border border-[#E7E9F3] bg-[#F6F7FB] p-0.5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={false}
                onClick={() => setMobileTab('chat')}
                className="rounded-md px-2.5 py-1 text-[12px] font-semibold text-[#565A78]"
              >
                对话
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={true}
                onClick={() => setMobileTab('artifact')}
                className="rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-[#5A6ACF] shadow-2xs"
              >
                简历
              </button>
            </div>
          </div>

          <ResumeArtifactPane
            mode={artifactMode}
            onModeChange={setArtifactMode}
            body={body}
            onBodyChange={handleBodyChange}
            templateId={templateId}
            onTemplateChange={(next) => void changeTemplate(next)}
            hasRevision={detail.previousBody != null}
            restoring={restore.isPending}
            onRestore={() => restore.mutate()}
            exportingFormat={exportingFormat}
            onExport={(format) => void exportFile(format)}
            saveStatus={saveStatus}
            aiSyncing={aiSyncing}
          />
        </div>
      </div>
    </AppFrame>
  )
}
