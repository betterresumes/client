'use client'

import { useTokenRefresh } from '@/lib/hooks/use-token-refresh'

interface DashboardProviderProps {
  children: React.ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  useTokenRefresh()

  return <>{children}</>
}
