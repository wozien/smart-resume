'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowUp,
  Code2,
  FileText,
  KeyRound,
  Loader2,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { AppFrame, AppFrameNavButtons } from '@/components/app-frame'
import { BrandMark } from '@/components/brand-logo'
import { api } from '@/lib/api'
import { UNNAMED_TITLE } from '@/lib/constants'
import { setPendingPrompt } from '@/lib/pending-prompt'
import type { ModelConfigPublic } from '@/lib/types'
import { cn } from '@/lib/utils'

const QUICK_PROMPTS = [
  {
    label: '从零采访我，生成完整简历',
    prompt: '我想从零创建一份中文简历，请一步步采访我的基本信息、工作经历、项目经历、教育背景和技能。',
  },
  {
    label: '应届生挖掘实习与项目亮点',
    prompt: '我是一名应届毕业生，经历较少，请通过提问帮我挖掘实习、课程项目和校园经历中的亮点并写成简历。',
  },
  {
    label: '结合目标岗位 JD 定制简历',
    prompt: '我想针对目标岗位定制一份高匹配度简历，请先询问我的目标岗位名称、JD 要求以及我现有的核心经历。',
  },
  {
    label: '用 STAR 法则量化项目成果',
    prompt: '我想重点打磨技术与项目经历，请引导我用 STAR 法则补充背景、行动与量化成果指标，生成专业简历。',
  },
] as const

function deriveTitleFromPrompt(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return UNNAMED_TITLE
  return cleaned.length > 18 ? `${cleaned.slice(0, 18)}…` : cleaned
}

