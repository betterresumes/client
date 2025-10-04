'use client'

import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { predictionsApi } from '@/lib/api/predictions'
import { toast } from 'sonner'
import { formatApiError } from '@/lib/utils/error-formatting'
import type {
  AnnualPredictionRequest,
  QuarterlyPredictionRequest,
} from '@/lib/types/prediction'
import { useState } from 'react'
import { useDashboardStatsStore } from '@/lib/stores/dashboard-stats-store'

export function useOptimizedPredictionMutations() {
  const { addPrediction, replacePrediction, removePrediction, refetchPredictions } = usePredictionsStore()
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // CREATE ANNUAL PREDICTION
  const createAnnualPrediction = async (data: AnnualPredictionRequest) => {
    setIsCreating(true)

    try {
      // Make API call (no optimistic row to avoid showing incomplete data)
      const response = await predictionsApi.annual.createAnnualPrediction(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create annual prediction')
      }

      // Force-refresh predictions so table shows finalized values only
      try {
        await refetchPredictions()
      } catch (err) {
        console.warn('Refresh predictions after create (annual) failed:', err)
      }

      // Also refresh dashboard stats so cards reflect new data immediately
      try {
        const statsStore = useDashboardStatsStore.getState()
        statsStore.invalidateCache()
        await statsStore.fetchStats(true)
      } catch (err) {
        console.warn('Refresh dashboard stats after create (annual) failed:', err)
      }

      toast.success('Annual prediction created successfully')

      // Dispatch event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-created', {
          detail: { type: 'annual', prediction: response.data }
        }))
        window.dispatchEvent(new CustomEvent('predictions-updated'))
      }

      return response.data
    } catch (error: any) {
      const formattedErrorMessage = formatApiError(error, 'Failed to create annual prediction')
      toast.error(formattedErrorMessage)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  // CREATE QUARTERLY PREDICTION
  const createQuarterlyPrediction = async (data: QuarterlyPredictionRequest) => {
    setIsCreating(true)

    try {
      // Make API call (no optimistic row to avoid showing incomplete data)
      const response = await predictionsApi.quarterly.createQuarterlyPrediction(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create quarterly prediction')
      }

      // Force-refresh predictions so table shows finalized values only
      try {
        await refetchPredictions()
      } catch (err) {
        console.warn('Refresh predictions after create (quarterly) failed:', err)
      }

      // Also refresh dashboard stats immediately
      try {
        const statsStore = useDashboardStatsStore.getState()
        statsStore.invalidateCache()
        await statsStore.fetchStats(true)
      } catch (err) {
        console.warn('Refresh dashboard stats after create (quarterly) failed:', err)
      }

      toast.success('Quarterly prediction created successfully')

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-created', {
          detail: { type: 'quarterly', prediction: response.data }
        }))
        window.dispatchEvent(new CustomEvent('predictions-updated'))
      }

      return response.data
    } catch (error: any) {
      const formattedErrorMessage = formatApiError(error, 'Failed to create quarterly prediction')
      toast.error(formattedErrorMessage)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  // UPDATE ANNUAL PREDICTION
  const updateAnnualPrediction = async ({ id, data }: { id: string; data: AnnualPredictionRequest }) => {
    setIsUpdating(true)
    try {
      const response = await predictionsApi.annual.updateAnnualPrediction(id, data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update annual prediction')
      }

      // Optionally update locally for instant feedback
      replacePrediction(response.data, 'annual', id)

      // Ensure the list reflects final server state (no stale values)
      try {
        await refetchPredictions()
      } catch (err) {
        console.warn('Refresh predictions after update (annual) failed:', err)
      }

      // Refresh dashboard stats
      try {
        const statsStore = useDashboardStatsStore.getState()
        statsStore.invalidateCache()
        await statsStore.fetchStats(true)
      } catch (err) {
        console.warn('Refresh dashboard stats after update (annual) failed:', err)
      }

      toast.success('Annual prediction updated successfully')

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-updated', { detail: { type: 'annual', id } }))
        window.dispatchEvent(new CustomEvent('predictions-updated'))
        window.dispatchEvent(new CustomEvent('refresh-dashboard-stats'))
      }

      return response.data
    } catch (error: any) {
      const formattedErrorMessage = formatApiError(error, 'Failed to update annual prediction')
      toast.error(formattedErrorMessage)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  // UPDATE QUARTERLY PREDICTION
  const updateQuarterlyPrediction = async ({ id, data }: { id: string; data: QuarterlyPredictionRequest }) => {
    setIsUpdating(true)
    try {
      const response = await predictionsApi.quarterly.updateQuarterlyPrediction(id, data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update quarterly prediction')
      }

      replacePrediction(response.data, 'quarterly', id)

      // Ensure the list reflects final server state (no stale values)
      try {
        await refetchPredictions()
      } catch (err) {
        console.warn('Refresh predictions after update (quarterly) failed:', err)
      }

      // Refresh dashboard stats
      try {
        const statsStore = useDashboardStatsStore.getState()
        statsStore.invalidateCache()
        await statsStore.fetchStats(true)
      } catch (err) {
        console.warn('Refresh dashboard stats after update (quarterly) failed:', err)
      }

      toast.success('Quarterly prediction updated successfully')

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-updated', { detail: { type: 'quarterly', id } }))
        window.dispatchEvent(new CustomEvent('predictions-updated'))
        window.dispatchEvent(new CustomEvent('refresh-dashboard-stats'))
      }

      return response.data
    } catch (error: any) {
      const formattedErrorMessage = formatApiError(error, 'Failed to update quarterly prediction')
      toast.error(formattedErrorMessage)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  // DELETE ANNUAL PREDICTION
  const deleteAnnualPrediction = async (predictionId: string) => {
    setIsDeleting(true)
    try {
      const response = await predictionsApi.annual.deleteAnnualPrediction(predictionId)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete annual prediction')
      }

      // Remove from store
      removePrediction(predictionId, 'annual')

      // Ensure lists and stats reflect deletion
      try {
        await refetchPredictions()
      } catch (err) {
        console.warn('Refresh predictions after delete (annual) failed:', err)
      }
      try {
        const statsStore = useDashboardStatsStore.getState()
        statsStore.invalidateCache()
        await statsStore.fetchStats(true)
      } catch (err) {
        console.warn('Refresh dashboard stats after delete (annual) failed:', err)
      }

      toast.success('Annual prediction deleted successfully')

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-deleted', { detail: { type: 'annual', id: predictionId } }))
        window.dispatchEvent(new CustomEvent('predictions-updated'))
        window.dispatchEvent(new CustomEvent('refresh-dashboard-stats'))
      }

      return predictionId
    } catch (error: any) {
      const formattedErrorMessage = formatApiError(error, 'Failed to delete annual prediction')
      toast.error(formattedErrorMessage)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }

  // DELETE QUARTERLY PREDICTION
  const deleteQuarterlyPrediction = async (predictionId: string) => {
    setIsDeleting(true)
    try {
      const response = await predictionsApi.quarterly.deleteQuarterlyPrediction(predictionId)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete quarterly prediction')
      }

      removePrediction(predictionId, 'quarterly')

      // Ensure lists and stats reflect deletion
      try {
        await refetchPredictions()
      } catch (err) {
        console.warn('Refresh predictions after delete (quarterly) failed:', err)
      }
      try {
        const statsStore = useDashboardStatsStore.getState()
        statsStore.invalidateCache()
        await statsStore.fetchStats(true)
      } catch (err) {
        console.warn('Refresh dashboard stats after delete (quarterly) failed:', err)
      }

      toast.success('Quarterly prediction deleted successfully')

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-deleted', { detail: { type: 'quarterly', id: predictionId } }))
        window.dispatchEvent(new CustomEvent('predictions-updated'))
        window.dispatchEvent(new CustomEvent('refresh-dashboard-stats'))
      }

      return predictionId
    } catch (error: any) {
      const formattedErrorMessage = formatApiError(error, 'Failed to delete quarterly prediction')
      toast.error(formattedErrorMessage)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }

  // MANUAL REFRESH - refresh both predictions and dashboard stats
  const refreshPredictions = async () => {
    console.log('🔄 Manual refresh requested - refreshing all dashboard data')

    try {
      // Refresh predictions data
      await refetchPredictions()

      // Refresh dashboard stats
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh-dashboard-stats'))
      }

      toast.success('Dashboard data refreshed successfully')
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
      toast.error('Failed to refresh some data')
    }
  }

  return {
    createAnnualPrediction,
    createQuarterlyPrediction,
    updateAnnualPrediction,
    updateQuarterlyPrediction,
    deleteAnnualPrediction,
    deleteQuarterlyPrediction,
    refreshPredictions,
    isCreating,
    isUpdating,
    isDeleting
  }
}
