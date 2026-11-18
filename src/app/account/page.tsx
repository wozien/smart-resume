'use client'

import { clientOnly } from '@/components/client-only'

const AccountPage = clientOnly(() => import('@/components/account-page'))

export default function Page() {
  return <AccountPage />
}
