'use client'

import { clientOnly } from '@/components/client-only'

const LoginPage = clientOnly(() => import('@/components/login-page'))

export default function Page() {
  return <LoginPage />
}
