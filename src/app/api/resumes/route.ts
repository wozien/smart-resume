import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { resumes } from '@/db/schema'
import { DEFAULT_TEMPLATE_ID, UNNAMED_TITLE } from '@/lib/constants'
import { requireUser } from '@/lib/require-user'
import type { ResumeListItem } from '@/lib/types'

function titleFromFilename(name: string) {
  return name.replace(/\.md$/i, '').trim() || UNNAMED_TITLE
}

function listPreview(body: string) {
  const trimmed = body.trim()
  if (!trimmed) return ''
  return trimmed.length > 1600 ? trimmed.slice(0, 1600) : trimmed
}

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const db = getDb()
  const rows = await db
    .select({
      id: resumes.id,
      title: resumes.title,
      body: resumes.body,
      updatedAt: resumes.updatedAt,
    })
    .from(resumes)
    .where(eq(resumes.userId, user.id))
    .orderBy(desc(resumes.updatedAt))

  const items: ResumeListItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
    hasBody: row.body.trim().length > 0,
    preview: listPreview(row.body),
  }))
  return NextResponse.json({ resumes: items })
}

export async function POST(request: Request) {
  const { user, error } = await requireUser()
  if (error) return error

  let payload: { title?: string; body?: string; filename?: string }
  try {
    payload = (await request.json()) as { title?: string; body?: string; filename?: string }
  } catch {
    return NextResponse.json({ error: '请求格式无效' }, { status: 400 })
  }

  const body = typeof payload.body === 'string' ? payload.body : ''
  const title =
    (typeof payload.title === 'string' && payload.title.trim()) ||
    (typeof payload.filename === 'string' ? titleFromFilename(payload.filename) : UNNAMED_TITLE)

  const now = new Date()
  const id = crypto.randomUUID()
  const db = getDb()
  await db.insert(resumes).values({
    id,
    userId: user.id,
    title,
    body,
    lastTemplateId: DEFAULT_TEMPLATE_ID,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ id, title })
}
