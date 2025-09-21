'use client'

import { useTokenRefresh } from '@/lib/hooks/use-token-refresh'

interface DashboardProviderProps {
  children: React.ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  // Automatically refresh tokens when needed
  useTokenRefresh()

  return <>{children}</>
}
