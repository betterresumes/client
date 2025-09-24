'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { usePredictionsStore } from '@/lib/stores/predictions-store'

/**
 * Component that handles data synchronization and persistence
 * This ensures data is properly loaded and maintained across page refreshes and navigation
 */
export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, accessToken, refreshUserProfile, shouldRefreshProfile } = useAuthStore()
  const { fetchPredictions, isInitialized } = usePredictionsStore()

  // Auto-refresh user profile when needed
  useEffect(() => {
    if (isAuthenticated && user && shouldRefreshProfile()) {
      console.log('🔄 Auto-refreshing user profile')
      refreshUserProfile()
    }
  }, [isAuthenticated, user, shouldRefreshProfile, refreshUserProfile])

  // Initialize data when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user && accessToken && !isInitialized) {
      console.log('🚀 DataSync: Initializing data for user:', user.email)
      // Small delay to ensure auth is fully settled
      const timer = setTimeout(() => {
        fetchPredictions(false)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user, accessToken, isInitialized, fetchPredictions])

  // Listen for auth state changes to re-sync data
  useEffect(() => {
    const handleAuthLogin = () => {
      console.log('🔄 DataSync: Auth login detected, refreshing data')
      setTimeout(() => {
        fetchPredictions(true) // Force refresh on login
      }, 200)
    }

    const handleAuthLogout = () => {
      console.log('🧹 DataSync: Auth logout detected, data will be cleared by stores')
      // Data clearing is handled by individual stores
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
