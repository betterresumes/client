'use client'

import { create } from 'zustand'
import { dashboardApi, type DashboardStats } from '@/lib/api/dashboard'
import { useAuthStore } from './auth-store'

interface DashboardStatsState {
  // Data
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
  isInitialized: boolean

  // Cache management
  cacheValidTime: number // 5 minutes default

  // Actions
  fetchStats: (force?: boolean) => Promise<void>
  invalidateCache: () => void
  clearError: () => void
  reset: () => void
}

export const useDashboardStatsStore = create<DashboardStatsState>((set, get) => {
  // Set up event listeners for automatic refresh
  if (typeof window !== 'undefined') {
    // Listen for prediction creation/updates to invalidate cache
    window.addEventListener('prediction-created', () => {
      console.log('🔄 Prediction created - invalidating dashboard cache')
      get().invalidateCache()
    })

    window.addEventListener('predictions-updated', () => {
      console.log('🔄 Predictions updated - invalidating dashboard cache')
      get().invalidateCache()
    })

    // Listen for successful login to refresh dashboard
    window.addEventListener('auth-login-success', () => {
      console.log('🔑 Login successful - fetching dashboard stats')
      setTimeout(() => {
        get().fetchStats(true)
      }, 300) // Small delay to ensure API client has tokens
    })

    // Listen for logout to clear dashboard data
    window.addEventListener('auth-logout', () => {
      console.log('🔓 Logout detected - clearing dashboard data')
      get().reset()
    })

    // Listen for data filter changes to potentially refresh stats
    window.addEventListener('data-filter-changed', () => {
      console.log('🔄 Data filter changed - dashboard stats may need refresh')
      // Dashboard stats are role-based, not filter-based, so we don't need to refresh
      // But we dispatch this event to notify dashboard components to re-render
    })
  }

  return {
    // Initial state
    stats: null,
    isLoading: false,
    error: null,
    lastFetched: null,
    isInitialized: false,
    cacheValidTime: 5 * 60 * 1000, // 5 minutes

    fetchStats: async (force = false) => {
      const state = get()

      // Skip if already loading
      if (state.isLoading && !force) {
        console.log('📊 Dashboard stats already loading - skipping')
        return
      }

      // Check cache validity
      if (!force && state.lastFetched && Date.now() - state.lastFetched < state.cacheValidTime) {
        console.log('📊 Using cached dashboard stats')
        return
      }

      // Verify user is authenticated
      const authStore = useAuthStore.getState()
      if (!authStore.user) {
        console.log('📊 No authenticated user - skipping dashboard stats fetch')
        set({
          isLoading: false,
          error: 'User not authenticated',
          isInitialized: true
        })
        return
      }

      console.log('📊 Fetching fresh dashboard stats from API...')
      set({ isLoading: true, error: null })

      try {
        const response = await dashboardApi.getStats()

        if (response.success && response.data) {
          console.log('📊 Dashboard stats fetched successfully:', response.data.scope)
          console.log('📊 Stats:', {
            companies: response.data.total_companies,
            predictions: response.data.total_predictions,
            scope: response.data.scope
          })

          set({
            stats: response.data,
            isLoading: false,
            error: null,
            lastFetched: Date.now(),
            isInitialized: true
          })
        } else {
          throw new Error(response.message || 'Failed to fetch dashboard stats')
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch dashboard stats:', error)

        // Check if this is an auth error vs other error
        const isAuthError = error?.response?.status === 401 || error?.message?.includes('unauthorized')

        if (isAuthError) {
          console.log('🔒 Auth error detected - clearing dashboard data')
          set({
            stats: null,
            isLoading: false,
            error: null, // Don't show error to user for auth issues
            isInitialized: true
          })

          // Retry after a short delay to allow token refresh
          setTimeout(() => {
            console.log('🔄 Retrying dashboard stats fetch after auth error')
            get().fetchStats(true)
          }, 2000)
        } else {
          // For non-auth errors, show error but keep existing data if available
          set({
            isLoading: false,
            error: error.message || 'Failed to fetch dashboard statistics',
            isInitialized: true
          })
        }
      }
    },

    invalidateCache: () => {
      const state = get()
      console.log('📊 Invalidating dashboard cache - forcing refresh')

      set({
        lastFetched: null,
        isInitialized: false
      })

      // Auto-refresh if we had data before
      if (state.stats) {
        setTimeout(() => {
          get().fetchStats(true)
        }, 500) // Small delay to ensure any prediction operations are complete
      }
    },

    clearError: () => set({ error: null }),

    reset: () => {
      console.log('📊 Resetting dashboard state')
      set({
        stats: null,
        isLoading: false,
        error: null,
        lastFetched: null,
        isInitialized: false
      })
    }
  }
})
