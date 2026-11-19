'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  Loader2,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Sun,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { BrandMark } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { api } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { UNNAMED_TITLE } from '@/lib/constants'
import type { ResumeListItem } from '@/lib/types'
import { cn } from '@/lib/utils'

const SIDEBAR_COLLAPSED_KEY = 'app-sidebar-collapsed'

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

/** Survives AppFrame remounts when switching client-only pages. */
let collapsedMemory = readCollapsed()

type AppFrameContextValue = {
  collapsed: boolean
  toggleCollapsed: () => void
  openMobileNav: () => void
}

const AppFrameContext = createContext<AppFrameContextValue | null>(null)

export function useAppFrame() {
  const ctx = useContext(AppFrameContext)
  if (!ctx) {
    throw new Error('useAppFrame must be used within AppFrame')
  }
  return ctx
}

const PANE_TOGGLE_CLASS =
  'size-8 shrink-0 text-[#565A78] hover:bg-[#F6F7FB] hover:text-[#14152B]'

export function AppFrameNavButtons({ className }: { className?: string }) {
  const { collapsed, toggleCollapsed, openMobileNav } = useAppFrame()
  const collapseLabel = collapsed ? '展开侧栏' : '折叠侧栏'
  return (
    <div className={cn('flex shrink-0 items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(PANE_TOGGLE_CLASS, 'lg:hidden')}
        onClick={openMobileNav}
        aria-label="打开导航"
      >
        <Menu className="size-4" />
      </Button>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn(PANE_TOGGLE_CLASS, 'hidden lg:inline-flex')}
              onClick={toggleCollapsed}
              aria-label={collapseLabel}
            />
          }
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          {collapseLabel}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

const SKELETON_WIDTHS = ['76%', '58%', '84%', '64%', '70%']

function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingDelete, setPendingDelete] = useState<ResumeListItem | null>(null)
  const [creatingMode, setCreatingMode] = useState<'new' | 'import' | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { data: session } = authClient.useSession()

  const list = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api<{ resumes: ResumeListItem[] }>('/api/resumes'),
  })

  const create = useMutation({
    mutationFn: (payload: { title?: string; body?: string; filename?: string }) =>
      api<{ id: string }>('/api/resumes', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['resumes'] })
      onNavigate?.()
      router.push(`/resumes/${data.id}`)
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setCreatingMode(null),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/resumes/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, deletedId) => {
      setPendingDelete(null)
      void queryClient.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('已删除简历')
      if (pathname === `/resumes/${deletedId}`) {
        router.replace('/')
      }
    },
    onError: (err) => toast.error(err.message),
  })

  function handleCreateNew() {
    if (create.isPending) return
    setCreatingMode('new')
    create.mutate({ title: UNNAMED_TITLE, body: '' })
  }

  async function handlePickFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.md')) {
      toast.warning('只支持 Markdown（.md）文件')
      return
    }
    setCreatingMode('import')
    try {
      const body = await file.text()
      create.mutate({ filename: file.name, body })
    } catch {
      setCreatingMode(null)
      toast.error('读取文件失败')
    }
  }

  async function signOut() {
    setPopoverOpen(false)
    await authClient.signOut()
    router.replace('/login')
  }

  const resumes = list.data?.resumes ?? []
  const avatarInitial = (session?.user.name || session?.user.email || '用')
    .slice(0, 1)
    .toUpperCase()

  return (
    <div className="flex h-full flex-col bg-white select-none">
      {/* 顶部产品 Logo 区域 */}
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          'flex h-16 shrink-0 items-center',
          collapsed ? 'justify-center px-2' : 'gap-2.5 px-4',
        )}
      >
        <BrandMark
          size="sm"
          className="shadow-[0_4px_12px_rgba(90,106,207,.24)]"
        />
        {collapsed ? (
          <span className="sr-only">智能简历</span>
        ) : (
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[15px] font-extrabold tracking-tight text-[#14152B]">
              智能简历
            </span>
            <span className="rounded-md bg-[#EEF0FF] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#5A6ACF] uppercase">
              AI
            </span>
          </div>
        )}
      </Link>

      <input
        ref={fileRef}
        type="file"
        accept=".md,text/markdown"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void handlePickFile(file)
        }}
      />

      {/* 我的简历标题行 + 右侧新建与导入按钮 */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-1 border-b border-[#F1F2F8] px-2 py-3">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg text-[#5A6ACF] hover:bg-[#EEF0FF]"
                  onClick={handleCreateNew}
                  disabled={create.isPending}
                  aria-label="新建简历"
                />
              }
            >
              {creatingMode === 'new' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              新建简历
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg text-[#565A78] hover:bg-[#F6F7FB] hover:text-[#14152B]"
                  onClick={() => fileRef.current?.click()}
                  disabled={create.isPending}
                  aria-label="导入 Markdown"
                />
              }
            >
              {creatingMode === 'import' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              导入 Markdown
            </TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-between px-4 pt-4 pb-2">
          <span className="text-[12px] font-bold tracking-wide text-[#565A78]">
            我的简历
          </span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    disabled={create.isPending}
                    aria-label="新建简历"
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-[#5A6ACF] transition-colors hover:bg-[#EEF0FF] disabled:opacity-50"
                  />
                }
              >
                {creatingMode === 'new' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                <span>新建</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                新建简历并开启 Agent 对话
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={create.isPending}
                    aria-label="导入 Markdown"
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-[#565A78] transition-colors hover:bg-[#F6F7FB] hover:text-[#14152B] disabled:opacity-50"
                  />
                }
              >
                {creatingMode === 'import' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                <span>导入</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                导入本地 Markdown (.md) 简历
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* 简历列表滚动区 */}
      <div
        className={cn(
          'flex-1 overflow-y-auto',
          collapsed ? 'px-2 py-2' : 'px-2.5 pb-3',
        )}
      >
        {list.isLoading ? (
          <div
            className="flex flex-col gap-1.5 py-1"
            aria-label="正在加载简历列表"
          >
            {SKELETON_WIDTHS.map((width, index) =>
              collapsed ? (
                <Skeleton
                  key={index}
                  className="mx-auto size-9 rounded-lg"
                />
              ) : (
                <div
                  key={index}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                >
                  <Skeleton className="size-4 shrink-0 rounded" />
                  <Skeleton className="h-3.5 rounded" style={{ width }} />
                </div>
              ),
            )}
          </div>
        ) : resumes.length === 0 ? (
          collapsed ? null : (
            <div className="mx-1.5 mt-2 rounded-xl border border-dashed border-[#E7E9F3] bg-[#FAFBFF] px-3 py-6 text-center">
              <p className="text-[12px] font-medium text-[#565A78]">
                暂无简历
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#8C8FA8]">
                点击上方「新建」或「导入」开启你的第一份简历对话
              </p>
            </div>
          )
        ) : (
          <ul className="flex flex-col gap-0.5">
            {resumes.map((item) => {
              const href = `/resumes/${item.id}`
              const active = pathname === href

              if (collapsed) {
                return (
                  <li key={item.id}>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Link
                            href={href}
                            onClick={onNavigate}
                            className={cn(
                              'flex size-10 mx-auto items-center justify-center rounded-lg transition-colors',
                              active
                                ? 'bg-[#EEF0FF] font-semibold text-[#5A6ACF]'
                                : 'text-[#565A78] hover:bg-[#F6F7FB] hover:text-[#14152B]',
                            )}
                          />
                        }
                      >
                        <FileText className="size-[18px] shrink-0" />
                        <span className="sr-only">{item.title}</span>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                )
              }

              return (
                <li
                  key={item.id}
                  className={cn(
                    'group relative flex items-center rounded-lg transition-colors',
                    active
                      ? 'bg-[#EEF0FF] text-[#5A6ACF]'
                      : 'text-[#565A78] hover:bg-[#F6F7FB] hover:text-[#14152B]',
                  )}
                >
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pr-8 pl-3 text-[13px]"
                  >
                    <FileText
                      className={cn(
                        'size-4 shrink-0 transition-colors',
                        active
                          ? 'text-[#5A6ACF]'
                          : 'text-[#8C8FA8] group-hover:text-[#565A78]',
                      )}
                    />
                    <span
                      className={cn(
                        'truncate leading-snug',
                        active ? 'font-semibold' : 'font-normal',
                      )}
                    >
                      {item.title}
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`删除 ${item.title}`}
                    title="删除简历"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setPendingDelete(item)
                    }}
                    className="absolute right-1.5 flex size-6 items-center justify-center rounded-md text-[#8C8FA8] opacity-100 transition-opacity hover:bg-white/90 hover:text-[#B42318] sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 底部用户区：Hover 头像弹出 Popover 菜单 */}
      <div
        className={cn(
          'mt-auto',
          collapsed ? 'p-2' : 'p-2.5',
        )}
      >
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger
            openOnHover
            delay={100}
            closeDelay={180}
            render={
              <button
                type="button"
                aria-label="个人中心菜单"
                className={cn(
                  'flex w-full items-center rounded-xl text-left transition-colors outline-none hover:bg-[#F6F7FB] focus-visible:ring-2 focus-visible:ring-[#5A6ACF]/40',
                  collapsed ? 'justify-center p-1.5' : 'gap-2.5 px-2.5 py-2',
                )}
              />
            }
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#EEF0FF] to-[#E0E4FF] text-[13px] font-semibold text-[#5A6ACF] ring-1 ring-[#5A6ACF]/15">
              {avatarInitial}
            </div>
            {collapsed ? null : (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#14152B]">
                  {session?.user.name ?? '用户'}
                </p>
                <p className="truncate text-[11px] text-[#8C8FA8]">
                  {session?.user.email}
                </p>
              </div>
            )}
          </PopoverTrigger>

          <PopoverContent
            side={collapsed ? 'right' : 'top'}
            align="start"
            sideOffset={10}
            className="w-56 gap-1 rounded-2xl border border-[#E7E9F3] bg-white p-2 shadow-[0_16px_48px_rgba(20,21,43,.14)] ring-0"
          >
            <div className="mb-1 border-b border-[#F1F2F8] px-2.5 py-2">
              <p className="truncate text-[13px] font-semibold text-[#14152B]">
                {session?.user.name ?? '用户'}
              </p>
              <p className="truncate text-[11px] text-[#8C8FA8]">
                {session?.user.email}
              </p>
            </div>

            <Link
              href="/account"
              onClick={() => {
                setPopoverOpen(false)
                onNavigate?.()
              }}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-[#14152B] transition-colors hover:bg-[#F6F7FB]"
            >
              <UserRound className="size-4 text-[#565A78]" />
              个人中心
            </Link>

            <Link
              href="/settings"
              onClick={() => {
                setPopoverOpen(false)
                onNavigate?.()
              }}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-[#14152B] transition-colors hover:bg-[#F6F7FB]"
            >
              <Settings className="size-4 text-[#565A78]" />
              设置
            </Link>

            <div className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5">
              <span className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[#14152B]">
                <Palette className="size-4 text-[#565A78]" />
                外观
              </span>
              <div
                role="radiogroup"
                aria-label="界面外观切换"
                className="flex items-center rounded-lg border border-[#E7E9F3] bg-[#F6F7FB] p-0.5"
              >
                {(
                  [
                    { id: 'light', label: '浅色', icon: Sun },
                    { id: 'dark', label: '暗黑', icon: Moon },
                    { id: 'system', label: '系统', icon: Monitor },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon
                  const active = (theme ?? 'light') === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={item.label}
                      title={item.label}
                      onClick={() => setTheme(item.id)}
                      className={cn(
                        'flex size-6 items-center justify-center rounded-md transition-all outline-none',
                        active
                          ? 'bg-white text-[#5A6ACF] shadow-2xs'
                          : 'text-[#8C8FA8] hover:text-[#14152B]',
                      )}
                    >
                      <Icon className="size-3.5" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="my-1 h-px bg-border" />

            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium text-[#B42318] transition-colors hover:bg-[#FEF3F2]"
            >
              <LogOut className="size-4" />
              退出登录
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* 删除确认弹窗 */}
      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除这份简历？</DialogTitle>
            <DialogDescription>
              「{pendingDelete?.title}」的正文、对话和修订会一起消失，无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={remove.isPending}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
              disabled={remove.isPending}
            >
              {remove.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  删除中…
                </>
              ) : (
                '删除'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function AppFrame({
  title,
  actions,
  fullBleed = false,
  children,
}: {
  title?: ReactNode
  actions?: ReactNode
  fullBleed?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(collapsedMemory)
  const [animateWidth, setAnimateWidth] = useState(false)

  function toggleCollapsed() {
    const next = !collapsed
    collapsedMemory = next
    setAnimateWidth(true)
    setCollapsed(next)
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
    } catch {
      // private mode / quota
    }
  }

  return (
    <AppFrameContext.Provider
      value={{
        collapsed,
        toggleCollapsed,
        openMobileNav: () => setOpen(true),
      }}
    >
      <div className="flex h-svh overflow-hidden bg-[#F6F7FB] text-[#14152B]">
        <aside
          className={cn(
            'hidden h-svh shrink-0 overflow-hidden border-r border-[#E7E9F3] bg-white lg:block',
            animateWidth && 'transition-[width] duration-200 ease-out',
            collapsed ? 'w-[72px]' : 'w-60',
          )}
        >
          <SidebarNav collapsed={collapsed} />
        </aside>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-60 p-0">
            <SheetTitle className="sr-only">我的简历</SheetTitle>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        {fullBleed ? (
          <div className="flex min-w-0 flex-1 overflow-hidden">{children}</div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F6F7FB]">
            <header className=" flex h-14 shrink-0 items-center gap-2 border-b border-[#E7E9F3] bg-white px-4 sm:px-6">
              <AppFrameNavButtons />
              <div className="min-w-0 flex-1 text-[15px] font-bold tracking-tight text-[#14152B]">
                {title}
              </div>
              {actions ? (
                <div className="flex shrink-0 items-center gap-2">{actions}</div>
              ) : null}
            </header>
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
              {children}
            </div>
          </div>
        )}
      </div>
    </AppFrameContext.Provider>
  )
}
