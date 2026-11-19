'use client'

import { markdown } from '@codemirror/lang-markdown'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import {
  RESUME_ACCENT_PALETTES,
  useAppearanceConfig,
} from '@/lib/appearance-config'

function buildHighlightStyle(isDark: boolean, accentColor: string) {
  return HighlightStyle.define([
    {
      tag: [tags.heading1, tags.heading2, tags.heading3, tags.heading],
      color: isDark ? '#818CF8' : accentColor,
      fontWeight: '700',
    },
    {
      tag: tags.strong,
      color: isDark ? '#F8FAFC' : '#14152B',
      fontWeight: '700',
    },
    {
      tag: tags.emphasis,
      color: isDark ? '#CBD5E1' : '#565A78',
      fontStyle: 'italic',
    },
    {
      tag: [tags.link, tags.url],
      color: isDark ? '#A78BFA' : '#8B5CF6',
      textDecoration: 'underline',
    },
    {
      tag: tags.monospace,
      color: isDark ? '#34D399' : '#027A48',
    },
    {
      tag: [
        tags.list,
        tags.meta,
        tags.processingInstruction,
        tags.punctuation,
        tags.contentSeparator,
      ],
      color: isDark ? '#64748B' : '#8C8FA8',
    },
    {
      tag: tags.quote,
      color: isDark ? '#94A3B8' : '#565A78',
      fontStyle: 'italic',
    },
  ])
}

function buildEditorTheme({
  isDark,
  accentColor,
  fontSize,
  lineHeight,
  letterSpacing,
}: {
  isDark: boolean
  accentColor: string
  fontSize: number
  lineHeight: number
  letterSpacing: number
}) {
  return EditorView.theme(
    {
      '&': {
        height: '100%',
        backgroundColor: isDark ? '#111420' : '#FFFFFF',
        color: isDark ? '#E2E8F0' : '#14152B',
        fontSize: `${fontSize}px`,
      },
      '&.cm-focused': {
        outline: 'none',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily:
          'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        lineHeight: String(lineHeight),
        letterSpacing: `${letterSpacing}px`,
      },
      '.cm-content': {
        padding: '16px 20px 40px 10px',
        caretColor: isDark ? '#818CF8' : accentColor,
      },
      '.cm-line': {
        padding: '0 4px',
      },
      '.cm-gutters': {
        backgroundColor: isDark ? '#0D101A' : '#FAFBFF',
        color: isDark ? '#64748B' : '#8C8FA8',
        borderRight: isDark ? '1px solid #1E2436' : '1px solid #F1F2F8',
        fontSize: '11.5px',
        minWidth: '40px',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 8px 0 10px',
      },
      '.cm-activeLineGutter': {
        backgroundColor: isDark ? '#1E2436' : '#EEF0FF',
        color: isDark ? '#A5B4FC' : accentColor,
        fontWeight: '600',
      },
      '.cm-activeLine': {
        backgroundColor: isDark
          ? 'rgba(99, 102, 241, 0.12)'
          : 'rgba(238, 240, 255, 0.42)',
      },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection':
        {
          backgroundColor: isDark
            ? 'rgba(129, 140, 248, 0.25) !important'
            : 'rgba(90, 106, 207, 0.16) !important',
        },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: isDark ? '#818CF8' : accentColor,
        borderLeftWidth: '2px',
      },
      '.cm-placeholder': {
        color: isDark ? '#64748B' : '#8C8FA8',
        lineHeight: String(lineHeight),
        whiteSpace: 'pre-wrap',
      },
      '.cm-foldPlaceholder': {
        backgroundColor: isDark ? '#1E2436' : '#EEF0FF',
        border: isDark ? '1px solid #2E364F' : '1px solid #E7E9F3',
        color: isDark ? '#A5B4FC' : accentColor,
        borderRadius: '4px',
        padding: '0 6px',
        margin: '0 4px',
      },
    },
    { dark: isDark },
  )
}

const PLACEHOLDER_TEXT = `文首直接写姓名和联系方式（无需加 ## 标题），然后按二级标题组织章节：

张三
138-0000-0000 | zhangsan@example.com | 深圳

## 个人总结
...

## 工作经历
...

## 项目经历
...

## 教育经历
...

## 技能
...`

export function MarkdownSourceEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const appearance = useAppearanceConfig()
  const { resolvedTheme } = useTheme()

  const isDark =
    appearance.editorTheme === 'auto'
      ? resolvedTheme === 'dark'
      : appearance.editorTheme === 'dark'

  const accentColor = RESUME_ACCENT_PALETTES[appearance.accentTheme].primary

  const extensions = useMemo(() => {
    const list = [
      markdown(),
      buildEditorTheme({
        isDark,
        accentColor,
        fontSize: appearance.editorFontSize,
        lineHeight: appearance.editorLineHeight,
        letterSpacing: appearance.editorLetterSpacing,
      }),
      syntaxHighlighting(buildHighlightStyle(isDark, accentColor)),
    ]
    if (appearance.editorWordWrap) {
      list.push(EditorView.lineWrapping)
    }
    return list
  }, [
    isDark,
    accentColor,
    appearance.editorFontSize,
    appearance.editorLineHeight,
    appearance.editorLetterSpacing,
    appearance.editorWordWrap,
  ])

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      theme="none"
      placeholder={PLACEHOLDER_TEXT}
      extensions={extensions}
      basicSetup={{
        lineNumbers: appearance.editorLineNumbers,
        foldGutter: appearance.editorLineNumbers,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        history: true,
        bracketMatching: true,
        closeBrackets: true,
        searchKeymap: true,
        autocompletion: false,
      }}
      className="pane-scroll pane-scroll-surface h-full flex-1 overflow-hidden [&_.cm-editor]:h-full"
    />
  )
}
