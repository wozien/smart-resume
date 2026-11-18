'use client'

import { Code2, FileText, Sparkles } from 'lucide-react'
import { type CSSProperties, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  PREVIEW_FONT_FAMILIES,
  PREVIEW_LETTER_SPACINGS,
  PREVIEW_SECTION_GAPS,
  RESUME_ACCENT_PALETTES,
  useAppearanceConfig,
} from '@/lib/appearance-config'
import { NAMED_SECTIONS, type TemplateId } from '@/lib/constants'
import { parseResumeBody } from '@/lib/resume-sections'
import { cn } from '@/lib/utils'

function Md({ children }: { children: string }) {
  return (
    <div className="preview-md text-[#14152B]">
      <Markdown remarkPlugins={[remarkGfm]}>{children}</Markdown>
    </div>
  )
}

function Section({ title, children }: { title: string; children?: string }) {
  if (!children?.trim()) return null
  return (
    <section className="preview-section">
      <h2 className="preview-section-heading mb-1.5 border-b border-[#E7E9F3] pb-1 font-bold tracking-wide">
        {title}
      </h2>
      <Md>{children}</Md>
    </section>
  )
}

function HeaderBlock({ preamble }: { preamble: string }) {
  if (!preamble.trim()) return null
  return (
    <header className="mb-5 border-b border-[#F1F2F8] pb-4 text-center">
      <Md>{preamble}</Md>
    </header>
  )
}

function PreviewBody({
  body,
  templateId,
}: {
  body: string
  templateId: TemplateId
}) {
  const parsed = parseResumeBody(body)
  const extras = parsed.unrecognized.map((item) => (
    <Section key={item.title} title={item.title}>
      {item.body}
    </Section>
  ))

  if (templateId === 'double') {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_170px]">
        <div>
          <HeaderBlock preamble={parsed.preamble} />
          <Section title="个人总结">{parsed.named['个人总结']}</Section>
          <Section title="工作经历">{parsed.named['工作经历']}</Section>
          <Section title="教育经历">{parsed.named['教育经历']}</Section>
          <Section title="项目经历">{parsed.named['项目经历']}</Section>
          {extras}
        </div>
        <aside className="border-t border-[#E7E9F3] pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
          <Section title="技能">{parsed.named['技能']}</Section>
        </aside>
      </div>
    )
  }

  return (
    <div>
      <HeaderBlock preamble={parsed.preamble} />
      {NAMED_SECTIONS.map((name) => (
        <Section key={name} title={name}>
          {parsed.named[name]}
        </Section>
      ))}
      {extras}
    </div>
  )
}

export function ResumePreview({
  body,
  templateId,
  aiSyncing = false,
  onSwitchToSource,
}: {
  body: string
  templateId: TemplateId
  aiSyncing?: boolean
  onSwitchToSource?: () => void
}) {
  const appearance = useAppearanceConfig()
  const accent = RESUME_ACCENT_PALETTES[appearance.accentTheme]
  const fontFamily = PREVIEW_FONT_FAMILIES[appearance.previewFontFamily].css
  const letterSpacing =
    PREVIEW_LETTER_SPACINGS[appearance.previewLetterSpacing].css
  const sectionGapPx = PREVIEW_SECTION_GAPS[appearance.previewSectionGap].px

  let inner: ReactNode
  if (!body.trim()) {
    inner = (
      <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-[#F6F7FB] text-[#8C8FA8]">
          <FileText className="size-5" />
        </div>
        <p className="text-[14px] font-semibold text-[#14152B]">
          简历正文暂为空
        </p>
        <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-[#8C8FA8]">
          在左侧与简历 Agent 对话生成完整内容，或切换到「源码」模式直接编写 Markdown。
        </p>
        {onSwitchToSource ? (
          <button
            type="button"
            onClick={onSwitchToSource}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#E7E9F3] bg-[#F6F7FB] px-3.5 py-2 text-[12px] font-semibold text-[#565A78] transition-colors hover:bg-[#EEF0FF] hover:text-[#5A6ACF]"
          >
            <Code2 className="size-3.5" />
            切换到 Markdown 源码编写
          </button>
        ) : null}
      </div>
    )
  } else {
    inner = <PreviewBody body={body} templateId={templateId} />
  }

  return (
    <div
      style={
        {
          '--resume-accent': accent.primary,
          '--resume-font': fontFamily,
          '--resume-font-size': `${appearance.previewFontSize}px`,
          '--resume-line-height': String(appearance.previewLineHeight),
          '--resume-letter-spacing': letterSpacing,
          '--resume-section-gap': `${sectionGapPx}px`,
        } as CSSProperties
      }
      className={cn(
        'mx-auto min-h-[640px] w-full max-w-[740px] rounded-2xl border bg-white p-6 shadow-[0_2px_8px_rgba(20,21,43,.05),0_12px_28px_rgba(20,21,43,.04)] transition-all sm:p-8',
        aiSyncing
          ? 'border-[#5A6ACF]/50 ring-2 ring-[#5A6ACF]/15'
          : 'border-[#E7E9F3]',
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: accent.primary }}
          />
          <p className="text-[11px] font-bold tracking-[0.08em] text-[#8C8FA8] uppercase">
            {templateId === 'double' ? '双栏排版预览' : '单栏排版预览'}
          </p>
        </div>
        {aiSyncing ? (
          <span className="inline-flex animate-pulse items-center gap-1 text-[11px] font-semibold text-[#5A6ACF]">
            <Sparkles className="size-3" />
            正在接收 AI 新正文…
          </span>
        ) : null}
      </div>
      {inner}
      <style>{`
        .preview-section {
          margin-bottom: var(--resume-section-gap, 18px);
        }
        .preview-section-heading {
          color: var(--resume-accent, #5A6ACF);
          font-size: var(--resume-font-size, 13px);
          font-family: var(--resume-font);
          letter-spacing: var(--resume-letter-spacing, 0em);
        }
        .preview-md {
          font-family: var(--resume-font);
          font-size: var(--resume-font-size, 13px);
          line-height: var(--resume-line-height, 1.65);
          letter-spacing: var(--resume-letter-spacing, 0em);
        }
        .preview-md h1, .preview-md h2, .preview-md h3 { font-weight: 700; margin: 0.2em 0; }
        .preview-md p { margin: 0.35em 0; }
        .preview-md ul, .preview-md ol { margin: 0.35em 0 0.35em 1.2em; }
        .preview-md ul { list-style-type: disc; }
        .preview-md ol { list-style-type: decimal; }
        .preview-md a { color: var(--resume-accent, #5A6ACF); }
      `}</style>
    </div>
  )
}
