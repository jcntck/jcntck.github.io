import type { ReactNode } from 'react'

export interface HubModule {
  id: string
  label: string
  path: string
  element: ReactNode
}
