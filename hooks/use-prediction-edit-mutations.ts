'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { predictionsApi } from '@/lib/api/predictions'
import { AnnualPredictionRequest, QuarterlyPredictionRequest } from '@/lib/types/prediction'
import { predictionKeys } from '@/lib/hooks/use-predictions'
import { usePredictionsStore } from '@/lib/stores/predictions-store'

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
    onSuccess: (response, variables) => {
      const { type } = variables

      queryClient.invalidateQueries({ queryKey: predictionKeys.all })
      if (type === 'annual') {
        queryClient.invalidateQueries({ queryKey: predictionKeys.annual() })
      } else {
        queryClient.invalidateQueries({ queryKey: predictionKeys.quarterly() })
      }

      refetchPredictions()

      toast.success(`${type === 'annual' ? 'Annual' : 'Quarterly'} prediction updated successfully! 🎉`)

      return response
    },
    onError: (error, variables) => {
      console.error(`${variables.type} prediction update failed:`, error)
      toast.error(`Failed to update ${variables.type} prediction`, {
        description: error.message || 'Please try again'
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
    onSuccess: (response, variables) => {
      const { type } = variables

      queryClient.invalidateQueries({ queryKey: predictionKeys.all })
      if (type === 'annual') {
        queryClient.invalidateQueries({ queryKey: predictionKeys.annual() })
      } else {
        queryClient.invalidateQueries({ queryKey: predictionKeys.quarterly() })
      }

      toast.success(`${type === 'annual' ? 'Annual' : 'Quarterly'} prediction deleted successfully! 🗑️`)

      return response
    },
    onError: (error, variables) => {
      console.error(`${variables.type} prediction deletion failed:`, error)

      refetchPredictions()

      toast.error(`Failed to delete ${variables.type} prediction`, {
        description: error.message || 'Please try again'
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
