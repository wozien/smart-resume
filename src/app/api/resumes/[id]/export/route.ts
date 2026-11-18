import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { resumes } from '@/db/schema'
import { DEFAULT_TEMPLATE_ID, TEMPLATE_IDS, type TemplateId } from '@/lib/constants'
import { buildDocx } from '@/lib/export-docx'
import { buildPdf } from '@/lib/export-pdf'
import { requireUser } from '@/lib/require-user'

type Ctx = { params: Promise<{ id: string }> }

function asTemplateId(value: string | null | undefined): TemplateId {
  return TEMPLATE_IDS.includes(value as TemplateId) ? (value as TemplateId) : DEFAULT_TEMPLATE_ID
}

export async function POST(request: Request, ctx: Ctx) {
  const { user, error } = await requireUser()
  if (error) return error
  const { id } = await ctx.params

  let payload: { format?: string; templateId?: string }
  try {
    payload = (await request.json()) as { format?: string; templateId?: string }
  } catch {
    return NextResponse.json({ error: '请求格式无效' }, { status: 400 })
  }

  const format = payload.format === 'docx' ? 'docx' : payload.format === 'pdf' ? 'pdf' : null
  if (!format) return NextResponse.json({ error: '不支持的导出格式' }, { status: 400 })

  const db = getDb()
  const [row] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .limit(1)
  if (!row) return NextResponse.json({ error: '简历不存在' }, { status: 404 })
  if (!row.body.trim()) {
    return NextResponse.json({ error: '正文为空，无法导出' }, { status: 400 })
  }

  const templateId = asTemplateId(payload.templateId ?? row.lastTemplateId)

  try {
    await db
      .update(resumes)
      .set({ lastTemplateId: templateId, updatedAt: new Date() })
      .where(eq(resumes.id, id))

    if (format === 'docx') {
      const buffer = await buildDocx(row.body, templateId)
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="resume.docx"`,
        },
      })
    }

    const pdf = await buildPdf(row.body, templateId)
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume.pdf"`,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '导出失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
