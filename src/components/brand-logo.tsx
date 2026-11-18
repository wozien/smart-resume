'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

const SIZE_CLASSES = {
  xs: 'size-7 rounded-lg',
  sm: 'size-8 rounded-xl',
  md: 'size-10 rounded-xl',
  lg: 'size-11 rounded-2xl',
  xl: 'size-12 rounded-2xl',
} as const

export type BrandMarkSize = keyof typeof SIZE_CLASSES

export function BrandMark({
  size = 'sm',
  className,
}: {
  size?: BrandMarkSize
  className?: string
}) {
  const uid = useId()
  const bgId = `brand-bg-${uid}`
  const pageId = `brand-page-${uid}`

  return (
    <div
      aria-hidden
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden select-none',
        SIZE_CLASSES[size],
        className,
      )}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full"
      >
        <defs>
          <linearGradient
            id={bgId}
            x1="0"
            y1="0"
            x2="64"
            y2="64"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#4F5CE5" />
            <stop offset="52%" stopColor="#635BFF" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
          <linearGradient
            id={pageId}
            x1="14"
            y1="14"
            x2="45"
            y2="52"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EEF0FF" />
          </linearGradient>
        </defs>

        {/* 渐变底板与内高光描边 */}
        <rect width="64" height="64" rx="16" fill={`url(#${bgId})`} />
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="15"
          stroke="#FFFFFF"
          strokeOpacity="0.22"
          strokeWidth="1.5"
        />

        {/* 底层叠纸阴影，象征多轮修订与文档层次 */}
        <rect
          x="12"
          y="16.5"
          width="30"
          height="36"
          rx="6"
          transform="rotate(-6 12 16.5)"
          fill="#FFFFFF"
          fillOpacity="0.22"
        />

        {/* 主简历文档 */}
        <rect
          x="13.5"
          y="13.5"
          width="31"
          height="38"
          rx="6.5"
          fill={`url(#${pageId})`}
        />

        {/* 简历文首标识（圆点头像 + 姓名横条） */}
        <circle cx="22" cy="23" r="3.4" fill="#5A6ACF" />
        <rect x="28" y="21" width="10.5" height="4" rx="2" fill="#5A6ACF" />

        {/* 简历章节结构线 */}
        <rect
          x="18.5"
          y="31.5"
          width="21"
          height="3.2"
          rx="1.6"
          fill="#5A6ACF"
          fillOpacity="0.86"
        />
        <rect
          x="18.5"
          y="37.8"
          width="17"
          height="3.2"
          rx="1.6"
          fill="#5A6ACF"
          fillOpacity="0.56"
        />
        <rect
          x="18.5"
          y="44"
          width="12.5"
          height="3.2"
          rx="1.6"
          fill="#5A6ACF"
          fillOpacity="0.38"
        />

        {/* 右上角 AI 智能四芒星 */}
        <path
          d="M46.5 8.5C46.5 14.9 49.4 17.8 55.8 17.8C49.4 17.8 46.5 20.7 46.5 27.1C46.5 20.7 43.6 17.8 37.2 17.8C43.6 17.8 46.5 14.9 46.5 8.5Z"
          fill="#FFFFFF"
        />
        <circle cx="53" cy="28.5" r="2" fill="#FFFFFF" fillOpacity="0.9" />
      </svg>
    </div>
  )
}
