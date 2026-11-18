import { and, asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { resumeMessages, resumes } from '@/db/schema'
import { DEFAULT_TEMPLATE_ID, TEMPLATE_IDS, type TemplateId } from '@/lib/constants'
import { requireUser } from '@/lib/require-user'
import type { ResumeDetail } from '@/lib/types'

type Ctx = { params: Promise<{ id: string }> }

async function loadOwnedResume(userId: string, id: string) {
  const db = getDb()
  const [row] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .limit(1)
  return row ?? null
}

function asTemplateId(value: string | null | undefined): TemplateId {
  return TEMPLATE_IDS.includes(value as TemplateId) ? (value as TemplateId) : DEFAULT_TEMPLATE_ID
}

export async function GET(_request: Request, ctx: Ctx) {
  const { user, error } = await requireUser()
  if (error) return error
  const { id } = await ctx.params
  const row = await loadOwnedResume(user.id, id)
  if (!row) return NextResponse.json({ error: '简历不存在' }, { status: 404 })

  const db = getDb()
  const messages = await db
    .select()
    .from(resumeMessages)
    .where(eq(resumeMessages.resumeId, id))
    .orderBy(asc(resumeMessages.createdAt))

  const detail: ResumeDetail = {
    id: row.id,
    title: row.title,
    body: row.body,
    previousBody: row.previousBody,
    lastTemplateId: asTemplateId(row.lastTemplateId),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    messages: messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        id: message.id,
        role: message.role as 'user' | 'assistant',
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
  }
  return NextResponse.json(detail)
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { user, error } = await requireUser()
  if (error) return error
  const { id } = await ctx.params
  const row = await loadOwnedResume(user.id, id)
  if (!row) return NextResponse.json({ error: '简历不存在' }, { status: 404 })

  let payload: { title?: string; body?: string; lastTemplateId?: string }
  try {
    payload = (await request.json()) as { title?: string; body?: string; lastTemplateId?: string }
  } catch {
    return NextResponse.json({ error: '请求格式无效' }, { status: 400 })
  }

  const patch: Partial<typeof resumes.$inferInsert> = { updatedAt: new Date() }
  if (typeof payload.title === 'string' && payload.title.trim()) patch.title = payload.title.trim()
  if (typeof payload.body === 'string') patch.body = payload.body
  if (typeof payload.lastTemplateId === 'string') patch.lastTemplateId = asTemplateId(payload.lastTemplateId)

  const db = getDb()
  await db.update(resumes).set(patch).where(eq(resumes.id, id))
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { user, error } = await requireUser()
  if (error) return error
  const { id } = await ctx.params
  const row = await loadOwnedResume(user.id, id)
  if (!row) return NextResponse.json({ error: '简历不存在' }, { status: 404 })

  const db = getDb()
  await db.delete(resumes).where(eq(resumes.id, id))
  return NextResponse.json({ ok: true })
}
