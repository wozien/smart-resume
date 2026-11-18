'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-[#5A6ACF] to-[#8B5CF6] text-base font-bold text-white">
            简
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#14152B]">智能简历</span>
        </div>
        {children}
      </div>
    </div>
  )
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[#E7E9F3] bg-white p-7 shadow-[0_1px_3px_rgba(20,21,43,.05)]">
      <h1 className="text-[22px] font-extrabold tracking-tight text-[#14152B]">{title}</h1>
      <p className="mt-1 text-sm text-[#565A78]">{subtitle}</p>
      <div className="mt-6">{children}</div>
      <p className="mt-5 text-center text-sm text-[#8C8FA8]">{footer}</p>
    </div>
  )
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-[#5A6ACF] hover:underline">
      {children}
    </Link>
  )
}
