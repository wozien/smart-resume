'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

export function clientOnly<P extends object = object>(
  importer: () => Promise<{ default: ComponentType<P> }>,
) {
  return dynamic(importer, {
    ssr: false,
    loading: () => null,
  })
}
