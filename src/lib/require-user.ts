import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'

export async function getSessionUser() {
  if (!process.env.DATABASE_URL) return null
  const session = await getAuth().api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function requireUser() {
  if (!process.env.DATABASE_URL) {
    return {
      user: null,
      error: NextResponse.json({ error: '数据库未配置' }, { status: 503 }),
    }
  }
  const user = await getSessionUser()
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: '请先登录' }, { status: 401 }),
    }
  }
  return { user, error: null }
}
