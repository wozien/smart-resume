import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { NAMED_SECTIONS, type TemplateId } from '@/lib/constants'
import { isListBlock, listItems, splitBlocks, stripMd } from '@/lib/md-text'
import { parseResumeBody } from '@/lib/resume-sections'

function runs(text: string, extra?: { bold?: boolean; size?: number }) {
  const size = extra?.size ?? 22
  const parts = stripMd(text).split('\n')
  return parts.flatMap((part, index) => {
    const run = new TextRun({ text: part, bold: extra?.bold, size, font: 'Microsoft YaHei' })
    if (index === 0) return [run]
    return [new TextRun({ break: 1 }), run]
  })
}

function paragraphFromBlock(block: string) {
  if (isListBlock(block)) {
    return listItems(block).map(
      (item) =>
        new Paragraph({
          children: runs(`• ${item}`),
          spacing: { after: 80 },
        }),
    )
  }
  return [
    new Paragraph({
      children: runs(block),
      spacing: { after: 160 },
    }),
  ]
}

function heading(title: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text: title, bold: true, size: 28, font: 'Microsoft YaHei' })],
    spacing: { before: 240, after: 120 },
  })
}

function sectionBlocks(title: string, content: string | undefined) {
  if (!content?.trim()) return []
  return [heading(title), ...splitBlocks(content).flatMap(paragraphFromBlock)]
}

export async function buildDocx(body: string, _templateId: TemplateId) {
  const parsed = parseResumeBody(body)
  const children: Paragraph[] = []

  if (parsed.preamble) {
    const lines = parsed.preamble.split('\n').map((line) => line.trim()).filter(Boolean)
    lines.forEach((line, index) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: runs(line, { bold: index === 0, size: index === 0 ? 36 : 20 }),
          spacing: { after: index === 0 ? 80 : 40 },
        }),
      )
    })
  }

  for (const name of NAMED_SECTIONS) {
    children.push(...sectionBlocks(name, parsed.named[name]))
  }
  for (const extra of parsed.unrecognized) {
    children.push(...sectionBlocks(extra.title, extra.body))
  }

  const doc = new Document({
    sections: [{ children }],
  })
  return Packer.toBuffer(doc)
}
