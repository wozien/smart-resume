import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { resumeOverviews } from '@/db/schema'
import { requireUser } from '@/lib/require-user'
import { EMPTY_OVERVIEW, parseOverview } from '@/lib/resume-overview'
import type { ResumeOverview } from '@/lib/types'

function toOverview(row: {
  basics: ResumeOverview['basics']
  work: ResumeOverview['work']
  projects: ResumeOverview['projects']
  education: ResumeOverview['education']
  skills: ResumeOverview['skills']
  summary: string
}): ResumeOverview {
  const parsed = parseOverview(row)
  return parsed.success ? parsed.data : EMPTY_OVERVIEW
}

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const db = getDb()
  const [row] = await db
    .select()
    .from(resumeOverviews)
    .where(eq(resumeOverviews.userId, user.id))
    .limit(1)

  if (!row) return NextResponse.json(EMPTY_OVERVIEW)
  return NextResponse.json(toOverview(row))
}

export async function PUT(request: Request) {
  const { user, error } = await requireUser()
  if (error) return error

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: '请求格式无效' }, { status: 400 })
  }

  const parsed = parseOverview(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: '概况内容无效' }, { status: 400 })
  }

  const overview = parsed.data
  const now = new Date()
  const db = getDb()
  const [existing] = await db
    .select({ userId: resumeOverviews.userId })
    .from(resumeOverviews)
    .where(eq(resumeOverviews.userId, user.id))
    .limit(1)

  if (existing) {
    await db
      .update(resumeOverviews)
      .set({
        basics: overview.basics,
        work: overview.work,
        projects: overview.projects,
        education: overview.education,
        skills: overview.skills,
        summary: overview.summary,
        updatedAt: now,
      })
      .where(eq(resumeOverviews.userId, user.id))
  } else {
    await db.insert(resumeOverviews).values({
      userId: user.id,
      basics: overview.basics,
      work: overview.work,
      projects: overview.projects,
      education: overview.education,
      skills: overview.skills,
      summary: overview.summary,
      updatedAt: now,
    })
  }

  return NextResponse.json(overview)
}
