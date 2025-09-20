import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { predictionsApi } from '../api/predictions'
import { queryKeys } from '../config/query-client'
import { useNotifications } from '../stores/ui'
import type {
  Prediction,
  PredictionRequest,
  PredictionBatchRequest,
  PredictionParams,
  PredictionExportParams
} from '../types/prediction'

/**
 * Query hooks for predictions data
 */

// Get predictions list with pagination
export const usePredictions = (params?: PredictionParams) => {
  return useQuery({
    queryKey: queryKeys.predictionsList(params),
    queryFn: () => predictionsApi.getPredictions(params),
    enabled: true,
  })
}

// Get infinite predictions list for virtual scrolling
export const useInfinitePredictions = (baseParams?: Omit<PredictionParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: queryKeys.predictionsList({ ...baseParams, infinite: true }),
    queryFn: ({ pageParam = 1 }) =>
      predictionsApi.getPredictions({ ...baseParams, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.success || !lastPage.data) return undefined
      const { page, totalPages } = lastPage.data
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
  })
}

// Get single prediction
export const usePrediction = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.prediction(id),
    queryFn: () => predictionsApi.getPrediction(id),
    enabled: enabled && !!id,
  })
}

// Get prediction by company and model type
export const usePredictionByCompany = (
  companyId: string,
  modelType: 'annual' | 'quarterly',
  enabled = true
) => {
  return useQuery({
    queryKey: queryKeys.predictionByCompany(companyId, modelType),
    queryFn: () => predictionsApi.getPredictionByCompany(companyId, modelType),
    enabled: enabled && !!companyId,
  })
}

// Get prediction statistics
export const usePredictionStats = () => {
  return useQuery({
    queryKey: queryKeys.predictionStats(),
    queryFn: () => predictionsApi.getPredictionStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get risk distribution analytics
export const useRiskDistribution = (params?: {
  organizationId?: string
  startDate?: string
  endDate?: string
  modelType?: 'annual' | 'quarterly'
}) => {
  return useQuery({
    queryKey: queryKeys.riskDistribution(params),
    queryFn: () => predictionsApi.getRiskDistribution(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get historical trends
export const useHistoricalTrends = (params?: {
  organizationId?: string
  companyId?: string
  period?: 'week' | 'month' | 'quarter' | 'year'
  modelType?: 'annual' | 'quarterly'
}) => {
  return useQuery({
    queryKey: queryKeys.historicalTrends(params),
    queryFn: () => predictionsApi.getHistoricalTrends(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get model performance metrics
export const useModelPerformance = () => {
  return useQuery({
    queryKey: queryKeys.modelPerformance(),
    queryFn: () => predictionsApi.getModelPerformance(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Mutation hooks for prediction actions
 */

// Create single prediction
export const useCreatePrediction = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: (data: PredictionRequest) => predictionsApi.createPrediction(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.predictions })
        queryClient.invalidateQueries({ queryKey: queryKeys.predictionStats() })
        showSuccess('Prediction created successfully')
      } else {
        showError('Failed to create prediction', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Failed to create prediction', error?.message)
    },
  })
}

// Create batch predictions
export const useCreateBatchPredictions = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: (data: PredictionBatchRequest) => predictionsApi.createBatchPredictions(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
        const { totalCompanies, estimatedDuration } = response.data
        showSuccess(
          'Batch prediction job started',
          `Processing ${totalCompanies} companies. Estimated duration: ${Math.round(estimatedDuration / 60)} minutes.`
        )
      } else {
        showError('Failed to start batch prediction', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Failed to start batch prediction', error?.message)
    },
  })
}

// Update prediction
export const useUpdatePrediction = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PredictionRequest> }) =>
      predictionsApi.updatePrediction(id, data),
    onSuccess: (response, { id }) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.predictions })
        queryClient.invalidateQueries({ queryKey: queryKeys.prediction(id) })
        showSuccess('Prediction updated successfully')
      } else {
        showError('Failed to update prediction', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Failed to update prediction', error?.message)
    },
  })
}

// Delete prediction
export const useDeletePrediction = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: (id: string) => predictionsApi.deletePrediction(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.predictions })
        queryClient.invalidateQueries({ queryKey: queryKeys.predictionStats() })
        showSuccess('Prediction deleted successfully')
      } else {
        showError('Failed to delete prediction', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Failed to delete prediction', error?.message)
    },
  })
}

// Compare predictions
export const useComparePredictions = () => {
  const { showError } = useNotifications()

  return useMutation({
    mutationFn: ({ companyIds, modelType }: { companyIds: string[]; modelType?: 'annual' | 'quarterly' }) =>
      predictionsApi.comparePredictions(companyIds, modelType),
    onError: (error: any) => {
      showError('Failed to compare predictions', error?.message)
    },
  })
}

// Export predictions
export const useExportPredictions = () => {
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: (params?: PredictionExportParams) =>
      predictionsApi.exportPredictions(params),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `predictions_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showSuccess('Export completed successfully')
    },
    onError: (error: any) => {
      showError('Export failed', error?.message)
    },
  })
}

/**
 * Custom hooks for specific prediction workflows
 */

// Hook for real-time prediction updates (polling)
export const usePredictionPolling = (
  params?: PredictionParams,
  interval = 30000, // 30 seconds
  enabled = true
) => {
  return useQuery({
    queryKey: queryKeys.predictionsList({ ...params, polling: true }),
    queryFn: () => predictionsApi.getPredictions(params),
    enabled,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  })
}

// Hook for dashboard metrics that updates periodically
export const useDashboardMetrics = () => {
  const predictionStats = usePredictionStats()
  const riskDistribution = useRiskDistribution()
  const modelPerformance = useModelPerformance()

  return {
    predictionStats,
    riskDistribution,
    modelPerformance,
    isLoading: predictionStats.isLoading || riskDistribution.isLoading || modelPerformance.isLoading,
    isError: predictionStats.isError || riskDistribution.isError || modelPerformance.isError,
    refetch: () => {
      predictionStats.refetch()
      riskDistribution.refetch()
      modelPerformance.refetch()
    },
  }
}
