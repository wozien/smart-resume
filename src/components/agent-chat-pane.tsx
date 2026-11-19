'use client'

import type { ChatStatus, UIMessage } from 'ai'
import {
  AlertCircle,
  ArrowUp,
  CheckCircle2,
  Eye,
  FileCheck2,
  KeyRound,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Wand2,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AppFrameNavButtons } from '@/components/app-frame'
import { BrandMark } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const CREATE_SUGGESTIONS = [
  '请一步步采访我，帮我从零生成完整简历',
  '我是应届生，请帮我挖掘实习与课程项目亮点',
  '我有目标岗位 JD，请结合岗位要求提问并定制简历',
] as const

const POLISH_SUGGESTIONS = [
  '通读当前简历，给出整体诊断与具体改写建议',
  '用 STAR 法则和量化指标强化我的工作与项目经历',
  '精简冗长表述，提炼更有说服力的个人总结',
] as const

const markdownComponents = {
  table: ({ children, ...props }: ComponentPropsWithoutRef<'table'>) => (
    <div className="agent-chat-table-wrap">
      <table {...props}>{children}</table>
    </div>
  ),
}

type WriteBodyToolPart = {
  type: string
  toolCallId: string
  state: string
  input?: { markdown?: string }
  errorText?: string
}

function extractWriteBodyToolParts(message: UIMessage): WriteBodyToolPart[] {
  const result: WriteBodyToolPart[] = []
  for (const part of message.parts) {
    const candidate = part as {
      type?: unknown
      toolCallId?: unknown
      state?: unknown
      input?: { markdown?: string }
      errorText?: string
    }
    if (
      candidate.type === 'tool-writeResumeBody' &&
      typeof candidate.toolCallId === 'string' &&
      typeof candidate.state === 'string'
    ) {
      result.push({
        type: candidate.type,
        toolCallId: candidate.toolCallId,
        state: candidate.state,
        input: candidate.input,
        errorText: candidate.errorText,
      })
    }
  }
  return result
}

function extractMessageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('')
}

function ThinkingIndicator({ label = '正在思考与分析…' }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-2xl border border-[#E7E9F3] bg-white px-3.5 py-2.5 text-[13px] text-[#565A78] shadow-2xs">
      <span className="flex items-center gap-1" aria-hidden>
        <span className="size-1.5 animate-bounce rounded-full bg-[#5A6ACF] [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-[#5A6ACF] [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-[#5A6ACF]" />
      </span>
      <span className="animate-pulse font-medium">{label}</span>
    </div>
  )
}

