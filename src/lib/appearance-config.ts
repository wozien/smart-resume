'use client'

import { useSyncExternalStore } from 'react'

export type ResumeAccentTheme = 'indigo' | 'slate' | 'emerald' | 'rose' | 'amber'
export type PreviewFontFamily = 'sans' | 'serif' | 'mono'
export type PreviewSectionGap = 'compact' | 'normal' | 'relaxed'
export type PreviewLetterSpacing = 'normal' | 'wide' | 'wider'
export type EditorColorTheme = 'auto' | 'light' | 'dark'

export type AppearanceConfig = {
  // 简历预览与排版外观
  accentTheme: ResumeAccentTheme
  previewFontFamily: PreviewFontFamily
  previewFontSize: number // 12 | 13 | 14 | 15
  previewLineHeight: number // 1.45 | 1.65 | 1.85
  previewLetterSpacing: PreviewLetterSpacing
  previewSectionGap: PreviewSectionGap
  // Markdown 源码编辑器外观
  editorTheme: EditorColorTheme
  editorFontSize: number // 12 | 13 | 14 | 15 | 16
  editorLineHeight: number // 1.5 | 1.7 | 1.9
  editorLetterSpacing: number // 0 | 0.3 | 0.6
  editorLineNumbers: boolean
  editorWordWrap: boolean
}

export const DEFAULT_APPEARANCE_CONFIG: AppearanceConfig = {
  accentTheme: 'indigo',
  previewFontFamily: 'sans',
  previewFontSize: 13,
  previewLineHeight: 1.65,
  previewLetterSpacing: 'normal',
  previewSectionGap: 'normal',
  editorTheme: 'auto',
  editorFontSize: 13,
  editorLineHeight: 1.7,
  editorLetterSpacing: 0,
  editorLineNumbers: true,
  editorWordWrap: true,
}

export const RESUME_ACCENT_PALETTES: Record<
  ResumeAccentTheme,
  { label: string; primary: string; softBg: string; border: string }
> = {
  indigo: {
    label: '经典靛蓝',
    primary: '#5A6ACF',
    softBg: '#EEF0FF',
    border: '#D8DCFF',
  },
  slate: {
    label: '商务深灰',
    primary: '#334155',
    softBg: '#F1F5F9',
    border: '#CBD5E1',
  },
  emerald: {
    label: '松石翠绿',
    primary: '#0D9488',
    softBg: '#CCFBF1',
    border: '#99F6E4',
  },
  rose: {
    label: '典雅绯红',
    primary: '#E11D48',
    softBg: '#FFE4E6',
    border: '#FECDD3',
  },
  amber: {
    label: '暖金琥珀',
    primary: '#D97706',
    softBg: '#FEF3C7',
    border: '#FDE68A',
  },
}

export const PREVIEW_FONT_FAMILIES: Record<
  PreviewFontFamily,
  { label: string; css: string }
