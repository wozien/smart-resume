import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { resumes } from '@/db/schema'
import { requireUser } from '@/lib/require-user'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_request: Request, ctx: Ctx) {
  const { user, error } = await requireUser()
  if (error) return error
  const { id } = await ctx.params
  const db = getDb()
  const [row] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .limit(1)
  if (!row) return NextResponse.json({ error: '简历不存在' }, { status: 404 })
  if (row.previousBody == null) {
    return NextResponse.json({ error: '没有可恢复的修订' }, { status: 400 })
  }

  await db
    .update(resumes)
    .set({
      body: row.previousBody,
      previousBody: row.body,
      updatedAt: new Date(),
    })
    .where(eq(resumes.id, id))

  return NextResponse.json({ body: row.previousBody, previousBody: row.body })
}
