'use client'

import { clientOnly } from '@/components/client-only'

const SettingsPage = clientOnly(() => import('@/components/settings-page'))

export default function Page() {
  return <SettingsPage />
}
