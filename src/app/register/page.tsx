'use client'

import { clientOnly } from '@/components/client-only'

const RegisterPage = clientOnly(() => import('@/components/register-page'))

export default function Page() {
  return <RegisterPage />
}
