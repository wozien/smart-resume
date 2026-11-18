import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { modelConfigs } from '@/db/schema'
import { encryptSecret } from '@/lib/crypto-secret'
import { requireUser } from '@/lib/require-user'
import type { ModelConfigPublic } from '@/lib/types'

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  const db = getDb()
  const [row] = await db
    .select()
    .from(modelConfigs)
    .where(eq(modelConfigs.userId, user.id))
    .limit(1)

  const payload: ModelConfigPublic = {
    configured: Boolean(row),
    baseUrl: row?.baseUrl ?? '',
    modelName: row?.modelName ?? '',
  }
  return NextResponse.json(payload)
}

export async function PUT(request: Request) {
  const { user, error } = await requireUser()
  if (error) return error

  let payload: { apiKey?: string; baseUrl?: string; modelName?: string }
  try {
    payload = (await request.json()) as { apiKey?: string; baseUrl?: string; modelName?: string }
  } catch {
    return NextResponse.json({ error: '请求格式无效' }, { status: 400 })
  }

  const modelName = payload.modelName?.trim()
  if (!modelName) {
    return NextResponse.json({ error: '模型名必填' }, { status: 400 })
  }
  const baseUrl = payload.baseUrl?.trim() || null
  const incomingKey = payload.apiKey?.trim()

  const db = getDb()
  const [existing] = await db
    .select()
    .from(modelConfigs)
    .where(eq(modelConfigs.userId, user.id))
    .limit(1)

  if (!incomingKey && !existing) {
    return NextResponse.json({ error: 'API Key 必填' }, { status: 400 })
  }

  const apiKeyEncrypted = incomingKey
    ? encryptSecret(incomingKey)
    : existing!.apiKeyEncrypted

  const now = new Date()
  if (existing) {
    await db
      .update(modelConfigs)
      .set({ apiKeyEncrypted, baseUrl, modelName, updatedAt: now })
      .where(eq(modelConfigs.userId, user.id))
  } else {
    await db.insert(modelConfigs).values({
      userId: user.id,
      apiKeyEncrypted,
      baseUrl,
      modelName,
      updatedAt: now,
    })
  }

  return NextResponse.json({ ok: true, configured: true, baseUrl: baseUrl ?? '', modelName })
}
