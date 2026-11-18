'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FilePlus, LayoutGrid, List, Sparkles, Trash2, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AppFrame } from '@/components/app-frame'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { UNNAMED_TITLE } from '@/lib/constants'
import { stripMd } from '@/lib/md-text'
import type { ResumeListItem } from '@/lib/types'
import { cn } from '@/lib/utils'

type ListView = 'card' | 'list'

const LIST_VIEW_STORAGE_KEY = 'resume-list-view'

function isListView(value: string | null): value is ListView {
  return value === 'card' || value === 'list'
}

function readListView(): ListView {
  try {
    const stored = window.localStorage.getItem(LIST_VIEW_STORAGE_KEY)
    return isListView(stored) ? stored : 'card'
  } catch {
    return 'card'
  }
}

function persistListView(view: ListView) {
  try {
    window.localStorage.setItem(LIST_VIEW_STORAGE_KEY, view)
  } catch {
    // private mode / quota
  }
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ListView
  onChange: (view: ListView) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="简历展示方式"
      className="flex rounded-lg border border-[#E7E9F3] bg-[#F6F7FB] p-0.5"
    >
      <ViewToggleButton
        pressed={view === 'card'}
        label="卡片视图"
        onSelect={() => onChange('card')}
      >
        <LayoutGrid />
      </ViewToggleButton>
      <ViewToggleButton
        pressed={view === 'list'}
        label="列表视图"
        onSelect={() => onChange('list')}
      >
        <List />
      </ViewToggleButton>
    </div>
  )
}

function ViewToggleButton({
  pressed,
  label,
  onSelect,
  children,
}: {
  pressed: boolean
  label: string
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={pressed}
      aria-label={label}
      className={cn(
        'flex size-9 items-center justify-center rounded-md transition-colors duration-200 outline-none',
        'focus-visible:ring-3 focus-visible:ring-[#5A6ACF]/40',
        '[&_svg]:size-4',
        pressed ? 'bg-white text-[#5A6ACF] shadow-sm' : 'text-[#8C8FA8] hover:text-[#565A78]',
      )}
      onClick={onSelect}
    >
      {children}
    </button>
  )
}

