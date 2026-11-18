'use client'

import { clientOnly } from '@/components/client-only'

const ResetPasswordPage = clientOnly(() => import('@/components/reset-password-page'))

export default function Page() {
  return <ResetPasswordPage />
}
