'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AuthCard, AuthLink, AuthShell } from '@/components/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

const schema = z.object({
  password: z.string().min(8, '密码至少 8 位'),
})

type Values = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [formError, setFormError] = useState('')
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: '' },
  })

  async function onSubmit(values: Values) {
    if (!token) {
      setFormError('重置链接无效')
      return
    }
    setFormError('')
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    })
    if (error) {
      setFormError(error.message ?? '重置失败')
      return
    }
    router.replace('/login')
  }

  return (
    <AuthShell>
      <AuthCard
        title="设置新密码"
        subtitle="输入新密码后即可重新登录"
        footer={
          <>
            <AuthLink href="/login">返回登录</AuthLink>
          </>
        }
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="password">新密码</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              className="h-11"
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-[#B42318]">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          {formError ? <p className="text-sm text-[#B42318]">{formError}</p> : null}
          <Button type="submit" className="h-11 w-full bg-[#5A6ACF] hover:bg-[#4f5dbb]" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? '保存中…' : '保存新密码'}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
