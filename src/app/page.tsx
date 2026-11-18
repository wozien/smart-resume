'use client'

import { clientOnly } from '@/components/client-only'

const AppShell = clientOnly(() => import('@/components/app-shell'))

export default function Page() {
  return <AppShell />
}
