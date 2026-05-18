'use client'

import { createContext, useContext } from 'react'

interface BloomContextType {
  triggerBloom: () => void
}

export const BloomContext = createContext<BloomContextType>({ triggerBloom: () => {} })

export function useBloom() {
  return useContext(BloomContext)
}
