'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
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
  password: z.string().min(8, '密码至少 8 位'),
})

type Values = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [formError, setFormError] = useState('')
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: Values) {
    setFormError('')
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: '/',
    })
    if (error) {
      setFormError(error.message ?? '登录失败')
      return
    }
    router.replace('/')
  }

  return (
    <AuthShell>
      <AuthCard
        title="登录"
        subtitle="进入你的简历工作台"
        footer={
          <>
            还没有账号？<AuthLink href="/register">注册</AuthLink>
          </>
        }
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" type="email" autoComplete="email" className="h-11" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="text-sm text-[#B42318]">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">密码</Label>
              <AuthLink href="/forgot-password">忘记密码</AuthLink>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="h-11"
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-[#B42318]">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          {formError ? <p className="text-sm text-[#B42318]">{formError}</p> : null}
          <Button type="submit" className="h-11 w-full bg-[#5A6ACF] hover:bg-[#4f5dbb]" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? '登录中…' : '登录'}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
