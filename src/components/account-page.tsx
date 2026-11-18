'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { AppFrame } from '@/components/app-frame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import type { ModelConfigPublic } from '@/lib/types'

const passwordSchema = z.object({
  currentPassword: z.string().min(8, '当前密码至少 8 位'),
  newPassword: z.string().min(8, '新密码至少 8 位'),
})

const modelSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  modelName: z.string().min(1, '模型名必填'),
})

type PasswordValues = z.infer<typeof passwordSchema>
type ModelValues = z.infer<typeof modelSchema>

export default function AccountPage() {
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const config = useQuery({
    queryKey: ['model-config'],
    queryFn: () => api<ModelConfigPublic>('/api/me/model-config'),
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  })

  const modelForm = useForm<ModelValues>({
    resolver: zodResolver(modelSchema),
    values: {
      apiKey: '',
      baseUrl: config.data?.baseUrl ?? '',
      modelName: config.data?.modelName ?? '',
    },
  })

  const saveModel = useMutation({
    mutationFn: (values: ModelValues) =>
      api('/api/me/model-config', {
        method: 'PUT',
        body: JSON.stringify({
          apiKey: values.apiKey?.trim() || undefined,
          baseUrl: values.baseUrl?.trim() || undefined,
          modelName: values.modelName.trim(),
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['model-config'] })
      modelForm.setValue('apiKey', '')
      toast.success('模型配置已保存')
    },
    onError: (err) => toast.error(err.message),
  })

  async function onChangePassword(values: PasswordValues) {
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })
    if (error) {
      toast.error(error.message ?? '修改失败')
      return
    }
    passwordForm.reset()
    toast.success('密码已更新')
  }

  return (
    <AppFrame title="个人中心">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <section className="rounded-2xl border border-[#E7E9F3] bg-white p-6">
          <h2 className="text-[15px] font-bold">账号</h2>
          <p className="mt-1 text-[13px] text-[#8C8FA8]">邮箱只读，v1 不支持改邮箱或注销。</p>
          <div className="mt-4 space-y-1.5">
            <Label>邮箱</Label>
            <Input className="h-11" value={session?.user.email ?? ''} readOnly />
          </div>
        </section>

        <section className="rounded-2xl border border-[#E7E9F3] bg-white p-6">
          <h2 className="text-[15px] font-bold">改密码</h2>
          <form className="mt-4 space-y-4" onSubmit={passwordForm.handleSubmit(onChangePassword)}>
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">当前密码</Label>
              <Input
                id="currentPassword"
                type="password"
                className="h-11"
                autoComplete="current-password"
                {...passwordForm.register('currentPassword')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                className="h-11"
                autoComplete="new-password"
                {...passwordForm.register('newPassword')}
              />
            </div>
            <Button type="submit" className="h-10 bg-[#5A6ACF] hover:bg-[#4f5dbb]" disabled={passwordForm.formState.isSubmitting}>
              更新密码
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-[#E7E9F3] bg-white p-6">
          <h2 className="text-[15px] font-bold">模型配置</h2>
          <p className="mt-1 text-[13px] text-[#8C8FA8]">
            {config.data?.configured ? '已配置。密钥不可回看，留空则保持原密钥。' : '未配置。导入和导出仍可用，对话需要先保存密钥。'}
          </p>
          <form className="mt-4 space-y-4" onSubmit={modelForm.handleSubmit((values) => saveModel.mutate(values))}>
            <div className="space-y-1.5">
              <Label htmlFor="apiKey">密钥</Label>
              <Input
                id="apiKey"
                type="password"
                className="h-11"
                placeholder={config.data?.configured ? '已配置' : 'sk-...'}
                autoComplete="off"
                {...modelForm.register('apiKey')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="baseUrl">接口地址（可选）</Label>
              <Input
                id="baseUrl"
                className="h-11"
                placeholder="https://api.openai.com/v1"
                {...modelForm.register('baseUrl')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modelName">模型名</Label>
              <Input id="modelName" className="h-11" placeholder="gpt-4.1" {...modelForm.register('modelName')} />
              {modelForm.formState.errors.modelName ? (
                <p className="text-sm text-[#B42318]">{modelForm.formState.errors.modelName.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="h-10 bg-[#5A6ACF] hover:bg-[#4f5dbb]" disabled={saveModel.isPending}>
              保存模型配置
            </Button>
          </form>
        </section>
      </div>
    </AppFrame>
  )
}
