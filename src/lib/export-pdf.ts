import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb } from 'pdf-lib'
import { NAMED_SECTIONS, type TemplateId } from '@/lib/constants'
import { isListBlock, listItems, splitBlocks, stripMd } from '@/lib/md-text'
import { parseResumeBody } from '@/lib/resume-sections'

const FONT_URL =
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@5.2.8/chinese-simplified-400-normal.ttf'

let fontBytesPromise: Promise<ArrayBuffer> | null = null

async function loadFontBytes() {
  if (!fontBytesPromise) {
    fontBytesPromise = fetch(FONT_URL).then(async (res) => {
      if (!res.ok) throw new Error('无法加载中文字体')
      return res.arrayBuffer()
    })
  }
  return fontBytesPromise
}

type PdfFont = Awaited<ReturnType<PDFDocument['embedFont']>>

function wrapText(font: PdfFont, text: string, size: number, maxWidth: number) {
  const words = stripMd(text).split('')
  const lines: string[] = []
  let current = ''
  for (const ch of words) {
    if (ch === '\n') {
      lines.push(current)
      current = ''
      continue
    }
    const next = current + ch
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current)
      current = ch
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

export async function buildPdf(body: string, templateId: TemplateId) {
  const parsed = parseResumeBody(body)
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(await loadFontBytes())
  const pageSize: [number, number] = [595.28, 841.89]
  const margin = 48
  const ink = rgb(0.08, 0.08, 0.17)
  const muted = rgb(0.34, 0.35, 0.47)
  const accent = rgb(0.35, 0.42, 0.81)

  let page = pdf.addPage(pageSize)
  let y = page.getHeight() - margin
  const dual = templateId === 'double'
  const mainWidth = dual ? 320 : page.getWidth() - margin * 2
  const sidebarX = margin + mainWidth + 24
  const sidebarWidth = page.getWidth() - margin - sidebarX

  const newPage = () => {
    page = pdf.addPage(pageSize)
    y = page.getHeight() - margin
  }

  const ensure = (needed: number) => {
    if (y - needed < margin) newPage()
  }

  const drawLines = (
    lines: string[],
    size: number,
    color = ink,
    width = mainWidth,
    x = margin,
    lineGap = 4,
  ) => {
    const lineHeight = size + lineGap
    for (const line of lines) {
      ensure(lineHeight)
      page.drawText(line || ' ', {
        x,
        y: y - size,
        size,
        font,
        color,
        maxWidth: width,
      })
      y -= lineHeight
    }
  }

  const drawSection = (title: string, content: string | undefined, x = margin, width = mainWidth) => {
    if (!content?.trim()) return
    ensure(28)
    page.drawText(title, { x, y: y - 14, size: 13, font, color: accent })
    y -= 20
    page.drawRectangle({ x, y: y + 8, width, height: 1, color: rgb(0.91, 0.91, 0.95) })
    y -= 6
    for (const block of splitBlocks(content)) {
      const items = isListBlock(block) ? listItems(block).map((item) => `• ${item}`) : [block]
      for (const item of items) {
        drawLines(wrapText(font, item, 10.5, width), 10.5, ink, width, x, 3)
        y -= 6
      }
    }
    y -= 8
  }

  if (parsed.preamble) {
    const lines = parsed.preamble.split('\n').map((line) => line.trim()).filter(Boolean)
    lines.forEach((line, index) => {
      const size = index === 0 ? 20 : 10
      const color = index === 0 ? ink : muted
      const centered = wrapText(font, line, size, page.getWidth() - margin * 2)
      for (const text of centered) {
        const w = font.widthOfTextAtSize(text, size)
        ensure(size + 6)
        page.drawText(text, {
          x: (page.getWidth() - w) / 2,
          y: y - size,
          size,
          font,
          color,
        })
        y -= size + 6
      }
    })
    y -= 12
  }

  const mainOrder = ['个人总结', '工作经历', '教育经历', '项目经历'] as const
  const startY = y

  if (dual) {
    drawSection('技能', parsed.named['技能'], sidebarX, sidebarWidth)
    const sidebarBottom = y
    y = startY
    for (const name of mainOrder) {
      drawSection(name, parsed.named[name])
    }
    for (const extra of parsed.unrecognized) {
      drawSection(extra.title, extra.body)
    }
    y = Math.min(y, sidebarBottom)
  } else {
    for (const name of NAMED_SECTIONS) {
      drawSection(name, parsed.named[name])
    }
    for (const extra of parsed.unrecognized) {
      drawSection(extra.title, extra.body)
    }
  }

  return pdf.save()
}
