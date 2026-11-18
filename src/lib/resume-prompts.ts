import { NAMED_SECTIONS } from '@/lib/constants'

const headingList = NAMED_SECTIONS.map((name) => `## ${name}`).join('\n')

const sharedRules = `你在帮用户写中文简历。正文是一篇 Markdown。
第一个二级标题之前是文首，写姓名和联系方式，不要给文首加 ## 标题。
具名章节必须使用这些二级标题（一字不差）：
${headingList}
不要发明其它二级标题。证书、语言等可写进技能或个人总结。
只有在要提交完整简历时才调用 writeResumeBody，参数是整篇 Markdown，不是补丁。`

export function buildSystemPrompt(body: string) {
  const empty = body.trim().length === 0
  if (empty) {
    return `${sharedRules}

当前正文为空，你处于创建模式。先用简短问题采访用户（姓名、联系方式、工作经历、教育、项目、技能）。信息不够时只提问，不要调用 writeResumeBody。信息足够后再提交完整正文。`
  }

  return `${sharedRules}

当前正文非空，你处于润色模式。先确认用户想改什么；需要改写时调用 writeResumeBody，必须提交完整替换后的 Markdown，保留未改章节。

当前正文：
${body}`
}
