'use client'

import { clientOnly } from '@/components/client-only'

const WorkspacePage = clientOnly(() => import('@/components/workspace-page'))

export default function Page() {
  return <WorkspacePage />
}
