'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Code2,
  KeyRound,
  Loader2,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Sun,
  Type,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { AppFrame } from '@/components/app-frame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import {
  PREVIEW_FONT_FAMILIES,
  PREVIEW_LETTER_SPACINGS,
  PREVIEW_SECTION_GAPS,
  RESUME_ACCENT_PALETTES,
  resetAppearanceConfig,
  updateAppearanceConfig,
  useAppearanceConfig,
  type EditorColorTheme,
  type PreviewFontFamily,
  type PreviewLetterSpacing,
  type PreviewSectionGap,
  type ResumeAccentTheme,
} from '@/lib/appearance-config'
import type { ModelConfigPublic } from '@/lib/types'
import { cn } from '@/lib/utils'

const modelSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  modelName: z.string().min(1, '模型名必填'),
})

type ModelValues = z.infer<typeof modelSchema>
type SettingsTab = 'appearance' | 'model'

function parseTab(raw: string | null): SettingsTab {
  if (raw === 'model') return 'model'
  return 'appearance'
}

const tabTriggerClass =
  'h-auto w-full justify-start gap-2 rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#565A78] shadow-none after:hidden hover:bg-[#F6F7FB] hover:text-[#565A78] data-active:bg-[#EEF0FF] data-active:font-semibold data-active:text-[#5A6ACF] data-active:shadow-none'

function OptionPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-xl border px-3.5 text-[13px] font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#5A6ACF]/40',
        active
          ? 'border-[#5A6ACF] bg-[#EEF0FF] font-semibold text-[#5A6ACF] shadow-2xs'
          : 'border-[#E7E9F3] bg-white text-[#565A78] hover:bg-[#F6F7FB] hover:text-[#14152B]',
      )}
    >
      {children}
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = parseTab(searchParams.get('tab'))
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const appearance = useAppearanceConfig()

  const config = useQuery({
    queryKey: ['model-config'],
    queryFn: () => api<ModelConfigPublic>('/api/me/model-config'),
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

  function handleTabChange(next: string) {
    const tab = parseTab(next)
    router.replace(tab === 'appearance' ? '/settings' : `/settings?tab=${tab}`)
  }

  const currentTheme = theme ?? 'light'
  const accentPalette = RESUME_ACCENT_PALETTES[appearance.accentTheme]

  return (
    <AppFrame title="设置">
      <div className="mx-auto max-w-5xl">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          orientation="vertical"
          className="flex w-full flex-col items-start gap-4 sm:flex-row sm:gap-6"
        >
          <div className="sticky top-0 w-full shrink-0 self-start rounded-2xl border border-[#E7E9F3] bg-white p-3 sm:w-52">
            <TabsList
              variant="line"
              className="flex h-auto w-full flex-col items-stretch justify-start gap-0.5 rounded-none border-0 bg-transparent p-0"
            >
              <TabsTrigger value="appearance" className={tabTriggerClass}>
                <Palette className="size-[18px] shrink-0" />
                外观配置
              </TabsTrigger>
              <TabsTrigger value="model" className={tabTriggerClass}>
                <KeyRound className="size-[18px] shrink-0" />
                模型配置
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-w-0 w-full flex-1 self-start">
            {/* 外观配置 Tab */}
            <TabsContent
              value="appearance"
              keepMounted
              className="min-w-0 space-y-6"
            >
              {/* 1. 界面暗黑模式配置 */}
              <section className="rounded-2xl border border-[#E7E9F3] bg-white p-6">
                <div className="flex items-center gap-2">
                  <Sun className="size-4 text-[#5A6ACF]" />
                  <h2 className="text-[15px] font-bold text-[#14152B]">
                    界面外观（暗黑模式）
                  </h2>
                </div>
                <p className="mt-1 text-[13px] text-[#8C8FA8]">
                  切换工作台整体配色模式，支持浅色、暗黑或自动跟随操作系统。
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      {
                        id: 'light',
                        label: '浅色模式',
                        desc: '清新明亮的纸张工作台',
                        icon: Sun,
                        previewBg: 'bg-[#F6F7FB]',
                        previewCard: 'bg-white border-[#E7E9F3]',
                      },
                      {
                        id: 'dark',
                        label: '暗黑模式',
                        desc: '沉浸护眼的深色暗夜风格',
                        icon: Moon,
                        previewBg: 'bg-[#0F111A]',
                        previewCard: 'bg-[#161926] border-[#23283B]',
                      },
                      {
                        id: 'system',
                        label: '跟随系统',
                        desc: '自动同步系统日夜外观',
                        icon: Monitor,
                        previewBg:
                          'bg-linear-to-r from-[#F6F7FB] via-[#F6F7FB] to-[#0F111A]',
                        previewCard: 'bg-white/90 border-[#E7E9F3]',
                      },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon
                    const selected = currentTheme === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTheme(item.id)}
                        className={cn(
                          'group flex flex-col rounded-2xl border p-3.5 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#5A6ACF]/40',
                          selected
                            ? 'border-[#5A6ACF] bg-[#EEF0FF]/40 ring-1 ring-[#5A6ACF]'
                            : 'border-[#E7E9F3] bg-white hover:border-[#5A6ACF]/40',
                        )}
                      >
                        <div
                          className={cn(
                            'mb-3 flex h-16 w-full items-center justify-center rounded-xl border border-[#E7E9F3]/80 p-2.5',
                            item.previewBg,
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-full w-full flex-col justify-center gap-1.5 rounded-lg border px-2.5',
                              item.previewCard,
                            )}
                          >
                            <div className="h-2 w-12 rounded-full bg-[#5A6ACF]" />
                            <div className="h-1.5 w-20 rounded-full bg-[#8C8FA8]/40" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#14152B]">
                            <Icon className="size-4 text-[#5A6ACF]" />
                            {item.label}
                          </span>
                          {selected ? (
                            <span className="flex size-5 items-center justify-center rounded-full bg-[#5A6ACF] text-white">
                              <Check className="size-3" />
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[12px] text-[#8C8FA8]">
                          {item.desc}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* 2. 简历排版与预览外观设置 */}
              <section className="rounded-2xl border border-[#E7E9F3] bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Type className="size-4 text-[#5A6ACF]" />
                      <h2 className="text-[15px] font-bold text-[#14152B]">
                        简历排版与预览外观
                      </h2>
                    </div>
                    <p className="mt-1 text-[13px] text-[#8C8FA8]">
                      自定义右侧简历预览画布的主题色、字体、字号与间距，改动即时生效。
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  {/* 简历主题配色 */}
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold">
                      简历主题色
                    </Label>
                    <div className="flex flex-wrap gap-2.5">
                      {(
                        Object.keys(
                          RESUME_ACCENT_PALETTES,
                        ) as ResumeAccentTheme[]
                      ).map((key) => {
                        const item = RESUME_ACCENT_PALETTES[key]
                        const active = appearance.accentTheme === key
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              updateAppearanceConfig({ accentTheme: key })
                            }
                            className={cn(
                              'inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[13px] font-medium transition-all',
                              active
                                ? 'border-[#5A6ACF] bg-[#EEF0FF] font-semibold text-[#14152B]'
                                : 'border-[#E7E9F3] bg-white text-[#565A78] hover:bg-[#F6F7FB]',
                            )}
                          >
                            <span
                              className="size-3.5 rounded-full shadow-2xs"
                              style={{ backgroundColor: item.primary }}
                            />
                            <span>{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 字体样式 */}
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold">
                      预览字体风格
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        Object.keys(
                          PREVIEW_FONT_FAMILIES,
                        ) as PreviewFontFamily[]
                      ).map((key) => (
                        <OptionPill
                          key={key}
                          active={appearance.previewFontFamily === key}
                          onClick={() =>
                            updateAppearanceConfig({ previewFontFamily: key })
                          }
                        >
                          {PREVIEW_FONT_FAMILIES[key].label}
                        </OptionPill>
                      ))}
                    </div>
                  </div>

                  {/* 字号大小与行高 */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">
                        正文字号（{appearance.previewFontSize}px）
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { size: 12, label: '12px 紧凑' },
                          { size: 13, label: '13px 标准' },
                          { size: 14, label: '14px 舒适' },
                          { size: 15, label: '15px 大号' },
                        ].map((item) => (
                          <OptionPill
                            key={item.size}
                            active={appearance.previewFontSize === item.size}
                            onClick={() =>
                              updateAppearanceConfig({
                                previewFontSize: item.size,
                              })
                            }
                          >
                            {item.label}
                          </OptionPill>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">
                        行高间距（{appearance.previewLineHeight}）
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 1.45, label: '1.45 紧凑' },
                          { value: 1.65, label: '1.65 标准' },
                          { value: 1.85, label: '1.85 舒展' },
                        ].map((item) => (
                          <OptionPill
                            key={item.value}
                            active={appearance.previewLineHeight === item.value}
                            onClick={() =>
                              updateAppearanceConfig({
                                previewLineHeight: item.value,
                              })
                            }
                          >
                            {item.label}
                          </OptionPill>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 字间距与章节间距 */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">
                        字间距
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {(
                          Object.keys(
                            PREVIEW_LETTER_SPACINGS,
                          ) as PreviewLetterSpacing[]
                        ).map((key) => (
                          <OptionPill
                            key={key}
                            active={appearance.previewLetterSpacing === key}
                            onClick={() =>
                              updateAppearanceConfig({
                                previewLetterSpacing: key,
                              })
                            }
                          >
                            {PREVIEW_LETTER_SPACINGS[key].label}
                          </OptionPill>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">
                        章节间距
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {(
                          Object.keys(
                            PREVIEW_SECTION_GAPS,
                          ) as PreviewSectionGap[]
                        ).map((key) => (
                          <OptionPill
                            key={key}
                            active={appearance.previewSectionGap === key}
                            onClick={() =>
                              updateAppearanceConfig({ previewSectionGap: key })
                            }
                          >
                            {PREVIEW_SECTION_GAPS[key].label}（
                            {PREVIEW_SECTION_GAPS[key].px}px）
                          </OptionPill>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 实时排版效果预览小样 */}
                  <div className="rounded-xl border border-[#E7E9F3] bg-[#FAFBFF] p-4">
                    <p className="mb-2.5 text-[11px] font-bold tracking-wider text-[#8C8FA8] uppercase">
                      实时排版效果预览
                    </p>
                    <div
                      className="rounded-xl border border-[#E7E9F3] bg-white p-4 text-[#14152B]"
                      style={{
                        fontFamily:
                          PREVIEW_FONT_FAMILIES[appearance.previewFontFamily]
                            .css,
                        fontSize: `${appearance.previewFontSize}px`,
                        lineHeight: appearance.previewLineHeight,
                        letterSpacing:
                          PREVIEW_LETTER_SPACINGS[
                            appearance.previewLetterSpacing
                          ].css,
                      }}
                    >
                      <div
                        className="mb-1.5 border-b border-[#E7E9F3] pb-1 font-bold"
                        style={{ color: accentPalette.primary }}
                      >
                        工作经历
                      </div>
                      <p className="font-semibold">
                        某科技公司 · 高级前端工程师（2023.06 - 至今）
                      </p>
                      <p className="mt-1 text-[#565A78]">
                        主导智能简历 Agent 工作台三列布局重构，优化流式渲染与实时预览体验，首屏加载耗时降低 42%。
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Markdown 源码编辑器外观设置 */}
              <section className="rounded-2xl border border-[#E7E9F3] bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Code2 className="size-4 text-[#5A6ACF]" />
                      <h2 className="text-[15px] font-bold text-[#14152B]">
                        Markdown 源码编辑器外观
                      </h2>
                    </div>
                    <p className="mt-1 text-[13px] text-[#8C8FA8]">
                      调整右侧 CodeMirror 源码编辑器的配色主题、字号、行高与辅助视图。
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetAppearanceConfig()
                      toast.success('已恢复默认外观配置')
                    }}
                    className="h-8 gap-1.5 rounded-lg text-[12px]"
                  >
                    <RotateCcw className="size-3.5" />
                    恢复默认外观
                  </Button>
                </div>

                <div className="mt-5 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">
                        编辑器配色主题
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            { id: 'auto', label: '跟随界面' },
                            { id: 'light', label: '浅色纸张' },
                            { id: 'dark', label: '暗夜深色' },
                          ] as { id: EditorColorTheme; label: string }[]
                        ).map((item) => (
                          <OptionPill
                            key={item.id}
                            active={appearance.editorTheme === item.id}
                            onClick={() =>
                              updateAppearanceConfig({ editorTheme: item.id })
                            }
                          >
                            {item.label}
                          </OptionPill>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">
                        编辑器字号（{appearance.editorFontSize}px）
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[12, 13, 14, 15, 16].map((size) => (
                          <OptionPill
                            key={size}
                            active={appearance.editorFontSize === size}
                            onClick={() =>
                              updateAppearanceConfig({ editorFontSize: size })
                            }
                          >
                            {size}px
                          </OptionPill>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">
                        编辑器行高（{appearance.editorLineHeight}）
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 1.5, label: '1.5 紧凑' },
                          { value: 1.7, label: '1.7 标准' },
                          { value: 1.9, label: '1.9 宽松' },
                        ].map((item) => (
                          <OptionPill
                            key={item.value}
                            active={appearance.editorLineHeight === item.value}
                            onClick={() =>
                              updateAppearanceConfig({
                                editorLineHeight: item.value,
                              })
                            }
                          >
                            {item.label}
                          </OptionPill>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">
                        编辑器字间距
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 0, label: '标准 (0px)' },
                          { value: 0.3, label: '舒展 (0.3px)' },
                          { value: 0.6, label: '宽松 (0.6px)' },
                        ].map((item) => (
                          <OptionPill
                            key={item.value}
                            active={
                              appearance.editorLetterSpacing === item.value
                            }
                            onClick={() =>
                              updateAppearanceConfig({
                                editorLetterSpacing: item.value,
                              })
                            }
                          >
                            {item.label}
                          </OptionPill>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <OptionPill
                      active={appearance.editorLineNumbers}
                      onClick={() =>
                        updateAppearanceConfig({
                          editorLineNumbers: !appearance.editorLineNumbers,
                        })
                      }
                    >
                      {appearance.editorLineNumbers ? '✓ ' : ''}显示行号与章节折叠
                    </OptionPill>

                    <OptionPill
                      active={appearance.editorWordWrap}
                      onClick={() =>
                        updateAppearanceConfig({
                          editorWordWrap: !appearance.editorWordWrap,
                        })
                      }
                    >
                      {appearance.editorWordWrap ? '✓ ' : ''}开启自动软换行
                    </OptionPill>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* 模型配置 Tab */}
            <TabsContent value="model" keepMounted className="min-w-0">
              <section className="rounded-2xl border border-[#E7E9F3] bg-white p-6">
                <h2 className="text-[15px] font-bold">模型配置</h2>
                {config.isLoading ? (
                  <div className="mt-3 space-y-4">
                    <Skeleton className="h-4 w-64" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-lg" />
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-[13px] text-[#8C8FA8]">
                      {config.data?.configured
                        ? '已配置。密钥不可回看，留空则保持原密钥。'
                        : '未配置。导入和导出仍可用，对话需要先保存密钥。'}
                    </p>
                    <form
                      className="mt-4 space-y-4"
                      onSubmit={modelForm.handleSubmit((values) =>
                        saveModel.mutate(values),
                      )}
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="apiKey">密钥</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          className="h-11"
                          placeholder={
                            config.data?.configured ? '已配置' : 'sk-...'
                          }
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
                        <Input
                          id="modelName"
                          className="h-11"
                          placeholder="gpt-4.1"
                          {...modelForm.register('modelName')}
                        />
                        {modelForm.formState.errors.modelName ? (
                          <p className="text-sm text-[#B42318]">
                            {modelForm.formState.errors.modelName.message}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="submit"
                        className="h-10 bg-[#5A6ACF] hover:bg-[#4f5dbb]"
                        disabled={saveModel.isPending}
                      >
                        {saveModel.isPending ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            保存中…
                          </>
                        ) : (
                          '保存模型配置'
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </section>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppFrame>
  )
}