function A4Preview({ preview }: { preview: string }) {
  const lines = preview
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => stripMd(line).trim())
    .filter(Boolean)
    .slice(0, 28)

  if (lines.length === 0) {
    return (
      <div className="flex h-full flex-col px-[14%] pt-[16%]" aria-hidden>
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="mb-[3.2%] h-[2%] rounded-full bg-[#EEF0F5]"
            style={{ width: index % 4 === 0 ? '48%' : index % 3 === 0 ? '82%' : '100%' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden px-[13%] py-[11%]" aria-hidden>
      {lines.map((line, index) => {
        const heading = /^#{1,6}\s+/.test(line)
        const text = line.replace(/^#{1,6}\s+/, '')
        if (index === 0 && !heading) {
          return (
            <p key={index} className="mb-[5%] text-center text-[9px] leading-tight font-bold text-[#14152B]">
              {text}
            </p>
          )
        }
        return (
          <p
            key={index}
            className={cn(
              'truncate',
              heading
                ? 'mt-[5%] mb-[1.5%] text-[7.5px] font-bold tracking-wide text-[#5A6ACF]'
                : 'text-[6.5px] leading-[1.55] text-[#565A78]',
            )}
          >
            {text}
          </p>
        )
      })}
    </div>
  )
}

function ResumeCard({
  item,
  onOpen,
  onDelete,
}: {
  item: ResumeListItem
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <li className="group relative mx-auto w-full max-w-[176px]">
      <button
        type="button"
        className="w-full text-center outline-none [&:focus-visible_[data-paper]]:ring-3 [&:focus-visible_[data-paper]]:ring-[#5A6ACF]/40"
        aria-label={`打开 ${item.title}`}
        onClick={onOpen}
      >
        <div
          data-paper
          className="relative aspect-[210/297] overflow-hidden rounded-md border border-[#E7E9F3] bg-white shadow-[0_1px_2px_rgba(20,21,43,.06),0_10px_24px_rgba(20,21,43,.08)] transition-shadow duration-200 group-hover:shadow-[0_12px_32px_rgba(20,21,43,.12)]"
        >
          <A4Preview preview={item.preview} />
        </div>
        <div className="mt-2.5 min-w-0">
          <p className="truncate text-[14px] font-semibold text-[#14152B]">{item.title}</p>
          <p className="mt-0.5 text-[12px] text-[#8C8FA8]">
            {new Date(item.updatedAt).toLocaleString('zh-CN')}
          </p>
        </div>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1.5 right-1.5 size-9 bg-white/90 opacity-100 shadow-sm sm:opacity-0 sm:group-hover:opacity-100"
        aria-label={`删除 ${item.title}`}
        onClick={onDelete}
      >
        <Trash2 className="size-4 text-[#B42318]" />
      </Button>
    </li>
  )
}

function ResumeRow({
  item,
  onOpen,
  onDelete,
}: {
  item: ResumeListItem
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <li className="group flex items-center gap-3 border-b border-[#F1F2F8] px-5 py-3.5 last:border-b-0 hover:bg-[#FAFBFF]">
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpen}>
        <p className="truncate text-sm font-semibold">{item.title}</p>
        <p className="text-[13px] text-[#8C8FA8]">
          {item.hasBody ? '已有正文' : '正文为空'} · {new Date(item.updatedAt).toLocaleString('zh-CN')}
        </p>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label={`删除 ${item.title}`}
        onClick={onDelete}
      >
        <Trash2 className="size-4 text-[#B42318]" />
      </Button>
    </li>
  )
}

export default function AppShell() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingDelete, setPendingDelete] = useState<ResumeListItem | null>(null)
  const [view, setView] = useState<ListView>(readListView)

  const list = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api<{ resumes: ResumeListItem[] }>('/api/resumes'),
  })

  const create = useMutation({
    mutationFn: (payload: { title?: string; body?: string; filename?: string; intent?: 'create' | 'blank' }) =>
      api<{ id: string }>('/api/resumes', {
        method: 'POST',
        body: JSON.stringify({
          title: payload.title,
          body: payload.body,
          filename: payload.filename,
        }),
      }),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['resumes'] })
      router.push(variables.intent === 'create' ? `/resumes/${data.id}?intent=create` : `/resumes/${data.id}`)
    },
    onError: (err) => toast.error(err.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/resumes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setPendingDelete(null)
      void queryClient.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('已删除')
    },
    onError: (err) => toast.error(err.message),
  })

  async function onPickFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.md')) {
      toast.error('只支持 Markdown（.md）文件')
      return
    }
    const body = await file.text()
    create.mutate({ filename: file.name, body })
  }

  function changeView(next: ListView) {
    setView(next)
    persistListView(next)
  }

  const resumes = list.data?.resumes ?? []

  return (
    <AppFrame title="我的简历">
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          className="h-10 bg-[#5A6ACF] hover:bg-[#4f5dbb]"
          onClick={() => fileRef.current?.click()}
        >
          <Upload />
          导入 Markdown
        </Button>
        <Button
          variant="outline"
          className="h-10"
          onClick={() => create.mutate({ title: UNNAMED_TITLE, body: '', intent: 'create' })}
        >
          <Sparkles />
          AI 从零创建
        </Button>
        <Button
          variant="outline"
          className="h-10"
          onClick={() => create.mutate({ title: UNNAMED_TITLE, body: '', intent: 'blank' })}
        >
          <FilePlus />
          空白编辑
        </Button>
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
      </div>

      {list.isLoading ? (
        <p className="text-sm text-[#8C8FA8]">加载中…</p>
      ) : resumes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E7E9F3] bg-white px-6 py-16 text-center">
          <p className="text-base font-semibold">还没有简历</p>
          <p className="mt-1 text-sm text-[#8C8FA8]">导入一份 Markdown，或让 AI 从零采访你。</p>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[15px] font-bold">全部简历</p>
              <p className="text-[13px] text-[#8C8FA8]">按最近更新排列</p>
            </div>
            <ViewToggle view={view} onChange={changeView} />
          </div>
          {view === 'card' ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-x-5 gap-y-6">
              {resumes.map((item) => (
                <ResumeCard
                  key={item.id}
                  item={item}
                  onOpen={() => router.push(`/resumes/${item.id}`)}
                  onDelete={() => setPendingDelete(item)}
                />
              ))}
            </ul>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#E7E9F3] bg-white">
              <ul>
                {resumes.map((item) => (
                  <ResumeRow
                    key={item.id}
                    item={item}
                    onOpen={() => router.push(`/resumes/${item.id}`)}
                    onDelete={() => setPendingDelete(item)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除这份简历？</DialogTitle>
            <DialogDescription>
              {pendingDelete?.title} 的正文、对话和修订会一起消失，无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
              disabled={remove.isPending}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppFrame>
  )
}
