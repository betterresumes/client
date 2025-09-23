import { create } from 'zustand'
import { dashboardApi } from '@/lib/api/dashboard'
import type { DashboardStats } from '@/lib/api/dashboard'

interface DashboardStatsState {
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
  cacheExpiryTime: number // 5 minutes in milliseconds
}

interface DashboardStatsActions {
  fetchStats: (forceRefresh?: boolean) => Promise<void>
  clearError: () => void
  invalidateCache: () => void
}

type DashboardStatsStore = DashboardStatsState & DashboardStatsActions

export const useDashboardStatsStore = create<DashboardStatsStore>((set, get) => ({
  // Initial state
  stats: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  cacheExpiryTime: 5 * 60 * 1000, // 5 minutes

  // Actions
  fetchStats: async (forceRefresh = false) => {
    const state = get()

    // Check if we have fresh cached data (unless forcing refresh)
    if (!forceRefresh && state.stats && state.lastFetched) {
      const now = Date.now()
      const timeSinceLastFetch = now - state.lastFetched

      if (timeSinceLastFetch < state.cacheExpiryTime) {
        console.log('📊 Using cached dashboard stats (fresh within 5 minutes)')
        return
      }
    }

    // Don't fetch if already loading
    if (state.isLoading) {
      console.log('📊 Dashboard stats fetch already in progress, skipping...')
      return
    }

    set({ isLoading: true, error: null })

    try {
      console.log('📊 Fetching dashboard stats from API...')
      const stats = await dashboardApi.getStats()

      set({
        stats,
        isLoading: false,
        error: null,
        lastFetched: Date.now()
      })

      console.log('✅ Dashboard stats fetched successfully:', stats)
    } catch (error: any) {
      console.error('❌ Failed to fetch dashboard stats:', error)
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch dashboard statistics'
      })
    }
  },

  clearError: () => {
    set({ error: null })
  },

  invalidateCache: () => {
    console.log('🗑️ Invalidating dashboard stats cache')
    set({ lastFetched: null })
  }
}))

// Set up event listeners for cache invalidation
if (typeof window !== 'undefined') {
  // Listen for prediction events that should invalidate dashboard stats
  const events = [
    'prediction-created',
    'prediction-updated',
    'prediction-deleted',
    'predictions-updated'
  ]

  events.forEach(eventName => {
    window.addEventListener(eventName, () => {
      console.log(`🔄 ${eventName} event - invalidating dashboard stats cache`)
      const store = useDashboardStatsStore.getState()
      store.invalidateCache()
    })
  })
}
