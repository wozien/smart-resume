import { toNextJsHandler } from 'better-auth/next-js'
import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'

function handlers() {
  return toNextJsHandler(getAuth())
}

function missingDb() {
  return NextResponse.json({ error: '数据库未配置' }, { status: 503 })
}

export const GET = (request: Request) => {
  if (!process.env.DATABASE_URL) return missingDb()
  return handlers().GET(request)
}

export const POST = (request: Request) => {
  if (!process.env.DATABASE_URL) return missingDb()
  return handlers().POST(request)
}
