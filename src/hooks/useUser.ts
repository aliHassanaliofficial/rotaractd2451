'use client'

import { useAuth } from '@/providers/AuthProvider'

export function useUser() {
  return useAuth()
}
