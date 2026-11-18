'use client'

import { clientOnly } from '@/components/client-only'

const ForgotPasswordPage = clientOnly(() => import('@/components/forgot-password-page'))

export default function Page() {
  return <ForgotPasswordPage />
}
