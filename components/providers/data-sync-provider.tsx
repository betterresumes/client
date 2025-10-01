'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { usePredictionsStore } from '@/lib/stores/predictions-store'

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, accessToken, refreshUserProfile, shouldRefreshProfile } = useAuthStore()
  const { fetchPredictions, isInitialized } = usePredictionsStore()

  useEffect(() => {
    if (isAuthenticated && user && shouldRefreshProfile()) {
      refreshUserProfile()
    }
  }, [isAuthenticated, user, shouldRefreshProfile, refreshUserProfile])

  // Only fetch data on initial auth, not on every render
  useEffect(() => {
    if (isAuthenticated && user && accessToken && !isInitialized) {
      console.log('🔄 DataSync: Initial data fetch triggered')
      const timer = setTimeout(() => {
        fetchPredictions(false)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user?.id, accessToken, isInitialized]) // Only depend on user ID, not the entire user object

  // Handle auth events for data synchronization
  useEffect(() => {
    const handleAuthLogin = () => {
      console.log('🔐 DataSync: Login detected - fetching fresh data')
      setTimeout(() => {
        fetchPredictions(true)
      }, 200)
    }

    const handleAuthLogout = () => {
      console.log('🔐 DataSync: Logout detected - clearing data handled by auth store')
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-login-success', handleAuthLogin)
      window.addEventListener('auth-logout', handleAuthLogout)

      return () => {
        window.removeEventListener('auth-login-success', handleAuthLogin)
        window.removeEventListener('auth-logout', handleAuthLogout)
      }
    }
  }, []) // No dependencies - only set up listeners once

  return <>{children}</>
}