> = {
  sans: {
    label: '现代无衬线',
    css: 'Inter, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  serif: {
    label: '经典衬线体',
    css: '"Noto Serif SC", "Songti SC", "SimSun", Georgia, serif',
  },
  mono: {
    label: '等宽技术体',
    css: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
}

export const PREVIEW_LETTER_SPACINGS: Record<
  PreviewLetterSpacing,
  { label: string; css: string }
> = {
  normal: { label: '标准', css: '0em' },
  wide: { label: '舒展', css: '0.025em' },
  wider: { label: '宽松', css: '0.05em' },
}

export const PREVIEW_SECTION_GAPS: Record<
  PreviewSectionGap,
  { label: string; px: number }
> = {
  compact: { label: '紧凑', px: 12 },
  normal: { label: '标准', px: 18 },
  relaxed: { label: '宽松', px: 24 },
}

const STORAGE_KEY = 'smart-resume-appearance-v1'
const listeners = new Set<() => void>()

function loadFromStorage(): AppearanceConfig {
  if (typeof window === 'undefined') return DEFAULT_APPEARANCE_CONFIG
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_APPEARANCE_CONFIG
    const parsed = JSON.parse(raw) as Partial<AppearanceConfig>
    return {
      accentTheme:
        parsed.accentTheme && parsed.accentTheme in RESUME_ACCENT_PALETTES
          ? parsed.accentTheme
          : DEFAULT_APPEARANCE_CONFIG.accentTheme,
      previewFontFamily:
        parsed.previewFontFamily &&
        parsed.previewFontFamily in PREVIEW_FONT_FAMILIES
          ? parsed.previewFontFamily
          : DEFAULT_APPEARANCE_CONFIG.previewFontFamily,
      previewFontSize:
        typeof parsed.previewFontSize === 'number' &&
        parsed.previewFontSize >= 11 &&
        parsed.previewFontSize <= 18
          ? parsed.previewFontSize
          : DEFAULT_APPEARANCE_CONFIG.previewFontSize,
      previewLineHeight:
        typeof parsed.previewLineHeight === 'number' &&
        parsed.previewLineHeight >= 1.2 &&
        parsed.previewLineHeight <= 2.2
          ? parsed.previewLineHeight
          : DEFAULT_APPEARANCE_CONFIG.previewLineHeight,
      previewLetterSpacing:
        parsed.previewLetterSpacing &&
        parsed.previewLetterSpacing in PREVIEW_LETTER_SPACINGS
          ? parsed.previewLetterSpacing
          : DEFAULT_APPEARANCE_CONFIG.previewLetterSpacing,
      previewSectionGap:
        parsed.previewSectionGap &&
        parsed.previewSectionGap in PREVIEW_SECTION_GAPS
          ? parsed.previewSectionGap
          : DEFAULT_APPEARANCE_CONFIG.previewSectionGap,
      editorTheme:
        parsed.editorTheme === 'auto' ||
        parsed.editorTheme === 'light' ||
        parsed.editorTheme === 'dark'
          ? parsed.editorTheme
          : DEFAULT_APPEARANCE_CONFIG.editorTheme,
      editorFontSize:
        typeof parsed.editorFontSize === 'number' &&
        parsed.editorFontSize >= 11 &&
        parsed.editorFontSize <= 20
          ? parsed.editorFontSize
          : DEFAULT_APPEARANCE_CONFIG.editorFontSize,
      editorLineHeight:
        typeof parsed.editorLineHeight === 'number' &&
        parsed.editorLineHeight >= 1.3 &&
        parsed.editorLineHeight <= 2.2
          ? parsed.editorLineHeight
          : DEFAULT_APPEARANCE_CONFIG.editorLineHeight,
      editorLetterSpacing:
        typeof parsed.editorLetterSpacing === 'number' &&
        parsed.editorLetterSpacing >= 0 &&
        parsed.editorLetterSpacing <= 2
          ? parsed.editorLetterSpacing
          : DEFAULT_APPEARANCE_CONFIG.editorLetterSpacing,
      editorLineNumbers:
        typeof parsed.editorLineNumbers === 'boolean'
          ? parsed.editorLineNumbers
          : DEFAULT_APPEARANCE_CONFIG.editorLineNumbers,
      editorWordWrap:
        typeof parsed.editorWordWrap === 'boolean'
          ? parsed.editorWordWrap
          : DEFAULT_APPEARANCE_CONFIG.editorWordWrap,
    }
  } catch {
    return DEFAULT_APPEARANCE_CONFIG
  }
}

let currentConfig: AppearanceConfig = loadFromStorage()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): AppearanceConfig {
  return currentConfig
}

function getServerSnapshot(): AppearanceConfig {
  return DEFAULT_APPEARANCE_CONFIG
}

export function updateAppearanceConfig(patch: Partial<AppearanceConfig>) {
  currentConfig = { ...currentConfig, ...patch }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig))
    } catch {
      // ignore quota / private mode
    }
  }
  for (const listener of listeners) {
    listener()
  }
}

export function resetAppearanceConfig() {
  currentConfig = DEFAULT_APPEARANCE_CONFIG
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }
  for (const listener of listeners) {
    listener()
  }
}

export function useAppearanceConfig(): AppearanceConfig {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
