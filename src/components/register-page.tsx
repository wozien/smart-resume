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

export default function RegisterPage() {
  const router = useRouter()
  const [formError, setFormError] = useState('')
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: Values) {
    setFormError('')
    const name = values.email.split('@')[0] || '用户'
    const { error } = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name,
      callbackURL: '/',
    })
    if (error) {
      setFormError(error.message ?? '注册失败')
      return
    }
    router.replace('/')
  }

  return (
    <AuthShell>
      <AuthCard
        title="注册"
        subtitle="邮箱加密码即可开始"
        footer={
          <>
            已有账号？<AuthLink href="/login">登录</AuthLink>
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
            <Label htmlFor="password">密码</Label>
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
            {form.formState.isSubmitting ? '创建中…' : '创建账号'}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