export default function AppShell() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState('')
  const [pendingAction, setPendingAction] = useState<
    'prompt' | 'import' | 'blank' | null
  >(null)

  const modelConfig = useQuery({
    queryKey: ['model-config'],
    queryFn: () => api<ModelConfigPublic>('/api/me/model-config'),
  })

  const create = useMutation({
    mutationFn: (payload: {
      title?: string
      body?: string
      filename?: string
      initialPrompt?: string
      mode?: 'source' | 'preview'
    }) =>
      api<{ id: string }>('/api/resumes', {
        method: 'POST',
        body: JSON.stringify({
          title: payload.title,
          body: payload.body,
          filename: payload.filename,
        }),
      }),
    onSuccess: (data, variables) => {
      if (variables.initialPrompt) {
        setPendingPrompt(data.id, variables.initialPrompt)
      }
      void queryClient.invalidateQueries({ queryKey: ['resumes'] })
      const query = variables.mode === 'source' ? '?mode=source' : ''
      router.push(`/resumes/${data.id}${query}`)
    },
    onError: (err) => {
      setPendingAction(null)
      toast.error(err.message)
    },
  })

  function submitPrompt(text: string) {
    const trimmed = text.trim()
    if (!trimmed || create.isPending) return
    setPendingAction('prompt')
    create.mutate({
      title: deriveTitleFromPrompt(trimmed),
      body: '',
      initialPrompt: trimmed,
    })
  }

  async function onPickFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.md')) {
      toast.error('只支持 Markdown（.md）文件')
      return
    }
    setPendingAction('import')
    try {
      const body = await file.text()
      create.mutate({ filename: file.name, body })
    } catch {
      setPendingAction(null)
      toast.error('读取文件失败')
    }
  }

  function handleCreateBlank() {
    if (create.isPending) return
    setPendingAction('blank')
    create.mutate({
      title: UNNAMED_TITLE,
      body: '',
      mode: 'source',
    })
  }

  const configured = modelConfig.data?.configured !== false

  return (
    <AppFrame fullBleed>
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-linear-to-b from-[#FAFBFF] to-[#F6F7FB]">
        {/* 轻量沉浸顶栏 */}
        <header className="flex h-14 shrink-0 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <AppFrameNavButtons />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-[#565A78] ring-1 ring-[#E7E9F3]">
              <Sparkles className="size-3.5 text-[#5A6ACF]" />
              简历 Agent 工作台
            </span>
          </div>

          {!modelConfig.isLoading && !configured ? (
            <Link
              href="/settings?tab=model"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFAEB] px-3 py-1 text-[12px] font-medium text-[#B54708] ring-1 ring-[#F79009]/30 transition-colors hover:bg-[#FEF0C7]"
            >
              <KeyRound className="size-3.5" />
              未配置模型密钥 · 去设置
            </Link>
          ) : null}
        </header>

        <input
          ref={fileRef}
          type="file"
          accept=".md,text/markdown"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void onPickFile(file)
          }}
        />

        {/* 元宝风格居中欢迎区 */}
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-6 sm:px-8">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
            {/* 品牌 Agent 徽标与主问候语 */}
            <div className="mb-3 flex items-center gap-3.5">
              <BrandMark
                size="lg"
                className="shadow-[0_8px_24px_rgba(90,106,207,.28)]"
              />
              <h1 className="text-[24px] font-extrabold tracking-tight text-[#14152B] sm:text-[28px]">
                今天能帮你打磨哪份简历？
              </h1>
            </div>
            <p className="mb-7 max-w-xl text-center text-[13px] leading-relaxed text-[#8C8FA8]">
              每份简历拥有独立的 Agent 对话上下文，支持从零采访生成、导入 Markdown 深度润色与实时排版预览
            </p>

            {/* 快捷指令气泡矩阵 */}
            <div className="mb-10 flex max-w-2xl flex-wrap items-center justify-center gap-2.5">
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  disabled={create.isPending}
                  onClick={() => {
                    if (!configured) {
                      setDraft(item.prompt)
                      textareaRef.current?.focus()
                      return
                    }
                    submitPrompt(item.prompt)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E9F3] bg-white px-4 py-2 text-[13px] font-medium text-[#565A78] shadow-[0_1px_2px_rgba(20,21,43,.03)] transition-all hover:border-[#5A6ACF]/40 hover:bg-[#EEF0FF]/50 hover:text-[#14152B] disabled:opacity-50"
                >
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                type="button"
                disabled={create.isPending}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E9F3] bg-white px-4 py-2 text-[13px] font-medium text-[#5A6ACF] shadow-[0_1px_2px_rgba(20,21,43,.03)] transition-all hover:border-[#5A6ACF]/40 hover:bg-[#EEF0FF]/70 disabled:opacity-50"
              >
                <Upload className="size-3.5" />
                <span>导入本地 Markdown 简历进行润色 &gt;</span>
              </button>
            </div>

            {/* 底部大尺寸悬浮对话输入舱 */}
            <form
              className="w-full"
              onSubmit={(event) => {
                event.preventDefault()
                submitPrompt(draft)
              }}
            >
              <div className="rounded-3xl border border-[#E7E9F3] bg-white p-3.5 shadow-[0_6px_28px_rgba(20,21,43,.06)] transition-all focus-within:border-[#5A6ACF]/50 focus-within:shadow-[0_10px_36px_rgba(90,106,207,.13)]">
                <textarea
                  ref={textareaRef}
                  rows={3}
                  value={draft}
                  disabled={create.isPending}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault()
                      submitPrompt(draft)
                    }
                  }}
                  placeholder="发送消息开启新简历对话：输入目标岗位、个人经历，或直接粘贴简历初稿…"
                  className="w-full resize-none bg-transparent px-1.5 py-1 text-[14px] leading-relaxed text-[#14152B] placeholder:text-[#8C8FA8] focus:outline-none disabled:opacity-60"
                />

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={create.isPending}
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#E7E9F3] bg-[#F6F7FB] px-3 text-[12px] font-medium text-[#565A78] transition-colors hover:bg-[#EEF0FF] hover:text-[#5A6ACF] disabled:opacity-50"
                    >
                      {pendingAction === 'import' ? (
                        <Loader2 className="size-3.5 animate-spin text-[#5A6ACF]" />
                      ) : (
                        <Upload className="size-3.5" />
                      )}
                      导入 Markdown
                    </button>

                    <button
                      type="button"
                      disabled={create.isPending}
                      onClick={handleCreateBlank}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#E7E9F3] bg-[#F6F7FB] px-3 text-[12px] font-medium text-[#565A78] transition-colors hover:bg-[#EEF0FF] hover:text-[#5A6ACF] disabled:opacity-50"
                    >
                      {pendingAction === 'blank' ? (
                        <Loader2 className="size-3.5 animate-spin text-[#5A6ACF]" />
                      ) : (
                        <Code2 className="size-3.5" />
                      )}
                      空白源码编辑
                    </button>

                    <span className="hidden items-center gap-1 rounded-full px-2.5 py-1 text-[12px] text-[#8C8FA8] sm:inline-flex">
                      <Wand2 className="size-3.5 text-[#5A6ACF]" />
                      自动创建简历并同步预览
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={create.isPending || !draft.trim()}
                    aria-label="发送消息并创建简历"
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full transition-all',
                      draft.trim() && !create.isPending
                        ? 'bg-[#5A6ACF] text-white shadow-xs hover:bg-[#4f5dbb]'
                        : 'bg-[#EEF0F5] text-[#8C8FA8]',
                    )}
                  >
                    {pendingAction === 'prompt' ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowUp className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            {create.isPending ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#EEF0FF] px-3.5 py-1.5 text-[12px] font-medium text-[#5A6ACF]">
                <Loader2 className="size-3.5 animate-spin" />
                <span>
                  {pendingAction === 'import'
                    ? '正在导入简历并初始化工作台…'
                    : pendingAction === 'blank'
                      ? '正在创建空白简历工作台…'
                      : '正在创建简历并进入 Agent 对话…'}
                </span>
              </div>
            ) : (
              <p className="mt-4 flex items-center gap-1.5 text-center text-[11px] text-[#8C8FA8]">
                <FileText className="size-3" />
                内容由 AI 辅助生成，每次修改自动保留上一版修订以便随时恢复
              </p>
            )}
          </div>
        </div>
      </div>
    </AppFrame>
  )
}
