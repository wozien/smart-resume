"use client";

import {
  FileText,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "我的简历", icon: FileText },
  { href: "/account", label: "个人中心", icon: UserRound },
];

const SIDEBAR_COLLAPSED_KEY = "app-sidebar-collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Survives AppFrame remounts when switching client-only pages. */
let collapsedMemory = readCollapsed();

function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 items-center border-b border-[#E7E9F3]",
          collapsed ? "justify-center px-2" : "gap-2.5 px-4",
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#5A6ACF] to-[#8B5CF6] text-sm font-bold text-white">
          简
        </div>
        {collapsed ? (
          <span className="sr-only">智能简历</span>
        ) : (
          <span className="truncate text-[15px] font-bold tracking-tight text-[#14152B]">
            智能简历
          </span>
        )}
      </div>
      <div className={cn("pt-5", collapsed ? "px-2" : "px-3")}>
        {collapsed ? null : (
          <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.08em] text-[#8C8FA8] uppercase">
            工作台
          </p>
        )}
        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            const className = cn(
              "flex items-center rounded-lg py-2.5 text-sm",
              collapsed ? "justify-center px-2" : "gap-2 px-3.5",
              active
                ? "bg-[#EEF0FF] font-semibold text-[#5A6ACF]"
                : "text-[#565A78] hover:bg-[#F6F7FB]",
            );
            const inner = (
              <>
                <Icon className="size-[18px] shrink-0" />
                {collapsed ? (
                  <span className="sr-only">{item.label}</span>
                ) : (
                  item.label
                )}
              </>
            );
            if (!collapsed) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={className}
                >
                  {inner}
                </Link>
              );
            }
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={className}
                    />
                  }
                >
                  {inner}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>
      <div
        className={cn(
          "mt-auto border-t border-[#E7E9F3]",
          collapsed ? "p-2" : "p-3",
        )}
      >
        <div
          className={cn(
            'flex items-center rounded-lg',
            collapsed ? 'justify-center py-1' : 'gap-2 px-2 py-2',
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-sm font-semibold text-[#5A6ACF]">
            {(session?.user.email ?? '用').slice(0, 1).toUpperCase()}
          </div>
          {collapsed ? null : (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[#14152B]">
                  {session?.user.name ?? '用户'}
                </p>
                <p className="truncate text-[11px] text-[#8C8FA8]">{session?.user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={signOut}
                aria-label="退出登录"
                title="退出登录"
              >
                <LogOut className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppFrame({
  title,
  actions,
  children,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(collapsedMemory);
  const [animateWidth, setAnimateWidth] = useState(false);

  function toggleCollapsed() {
    const next = !collapsed;
    collapsedMemory = next;
    setAnimateWidth(true);
    setCollapsed(next);
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // private mode / quota
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F6F7FB] text-[#14152B]">
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 self-start overflow-hidden border-r border-[#E7E9F3] bg-white lg:block",
          animateWidth && "transition-[width] duration-200 ease-out",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <SidebarNav collapsed={collapsed} />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">导航</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col bg-[#F6F7FB]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-1 bg-[#F6F7FB] px-4 sm:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 hover:bg-[#E7E9F3] hover:text-[#14152B] lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="打开导航"
          >
            <Menu className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-8 shrink-0 hover:bg-[#E7E9F3] hover:text-[#14152B] lg:inline-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "展开菜单" : "折叠菜单"}
            title={collapsed ? "展开菜单" : "折叠菜单"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </Button>
          <div className="min-w-0 flex-1 text-[16px] font-bold tracking-tight text-[#14152B]">
            {title}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </header>
        <div className="flex-1 px-4 pb-4 sm:px-8 sm:pb-6">{children}</div>
      </div>
    </div>
  );
}
