'use client'

import { FileText, LogOut, Menu, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: '我的简历', icon: FileText },
  { href: '/account', label: '个人中心', icon: UserRound },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()

  async function signOut() {
    await authClient.signOut()
    router.replace('/login')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-[#E7E9F3] px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-[#5A6ACF] to-[#8B5CF6] text-sm font-bold text-white">
          简
        </div>
        <span className="text-[15px] font-bold tracking-tight text-[#14152B]">智能简历</span>
      </div>
      <div className="px-3 pt-5">
        <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.08em] text-[#8C8FA8] uppercase">
          工作台
        </p>
        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm',
                  active
                    ? 'bg-[#EEF0FF] font-semibold text-[#5A6ACF]'
                    : 'text-[#565A78] hover:bg-[#F6F7FB]',
                )}
              >
                <Icon className="size-[18px]" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto border-t border-[#E7E9F3] p-3">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-[#EEF0FF] text-sm font-semibold text-[#5A6ACF]">
            {(session?.user.email ?? '用').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[#14152B]">
              {session?.user.name ?? '用户'}
            </p>
            <p className="truncate text-[11px] text-[#8C8FA8]">{session?.user.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="size-9" onClick={signOut} aria-label="退出登录">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AppFrame({
  title,
  actions,
  children,
}: {
  title: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#F6F7FB] text-[#14152B]">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 self-start overflow-hidden border-r border-[#E7E9F3] bg-white lg:block">
        <SidebarNav />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">导航</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#E7E9F3] bg-white px-4 sm:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="size-10 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="打开导航"
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 flex-1 text-[20px] font-extrabold tracking-tight">{title}</div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
        <div className="flex-1 px-4 py-6 sm:px-8">{children}</div>
      </div>
    </div>
  )
}
