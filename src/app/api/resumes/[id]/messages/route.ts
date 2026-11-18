import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from 'ai'
import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/db'
import { modelConfigs, resumeMessages, resumes } from '@/db/schema'
import { decryptSecret } from '@/lib/crypto-secret'
import { requireUser } from '@/lib/require-user'
import { buildSystemPrompt } from '@/lib/resume-prompts'

export const maxDuration = 60

type Ctx = { params: Promise<{ id: string }> }

function textFromMessage(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('')
    .trim()
}

export async function POST(request: Request, ctx: Ctx) {
  const { user, error } = await requireUser()
  if (error) return error
  const { id } = await ctx.params

  let payload: { messages?: UIMessage[] }
  try {
    payload = (await request.json()) as { messages?: UIMessage[] }
  } catch {
    return NextResponse.json({ error: '请求格式无效' }, { status: 400 })
  }

  const messages = payload.messages ?? []
  if (messages.length === 0) {
    return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
  }

  const db = getDb()
  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .limit(1)
  if (!resume) return NextResponse.json({ error: '简历不存在' }, { status: 404 })

  const [config] = await db
    .select()
    .from(modelConfigs)
    .where(eq(modelConfigs.userId, user.id))
    .limit(1)
  if (!config) {
    return NextResponse.json({ error: '请先在个人中心配置模型' }, { status: 400 })
  }

  const last = messages.at(-1)
  if (last?.role === 'user') {
    const content = textFromMessage(last)
    if (content) {
      await db.insert(resumeMessages).values({
        id: crypto.randomUUID(),
        resumeId: id,
        role: 'user',
        content,
        createdAt: new Date(),
      })
    }
  }

  let apiKey: string
  try {
    apiKey = decryptSecret(config.apiKeyEncrypted)
  } catch {
    return NextResponse.json({ error: '模型密钥无法解密，请重新保存配置' }, { status: 400 })
  }

  const openai = createOpenAI({
    apiKey,
    baseURL: config.baseUrl || undefined,
  })

  try {
    const result = streamText({
      model: openai(config.modelName),
      system: buildSystemPrompt(resume.body),
      messages: await convertToModelMessages(messages),
      tools: {
        writeResumeBody: tool({
          description:
            '提交完整的简历 Markdown 正文。创建完成或润色完成时必须调用。参数是整篇替换，不是补丁。',
          inputSchema: z.object({
            markdown: z.string().describe('完整 Markdown 简历正文'),
          }),
          execute: async ({ markdown }) => {
            const [latest] = await db
              .select()
              .from(resumes)
              .where(eq(resumes.id, id))
              .limit(1)
            if (!latest) return { ok: false as const, error: '简历不存在' }
            await db
              .update(resumes)
              .set({
                previousBody: latest.body.trim() ? latest.body : latest.previousBody,
                body: markdown,
                updatedAt: new Date(),
              })
              .where(eq(resumes.id, id))
            return { ok: true as const }
          },
        }),
      },
      stopWhen: stepCountIs(4),
      onFinish: async ({ text }) => {
        const content = text.trim() || '已根据对话更新正文。'
        await db.insert(resumeMessages).values({
          id: crypto.randomUUID(),
          resumeId: id,
          role: 'assistant',
          content,
          createdAt: new Date(),
        })
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (err) {
    const message = err instanceof Error ? err.message : '模型调用失败'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
