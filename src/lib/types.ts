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

export type ResumeOverviewBasics = {
  name: string
  phone: string
  email: string
  city: string
}

export type ResumeOverviewWorkItem = {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string
  description: string
}

export type ResumeOverviewProjectItem = {
  id: string
  name: string
  role: string
  startDate: string
  endDate: string
  description: string
}

export type ResumeOverviewEducationItem = {
  id: string
  school: string
  degree: string
  major: string
  startDate: string
  endDate: string
}

export type ResumeOverview = {
  basics: ResumeOverviewBasics
  work: ResumeOverviewWorkItem[]
  projects: ResumeOverviewProjectItem[]
  education: ResumeOverviewEducationItem[]
  skills: string[]
  summary: string
}
