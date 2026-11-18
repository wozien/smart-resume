import { NAMED_SECTIONS, type NamedSection } from '@/lib/constants'

export type UnrecognizedSection = { title: string; body: string }

export type ParsedResume = {
  preamble: string
  named: Partial<Record<NamedSection, string>>
  unrecognized: UnrecognizedSection[]
}

const namedSet = new Set<string>(NAMED_SECTIONS)

export function parseResumeBody(body: string): ParsedResume {
  const named: Partial<Record<NamedSection, string>> = {}
  const unrecognized: UnrecognizedSection[] = []
  const chunks = body.replace(/\r\n/g, '\n').split(/^## /m)

  const preamble = (chunks.shift() ?? '').trim()
  for (const chunk of chunks) {
    const newline = chunk.indexOf('\n')
    const title = (newline === -1 ? chunk : chunk.slice(0, newline)).trim()
    const content = (newline === -1 ? '' : chunk.slice(newline + 1)).trim()
    if (namedSet.has(title)) {
      named[title as NamedSection] = content
    } else {
      unrecognized.push({ title, body: content })
    }
  }

  return { preamble, named, unrecognized }
}

export function isNamedSection(title: string): title is NamedSection {
  return namedSet.has(title)
}
