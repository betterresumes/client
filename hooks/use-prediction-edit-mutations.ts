'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { predictionsApi } from '@/lib/api/predictions'
import { AnnualPredictionRequest, QuarterlyPredictionRequest } from '@/lib/types/prediction'
import { predictionKeys } from '@/lib/hooks/use-predictions'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { formatApiError } from '@/lib/utils/error-formatting'
import { useDashboardStatsStore } from '@/lib/stores/dashboard-stats-store'

export function usePredictionMutations() {
  const queryClient = useQueryClient()
  const { refetchPredictions, removePrediction } = usePredictionsStore()

  const updatePredictionMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      type
    }: {
      id: string
      data: AnnualPredictionRequest | QuarterlyPredictionRequest
      type: 'annual' | 'quarterly'
    }) => {
      if (type === 'annual') {
        return await predictionsApi.annual.updateAnnualPrediction(id, data as AnnualPredictionRequest)
      } else {
        return await predictionsApi.quarterly.updateQuarterlyPrediction(id, data as QuarterlyPredictionRequest)
      }
    },
    onSuccess: async (response, variables) => {
      const { type } = variables

      queryClient.invalidateQueries({ queryKey: predictionKeys.all })
      if (type === 'annual') {
        queryClient.invalidateQueries({ queryKey: predictionKeys.annual() })
      } else {
        queryClient.invalidateQueries({ queryKey: predictionKeys.quarterly() })
      }

      // Ensure fresh data everywhere
      await refetchPredictions()
      try {
        const statsStore = useDashboardStatsStore.getState()
        statsStore.invalidateCache()
        await statsStore.fetchStats(true)
      } catch (e) {
        console.warn('Dashboard stats refresh after update failed:', e)
      }

      // Notify listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-updated', { detail: { type } }))
        window.dispatchEvent(new CustomEvent('predictions-updated'))
        window.dispatchEvent(new CustomEvent('refresh-dashboard-stats'))
      }

      toast.success(`${type === 'annual' ? 'Annual' : 'Quarterly'} prediction updated successfully! 🎉`)

      return response
    },
    onError: (error, variables) => {
      console.error(`${variables.type} prediction update failed:`, error)

      // Format user-friendly error messages
      const formattedErrorMessage = formatApiError(error, `Failed to update ${variables.type} prediction`)

      toast.error(formattedErrorMessage, {
        description: 'Please try again'
      })
    }
  })

  const deletePredictionMutation = useMutation({
    mutationFn: async ({
      id,
      type
    }: {
      id: string
      type: 'annual' | 'quarterly'
    }) => {
      removePrediction(id, type)

      if (type === 'annual') {
        return await predictionsApi.annual.deleteAnnualPrediction(id)
      } else {
        return await predictionsApi.quarterly.deleteQuarterlyPrediction(id)
      }
    },
    onSuccess: async (response, variables) => {
      const { type } = variables

      queryClient.invalidateQueries({ queryKey: predictionKeys.all })
      if (type === 'annual') {
        queryClient.invalidateQueries({ queryKey: predictionKeys.annual() })
      } else {
        queryClient.invalidateQueries({ queryKey: predictionKeys.quarterly() })
      }

      // Ensure lists and dashboard reflect deletion
      try {
        await refetchPredictions()
      } catch (e) {
        console.warn('Predictions refetch after delete failed:', e)
      }
      try {
        const statsStore = useDashboardStatsStore.getState()
        statsStore.invalidateCache()
        await statsStore.fetchStats(true)
      } catch (e) {
        console.warn('Dashboard stats refresh after delete failed:', e)
      }

      // Notify listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-deleted', { detail: { type, id: variables.id } }))
        window.dispatchEvent(new CustomEvent('predictions-updated'))
        window.dispatchEvent(new CustomEvent('refresh-dashboard-stats'))
      }

      toast.success(`${type === 'annual' ? 'Annual' : 'Quarterly'} prediction deleted successfully! 🗑️`)

      return response
    },
    onError: (error, variables) => {
      console.error(`${variables.type} prediction deletion failed:`, error)

      refetchPredictions()

      // Format user-friendly error messages
      const formattedErrorMessage = formatApiError(error, `Failed to delete ${variables.type} prediction`)

      toast.error(formattedErrorMessage, {
        description: 'Please try again'
      })
    }
  })

  return {
    updatePredictionMutation,
    deletePredictionMutation,
    isUpdating: updatePredictionMutation.isPending,
    isDeleting: deletePredictionMutation.isPending
  }
}
