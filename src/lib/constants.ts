export const UNNAMED_TITLE = '未命名简历'

export const TEMPLATE_IDS = ['single', 'double'] as const
export type TemplateId = (typeof TEMPLATE_IDS)[number]
export const DEFAULT_TEMPLATE_ID: TemplateId = 'single'

export const NAMED_SECTIONS = [
  '个人总结',
  '工作经历',
  '教育经历',
  '项目经历',
  '技能',
] as const
export type NamedSection = (typeof NAMED_SECTIONS)[number]
