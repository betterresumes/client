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

  useEffect(() => {
    if (isAuthenticated && user && accessToken && !isInitialized) {
      const timer = setTimeout(() => {
        fetchPredictions(false)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user, accessToken, isInitialized, fetchPredictions])

  useEffect(() => {
    const handleAuthLogin = () => {
      setTimeout(() => {
        fetchPredictions(true) 
      }, 200)
    }

    const handleAuthLogout = () => {
      // Optionally, clear predictions or perform other cleanup on logout
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-login-success', handleAuthLogin)
      window.addEventListener('auth-logout', handleAuthLogout)

      return () => {
        window.removeEventListener('auth-login-success', handleAuthLogin)
        window.removeEventListener('auth-logout', handleAuthLogout)
      }
    }
  }, [fetchPredictions])

  return <>{children}</>
}
