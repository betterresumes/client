'use client'

import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { useDashboardStatsStore } from '@/lib/stores/dashboard-stats-store'
import { toast } from 'sonner'

/**
 * Custom hook for coordinated dashboard refresh
 * Handles refreshing multiple API endpoints efficiently for large datasets
 */
export function useDashboardRefresh() {
  const { refetchPredictions } = usePredictionsStore()
  const { fetchStats, invalidateCache } = useDashboardStatsStore()

  const refreshAllData = async () => {
    console.log('🔄 Starting comprehensive dashboard refresh')

    const startTime = Date.now()
    let successCount = 0
    let errorCount = 0

    try {
      // Show loading toast for large datasets
      const loadingToast = toast.loading('Refreshing dashboard data...')

      // Refresh predictions (this may take time for large datasets)
      try {
        console.log('📊 Refreshing predictions data')
        await refetchPredictions()
        successCount++
        console.log('✅ Predictions refreshed successfully')
      } catch (error) {
        console.error('❌ Failed to refresh predictions:', error)
        errorCount++
      }

      // Refresh dashboard stats
      try {
        console.log('📈 Refreshing dashboard statistics')
        invalidateCache() // Force fresh fetch
        await fetchStats(true)
        successCount++
        console.log('✅ Dashboard stats refreshed successfully')
      } catch (error) {
        console.error('❌ Failed to refresh dashboard stats:', error)
        errorCount++
      }

      // Dispatch events for other components that might need refreshing
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh-dashboard-stats'))
        window.dispatchEvent(new CustomEvent('predictions-updated'))
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast)

      // Show result
      const duration = Date.now() - startTime
      if (errorCount === 0) {
        toast.success(`Dashboard refreshed successfully (${duration}ms)`)
      } else if (successCount > 0) {
        toast.warning(`Partial refresh completed - ${successCount} succeeded, ${errorCount} failed`)
      } else {
        toast.error('Failed to refresh dashboard data')
      }

      console.log(`🏁 Dashboard refresh completed in ${duration}ms - Success: ${successCount}, Errors: ${errorCount}`)

    } catch (error) {
      console.error('💥 Dashboard refresh failed:', error)
      toast.error('Failed to refresh dashboard')
    }
  }

  // Lightweight refresh for specific components
  const refreshPredictionsOnly = async () => {
    try {
      await refetchPredictions()
      toast.success('Predictions refreshed')
    } catch (error) {
      toast.error('Failed to refresh predictions')
    }
  }

  const refreshStatsOnly = async () => {
    try {
      invalidateCache()
      await fetchStats(true)
      toast.success('Statistics refreshed')
    } catch (error) {
      toast.error('Failed to refresh statistics')
    }
  }

  return {
    refreshAllData,
    refreshPredictionsOnly,
    refreshStatsOnly
  }
}
