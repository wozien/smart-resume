import type { TemplateId } from '@/lib/constants'

export type ResumeListItem = {
  id: string
  title: string
  updatedAt: string
  hasBody: boolean
  preview: string
}

export type ResumeMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export type ResumeDetail = {
  id: string
  title: string
  body: string
  previousBody: string | null
  lastTemplateId: TemplateId
  createdAt: string
  updatedAt: string
  messages: ResumeMessage[]
}

export type ModelConfigPublic = {
  configured: boolean
  baseUrl: string
  modelName: string
}
