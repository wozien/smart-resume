import { z } from 'zod'
import type {
  ResumeOverview,
  ResumeOverviewEducationItem,
  ResumeOverviewProjectItem,
  ResumeOverviewWorkItem,
} from '@/lib/types'

export const EMPTY_OVERVIEW: ResumeOverview = {
  basics: { name: '', phone: '', email: '', city: '' },
  work: [],
  projects: [],
  education: [],
  skills: [],
  summary: '',
}

const trimmed = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim())

const itemId = z
  .string()
  .max(80)
  .transform((value) => value.trim())
  .pipe(z.string().min(1))

const basicsSchema = z.object({
  name: trimmed(80),
  phone: trimmed(40),
  email: trimmed(120),
  city: trimmed(80),
})

const workItemSchema = z.object({
  id: itemId,
  company: trimmed(120),
  title: trimmed(120),
  startDate: trimmed(20),
  endDate: trimmed(20),
  description: trimmed(5000),
})

const projectItemSchema = z.object({
  id: itemId,
  name: trimmed(120),
  role: trimmed(120),
  startDate: trimmed(20),
  endDate: trimmed(20),
  description: trimmed(5000),
})

const educationItemSchema = z.object({
  id: itemId,
  school: trimmed(120),
  degree: trimmed(80),
  major: trimmed(120),
  startDate: trimmed(20),
  endDate: trimmed(20),
})

export const overviewSchema = z.object({
  basics: basicsSchema,
  work: z.array(workItemSchema).max(50),
  projects: z.array(projectItemSchema).max(50),
  education: z.array(educationItemSchema).max(30),
  skills: z
    .array(trimmed(40))
    .max(50)
    .transform((skills) => {
      const seen = new Set<string>()
      const next: string[] = []
      for (const skill of skills) {
        if (!skill || seen.has(skill)) continue
        seen.add(skill)
        next.push(skill)
      }
      return next
    }),
  summary: trimmed(4000),
})

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function withId(value: unknown): string {
  const id = text(asRecord(value).id).trim()
  return id || crypto.randomUUID()
}

function coerceWork(value: unknown): ResumeOverviewWorkItem {
  const row = asRecord(value)
  return {
    id: withId(value),
    company: text(row.company),
    title: text(row.title),
    startDate: text(row.startDate),
    endDate: text(row.endDate),
    description: text(row.description),
  }
}

function coerceProject(value: unknown): ResumeOverviewProjectItem {
  const row = asRecord(value)
  return {
    id: withId(value),
    name: text(row.name),
    role: text(row.role),
    startDate: text(row.startDate),
    endDate: text(row.endDate),
    description: text(row.description),
  }
}

function coerceEducation(value: unknown): ResumeOverviewEducationItem {
  const row = asRecord(value)
  return {
    id: withId(value),
    school: text(row.school),
    degree: text(row.degree),
    major: text(row.major),
    startDate: text(row.startDate),
    endDate: text(row.endDate),
  }
}

export function normalizeOverview(input: unknown): ResumeOverview {
  const row = asRecord(input)
  const basics = asRecord(row.basics)
  return {
    basics: {
      name: text(basics.name),
      phone: text(basics.phone),
      email: text(basics.email),
      city: text(basics.city),
    },
    work: asList(row.work).slice(0, 50).map(coerceWork),
    projects: asList(row.projects).slice(0, 50).map(coerceProject),
    education: asList(row.education).slice(0, 30).map(coerceEducation),
    skills: asList(row.skills).slice(0, 50).map((skill) => text(skill)),
    summary: text(row.summary),
  }
}

export function parseOverview(input: unknown) {
  return overviewSchema.safeParse(normalizeOverview(input))
}

export function newWorkItem(): ResumeOverviewWorkItem {
  return {
    id: crypto.randomUUID(),
    company: '',
    title: '',
    startDate: '',
    endDate: '',
    description: '',
  }
}

export function newProjectItem(): ResumeOverviewProjectItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    role: '',
    startDate: '',
    endDate: '',
    description: '',
  }
}

export function newEducationItem(): ResumeOverviewEducationItem {
  return {
    id: crypto.randomUUID(),
    school: '',
    degree: '',
    major: '',
    startDate: '',
    endDate: '',
  }
}
