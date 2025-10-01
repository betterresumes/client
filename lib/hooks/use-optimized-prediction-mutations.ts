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

export function useOptimizedPredictionMutations() {
  const { addPrediction, replacePrediction, removePrediction, refetchPredictions } = usePredictionsStore()
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // CREATE ANNUAL PREDICTION
  const createAnnualPrediction = async (data: AnnualPredictionRequest) => {
    const tempId = `temp-${Date.now()}`
    setIsCreating(true)

    try {
      // Create temporary optimistic prediction
      const tempPrediction = {
        ...data,
        id: tempId,
        company_id: `temp-company-${Date.now()}`,
        default_probability: 0,
        risk_level: 'UNKNOWN',
        confidence: 0,
        organization_access: 'user', // Will be updated from API response
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'current-user'
      }

      // Optimistically add to store
      addPrediction(tempPrediction, 'annual')

      // Make API call
      const response = await predictionsApi.annual.createAnnualPrediction(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create annual prediction')
      }

      // Replace temp prediction with real one
      replacePrediction(response.data, 'annual', tempId)

      toast.success('Annual prediction created successfully')

      // Dispatch event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-created', {
          detail: { type: 'annual', prediction: response.data }
        }))
      }

      return response.data
    } catch (error: any) {
      // Remove optimistic prediction on error
      removePrediction(tempId, 'annual')
      const formattedErrorMessage = formatApiError(error, 'Failed to create annual prediction')
      toast.error(formattedErrorMessage)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  // CREATE QUARTERLY PREDICTION
  const createQuarterlyPrediction = async (data: QuarterlyPredictionRequest) => {
    const tempId = `temp-${Date.now()}`
    setIsCreating(true)

    try {
      const tempPrediction = {
        ...data,
        id: tempId,
        company_id: `temp-company-${Date.now()}`,
        ensemble_probability: 0,
        logistic_probability: 0,
        gbm_probability: 0,
        risk_level: 'UNKNOWN',
        confidence: 0,
        organization_access: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'current-user'
      }

      addPrediction(tempPrediction, 'quarterly')

      const response = await predictionsApi.quarterly.createQuarterlyPrediction(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create quarterly prediction')
      }

      replacePrediction(response.data, 'quarterly', tempId)

      toast.success('Quarterly prediction created successfully')

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-created', {
          detail: { type: 'quarterly', prediction: response.data }
        }))
      }

      return response.data
    } catch (error: any) {
      removePrediction(tempId, 'quarterly')
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

      // Update the prediction in store
      replacePrediction(response.data, 'annual', id)

      toast.success('Annual prediction updated successfully')

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('predictions-updated'))
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

      toast.success('Quarterly prediction updated successfully')

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('predictions-updated'))
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

      toast.success('Annual prediction deleted successfully')

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('predictions-updated'))
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

      toast.success('Quarterly prediction deleted successfully')

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('predictions-updated'))
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