function WriteResumeToolCard({
  part,
  onInspectPreview,
}: {
  part: WriteBodyToolPart
  onInspectPreview: () => void
}) {
  const isRunning =
    part.state === 'input-streaming' || part.state === 'input-available'
  const isError = part.state === 'output-error'
  const charCount = part.input?.markdown?.length ?? 0

  if (isError) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-[#F04438]/30 bg-[#FEF3F2] px-3.5 py-2.5 text-[13px] text-[#B42318]">
        <AlertCircle className="size-4 shrink-0" />
        <span>更新简历正文失败：{part.errorText ?? '请重试'}</span>
      </div>
    )
  }

  if (isRunning) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-[#5A6ACF]/35 bg-[#EEF0FF]/70 px-3.5 py-2.5 text-[13px] text-[#14152B]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 shrink-0 animate-spin text-[#5A6ACF]" />
            <span className="font-semibold text-[#5A6ACF]">
              正在为你撰写并同步简历正文…
            </span>
          </div>
          {charCount > 0 ? (
            <span className="font-mono text-[11px] text-[#565A78]">
              已生成 {charCount} 字
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#12B76A]/30 bg-[#E7FAF0]/70 px-3.5 py-2.5 text-[13px]">
      <div className="flex items-center gap-2 text-[#027A48]">
        <CheckCircle2 className="size-4 shrink-0 text-[#12B76A]" />
        <span className="font-semibold">已将最新正文写入右侧简历</span>
      </div>
      <button
        type="button"
        onClick={onInspectPreview}
        className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[12px] font-semibold text-[#5A6ACF] shadow-2xs ring-1 ring-[#E7E9F3] transition-colors hover:bg-[#EEF0FF]"
      >
        <Eye className="size-3.5" />
        查看预览
      </button>
    </div>
  )
}

export function AgentChatPane({
  title,
  onTitleChange,
  onTitleSave,
  emptyBody,
  configured,
  configLoading,
  messages,
  status,
  onSendMessage,
  rightPaneOpen,
  onToggleRightPane,
  mobileTab,
  onMobileTabChange,
  onInspectPreview,
}: {
  title: string
  onTitleChange: (value: string) => void
  onTitleSave: () => void
  emptyBody: boolean
  configured: boolean
  configLoading: boolean
  messages: UIMessage[]
  status: ChatStatus
  onSendMessage: (text: string) => void
  rightPaneOpen: boolean
  onToggleRightPane: () => void
  mobileTab: 'chat' | 'artifact'
  onMobileTabChange: (tab: 'chat' | 'artifact') => void
  onInspectPreview: () => void
}) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const busy = status === 'submitted' || status === 'streaming'
  const lastMessage = messages.at(-1)
  const waitingForAssistantBubble =
    status === 'submitted' && lastMessage?.role === 'user'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, status])

  function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy || !configured) return
    setDraft('')
    onSendMessage(trimmed)
  }

  const suggestions = emptyBody ? CREATE_SUGGESTIONS : POLISH_SUGGESTIONS

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-linear-to-b from-[#FAFBFF] to-[#F6F7FB]">
      {/* 轻量沉浸顶栏 */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#E7E9F3] bg-white/90 px-3 backdrop-blur-md sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-0.5">
          <AppFrameNavButtons />
          <Input
            aria-label="简历标题"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            onBlur={onTitleSave}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }
            }}
            className="h-8 max-w-[220px] truncate rounded-lg border-transparent bg-transparent px-1 text-[15px] font-bold tracking-tight text-[#14152B] shadow-none transition-colors hover:bg-[#F6F7FB] focus-visible:border-[#E7E9F3] focus-visible:bg-white sm:max-w-xs"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              'hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:inline-flex',
              emptyBody
                ? 'bg-[#EEF0FF] text-[#5A6ACF]'
                : 'bg-[#E7FAF0] text-[#027A48]',
            )}
          >
            <Sparkles className="size-3" />
            {emptyBody ? '创建引导' : '润色模式'}
          </span>
          {/* 小屏：对话 / 简历 切换分段钮 */}
          <div
            role="tablist"
            aria-label="工作区视图切换"
            className="flex rounded-lg border border-[#E7E9F3] bg-[#F6F7FB] p-0.5 lg:hidden"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'chat'}
              onClick={() => onMobileTabChange('chat')}
              className={cn(
                'rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors',
                mobileTab === 'chat'
                  ? 'bg-white text-[#5A6ACF] shadow-2xs'
                  : 'text-[#565A78]',
              )}
            >
              对话
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'artifact'}
              onClick={() => onMobileTabChange('artifact')}
              className={cn(
                'rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors',
                mobileTab === 'artifact'
                  ? 'bg-white text-[#5A6ACF] shadow-2xs'
                  : 'text-[#565A78]',
              )}
            >
              简历
            </button>
          </div>

          {/* 桌面端：右栏折叠/展开开关 */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleRightPane}
                  aria-label={
                    rightPaneOpen ? '收起右侧简历栏' : '展开右侧简历栏'
                  }
                  className="hidden size-8 shrink-0 text-[#565A78] hover:bg-[#F6F7FB] hover:text-[#14152B] lg:inline-flex"
                />
              }
            >
              {rightPaneOpen ? (
                <PanelRightClose className="size-4" />
              ) : (
                <PanelRightOpen className="size-4" />
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              {rightPaneOpen ? '收起简历栏' : '展开简历栏'}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* 对话消息流 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
          {configLoading ? (
            <div className="space-y-4 py-6" aria-label="正在加载对话配置">
              <div className="flex items-start gap-3">
                <Skeleton className="size-8 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          ) : !configured ? (
            <div className="my-12 flex flex-col items-center rounded-3xl border border-[#E7E9F3] bg-white p-8 text-center shadow-[0_2px_12px_rgba(20,21,43,.04)]">
              <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-[#EEF0FF] text-[#5A6ACF]">
                <KeyRound className="size-5" />
              </div>
              <h2 className="text-[16px] font-bold text-[#14152B]">
                配置模型后即可开启简历 Agent 对话
              </h2>
              <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-[#8C8FA8]">
                还没有保存模型密钥。你仍可在右侧直接编辑 Markdown 源码或导出简历，配置模型后即可使用 AI 采访创建与智能润色。
              </p>
              <Link href="/settings?tab=model" className="mt-5 inline-flex">
                <Button className="h-10 rounded-xl bg-[#5A6ACF] px-5 hover:bg-[#4f5dbb]">
                  前往设置配置模型
                </Button>
              </Link>
            </div>
          ) : messages.length === 0 ? (
            <div className="my-8 flex flex-col items-center text-center">
              <BrandMark
                size="xl"
                className="mb-3 shadow-[0_8px_24px_rgba(90,106,207,.24)]"
              />
              <h2 className="text-[20px] font-extrabold tracking-tight text-[#14152B] sm:text-[22px]">
                {emptyBody
                  ? '准备好创建这份简历了吗？'
                  : '想怎么打磨这份简历？'}
              </h2>
              <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-[#8C8FA8]">
                {emptyBody
                  ? '直接告诉我你的姓名、目标岗位与核心经历，或点击下方快捷气泡由我一步步采访你。'
                  : '右侧已载入当前简历正文。你可以让我按 STAR 法则润色、针对目标 JD 改写，或调整特定章节。'}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggestions.map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    disabled={busy}
                    onClick={() => handleSend(promptText)}
                    className="rounded-full border border-[#E7E9F3] bg-white px-4 py-2 text-[13px] font-medium text-[#565A78] shadow-2xs transition-all hover:border-[#5A6ACF]/40 hover:bg-[#EEF0FF]/60 hover:text-[#14152B] disabled:opacity-50"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isLast = index === messages.length - 1

              if (message.role === 'user') {
                const text = extractMessageText(message)
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#5A6ACF] px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap text-white shadow-xs">
                      {text}
                    </div>
                  </div>
                )
              }

              const text = extractMessageText(message)
              const toolParts = extractWriteBodyToolParts(message)
              const showEmptyThinking =
                !text.trim() && toolParts.length === 0 && isLast && busy

              return (
                <div key={message.id} className="flex items-start gap-3">
                  <BrandMark size="xs" className="mt-0.5 shadow-2xs" />
                  <div className="min-w-0 flex-1 space-y-2.5">
                    {toolParts.map((part) => (
                      <WriteResumeToolCard
                        key={part.toolCallId}
                        part={part}
                        onInspectPreview={onInspectPreview}
                      />
                    ))}

                    {showEmptyThinking ? (
                      <ThinkingIndicator />
                    ) : text.trim() ? (
                      <div className="rounded-2xl rounded-tl-sm border border-[#E7E9F3] bg-white px-4 py-3 text-[14px] leading-relaxed text-[#14152B] shadow-[0_1px_3px_rgba(20,21,43,.03)]">
                        <div className="agent-chat-md">
                          <Markdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {text}
                          </Markdown>
                        </div>
                        {isLast && status === 'streaming' ? (
                          <span
                            aria-hidden
                            className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-xs bg-[#5A6ACF] align-middle"
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}

          {waitingForAssistantBubble ? (
            <div className="flex items-start gap-3">
              <BrandMark size="xs" className="mt-0.5 shadow-2xs" />
              <ThinkingIndicator />
            </div>
          ) : null}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* 底部元宝式悬浮输入舱 */}
      <div className="shrink-0 px-4 pt-1 pb-4 sm:px-6">
        <form
          className="mx-auto w-full max-w-2xl"
          onSubmit={(event) => {
            event.preventDefault()
            handleSend(draft)
          }}
        >
          <div className="rounded-2xl border border-[#E7E9F3] bg-white p-3 shadow-[0_4px_20px_rgba(20,21,43,.05)] transition-all focus-within:border-[#5A6ACF]/50 focus-within:shadow-[0_8px_28px_rgba(90,106,207,.12)]">
            <textarea
              ref={textareaRef}
              rows={2}
              value={draft}
              disabled={!configured || busy}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault()
                  handleSend(draft)
                }
              }}
              placeholder={
                !configured
                  ? '请先在设置中配置模型密钥…'
                  : emptyBody
                    ? '回答 Agent 的提问，或直接粘贴你的经历描述（Enter 发送，Shift + Enter 换行）…'
                    : '告诉 Agent 你想润色哪一段、补充什么指标或针对哪个岗位优化…'
              }
              className="max-h-36 min-h-[52px] w-full resize-none bg-transparent px-1 py-0.5 text-[14px] leading-relaxed text-[#14152B] placeholder:text-[#8C8FA8] focus:outline-none disabled:opacity-60"
            />

            <div className="mt-1.5 flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 text-[11px] text-[#8C8FA8]">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F6F7FB] px-2.5 py-1 font-medium text-[#565A78]">
                  <Wand2 className="size-3 text-[#5A6ACF]" />
                  {emptyBody ? '创建模式' : '润色模式'}
                </span>
                <span className="hidden sm:inline">
                  <FileCheck2 className="mr-1 inline size-3 text-[#8C8FA8]" />
                  AI 提交整篇正文时自动同步至右侧预览
                </span>
              </div>

              <button
                type="submit"
                disabled={!configured || busy || !draft.trim()}
                aria-label={busy ? '生成中' : '发送消息'}
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full transition-all',
                  configured && draft.trim() && !busy
                    ? 'bg-[#5A6ACF] text-white shadow-xs hover:bg-[#4f5dbb]'
                    : busy
                      ? 'bg-[#EEF0FF] text-[#5A6ACF]'
                      : 'bg-[#EEF0F5] text-[#8C8FA8]',
                )}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .agent-chat-md h1,
        .agent-chat-md h2,
        .agent-chat-md h3,
        .agent-chat-md h4 {
          font-weight: 700;
          margin: 0.55em 0 0.3em;
          color: #14152B;
        }
        .agent-chat-md strong {
          font-weight: 700;
          color: #14152B;
        }
        .agent-chat-md p {
          margin: 0.35em 0;
        }
        .agent-chat-md p:first-child {
          margin-top: 0;
        }
        .agent-chat-md p:last-child {
          margin-bottom: 0;
        }
        .agent-chat-md ul, .agent-chat-md ol {
          margin: 0.4em 0 0.4em 1.25em;
        }
        .agent-chat-md ul {
          list-style-type: disc;
        }
        .agent-chat-md ol {
          list-style-type: decimal;
        }
        .agent-chat-md li {
          margin: 0.2em 0;
        }
        .agent-chat-md code {
          background: #F6F7FB;
          border: 1px solid #E7E9F3;
          color: #14152B;
          border-radius: 4px;
          padding: 0.1em 0.35em;
          font-size: 12.5px;
        }
        .agent-chat-md pre {
          background: #F6F7FB;
          border: 1px solid #E7E9F3;
          color: #14152B;
          border-radius: 8px;
          padding: 0.65em 0.85em;
          overflow-x: auto;
          margin: 0.5em 0;
        }
        .agent-chat-md pre code {
          background: transparent;
          border: 0;
          padding: 0;
          color: inherit;
        }
        .agent-chat-md hr {
          border: 0;
          height: 1px;
          background: rgba(20, 21, 43, 0.07);
          margin: 0.85em 0;
        }
        .agent-chat-table-wrap {
          margin: 0.65em 0;
          overflow-x: auto;
          border: 1px solid #E7E9F3;
          border-radius: 10px;
          background: #FFFFFF;
        }
        .agent-chat-md table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          line-height: 1.55;
        }
        .agent-chat-md th,
        .agent-chat-md td {
          padding: 0.55rem 0.75rem;
          text-align: left;
          vertical-align: middle;
          border-right: 1px solid #E7E9F3;
          border-bottom: 1px solid #E7E9F3;
          min-width: 6.5rem;
          color: #14152B;
        }
        .agent-chat-md th:last-child,
        .agent-chat-md td:last-child {
          border-right: 0;
        }
        .agent-chat-md tbody tr:last-child td {
          border-bottom: 0;
        }
        .agent-chat-md thead th {
          background: #F6F7FB;
          font-weight: 600;
          color: #14152B;
          white-space: nowrap;
        }
        .agent-chat-md tbody tr {
          background: #FFFFFF;
        }
        .agent-chat-md tbody tr:nth-child(even) {
          background: #FAFBFF;
        }

        .dark .agent-chat-md h1,
        .dark .agent-chat-md h2,
        .dark .agent-chat-md h3,
        .dark .agent-chat-md h4,
        .dark .agent-chat-md strong {
          color: #F8FAFC;
        }
        .dark .agent-chat-md code {
          background: #1E2436;
          border-color: #2B324B;
          color: #E2E8F0;
        }
        .dark .agent-chat-md pre {
          background: #0F111A;
          border-color: #252B40;
          color: #E2E8F0;
        }
        .dark .agent-chat-md hr {
          background: rgba(255, 255, 255, 0.06);
        }
        .dark .agent-chat-table-wrap {
          background: #121521;
          border-color: #252B40;
        }
        .dark .agent-chat-md thead th {
          background: #1B2032;
          color: #F1F5F9;
          border-color: #252B40;
        }
        .dark .agent-chat-md td {
          color: #E2E8F0;
          border-color: #252B40;
        }
        .dark .agent-chat-md tbody tr {
          background: #121521;
        }
        .dark .agent-chat-md tbody tr:nth-child(even) {
          background: #161A29;
        }
      `}</style>
    </div>
  )
}
