'use client'

import type { ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { NAMED_SECTIONS, type TemplateId } from '@/lib/constants'
import { parseResumeBody } from '@/lib/resume-sections'

function Md({ children }: { children: string }) {
  return (
    <div className="preview-md text-[13px] leading-relaxed text-[#14152B]">
      <Markdown remarkPlugins={[remarkGfm]}>{children}</Markdown>
    </div>
  )
}

function Section({ title, children }: { title: string; children?: string }) {
  if (!children?.trim()) return null
  return (
    <section className="mb-4">
      <h2 className="mb-1.5 border-b border-[#E7E9F3] pb-1 text-[13px] font-bold tracking-wide text-[#5A6ACF]">
        {title}
      </h2>
      <Md>{children}</Md>
    </section>
  )
}

function HeaderBlock({ preamble }: { preamble: string }) {
  if (!preamble.trim()) return null
  return (
    <header className="mb-5 text-center">
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
      <div className="grid grid-cols-[1fr_160px] gap-6">
        <div>
          <HeaderBlock preamble={parsed.preamble} />
          <Section title="个人总结">{parsed.named['个人总结']}</Section>
          <Section title="工作经历">{parsed.named['工作经历']}</Section>
          <Section title="教育经历">{parsed.named['教育经历']}</Section>
          <Section title="项目经历">{parsed.named['项目经历']}</Section>
          {extras}
        </div>
        <aside className="border-l border-[#E7E9F3] pl-4">
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
}: {
  body: string
  templateId: TemplateId
}) {
  let inner: ReactNode
  if (!body.trim()) {
    inner = <p className="text-sm text-[#8C8FA8]">正文为空时无法预览。先导入、编辑或让 AI 生成。</p>
  } else {
    inner = <PreviewBody body={body} templateId={templateId} />
  }

  return (
    <div className="h-full overflow-auto rounded-2xl border border-[#E7E9F3] bg-white p-6 shadow-[0_1px_3px_rgba(20,21,43,.05)]">
      <p className="mb-4 text-[11px] font-bold tracking-[0.08em] text-[#8C8FA8] uppercase">
        {templateId === 'double' ? '双栏预览' : '单栏预览'}
      </p>
      {inner}
      <style>{`
        .preview-md h1, .preview-md h2, .preview-md h3 { font-weight: 700; margin: 0.2em 0; }
        .preview-md p { margin: 0.35em 0; }
        .preview-md ul, .preview-md ol { margin: 0.35em 0 0.35em 1.1em; }
        .preview-md a { color: #5A6ACF; }
      `}</style>
    </div>
  )
}
