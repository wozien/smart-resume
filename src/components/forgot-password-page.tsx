'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AuthCard, AuthLink, AuthShell } from '@/components/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

const schema = z.object({
  email: z.string().email('请输入有效邮箱'),
})

type Values = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [formError, setFormError] = useState('')
  const [done, setDone] = useState(false)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: Values) {
    setFormError('')
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: '/reset-password',
    })
    if (error) {
      setFormError(error.message ?? '发送失败')
      return
    }
    setDone(true)
  }

  return (
    <AuthShell>
      <AuthCard
        title="找回密码"
        subtitle="我们会寄一封重置邮件。本地开发时链接会打在服务端日志里。"
        footer={
          <>
            想起密码了？<AuthLink href="/login">返回登录</AuthLink>
          </>
        }
      >
        {done ? (
          <p className="text-sm text-[#027A48]">如果该邮箱已注册，重置说明已经发出。</p>
        ) : (
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" autoComplete="email" className="h-11" {...form.register('email')} />
              {form.formState.errors.email ? (
                <p className="text-sm text-[#B42318]">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            {formError ? <p className="text-sm text-[#B42318]">{formError}</p> : null}
            <Button type="submit" className="h-11 w-full bg-[#5A6ACF] hover:bg-[#4f5dbb]" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? '发送中…' : '发送重置邮件'}
            </Button>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  )
}
