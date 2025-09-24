import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { predictionsApi } from '../api/predictions'
import type {
  AnnualPredictionRequest,
  QuarterlyPredictionRequest,
  PredictionParams
} from '../types/prediction'

export const predictionKeys = {
  all: ['predictions'] as const,
  lists: () => [...predictionKeys.all, 'list'] as const,
  list: (type: 'annual' | 'quarterly', filters: any) => [...predictionKeys.lists(), type, { filters }] as const,
  annual: () => [...predictionKeys.all, 'annual'] as const,
  quarterly: () => [...predictionKeys.all, 'quarterly'] as const,
  annualList: (filters: any) => [...predictionKeys.annual(), 'list', { filters }] as const,
  quarterlyList: (filters: any) => [...predictionKeys.quarterly(), 'list', { filters }] as const,
} as const

export function useAnnualPredictions(params?: {
  page?: number
  size?: number
  company_symbol?: string
  reporting_year?: string
}) {
  return useQuery({
    queryKey: predictionKeys.annualList(params),
    queryFn: async () => {
      const response = await predictionsApi.annual.getAnnualPredictions(params)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load annual predictions')
      }
      return response.data
    },
    staleTime: 2 * 60 * 1000, 
  })
}

export function useQuarterlyPredictions(params?: {
  page?: number
  size?: number
  company_symbol?: string
  reporting_year?: string
  reporting_quarter?: string
}) {
  return useQuery({
    queryKey: predictionKeys.quarterlyList(params),
    queryFn: async () => {
      const response = await predictionsApi.quarterly.getQuarterlyPredictions(params)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load quarterly predictions')
      }
      return response.data
    },
    staleTime: 2 * 60 * 1000, 
  })
}

export function usePredictions(params?: PredictionParams) {
  const modelType = params?.model_type || 'annual'

  return useQuery({
    queryKey: predictionKeys.list(modelType, params),
    queryFn: async () => {
      const response = await predictionsApi.getPredictions(params)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load predictions')
      }
      return response.data
    },
    staleTime: 2 * 60 * 1000, 
  })
}

export function useCreateAnnualPrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AnnualPredictionRequest) => {
      const response = await predictionsApi.annual.createAnnualPrediction(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create annual prediction')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: predictionKeys.annual() })
      toast.success('Annual prediction created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create annual prediction')
    },
  })
}

export function useCreateQuarterlyPrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: QuarterlyPredictionRequest) => {
      const response = await predictionsApi.quarterly.createQuarterlyPrediction(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create quarterly prediction')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: predictionKeys.quarterly() })
      toast.success('Quarterly prediction created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create quarterly prediction')
    },
  })
}

export function useUpdateAnnualPrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AnnualPredictionRequest }) => {
      const response = await predictionsApi.annual.updateAnnualPrediction(id, data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update annual prediction')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: predictionKeys.annual() })
      toast.success('Annual prediction updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update annual prediction')
    },
  })
}

export function useUpdateQuarterlyPrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: QuarterlyPredictionRequest }) => {
      const response = await predictionsApi.quarterly.updateQuarterlyPrediction(id, data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update quarterly prediction')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: predictionKeys.quarterly() })
      toast.success('Quarterly prediction updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update quarterly prediction')
    },
  })
}

export function useDeleteAnnualPrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (predictionId: string) => {
      const response = await predictionsApi.annual.deleteAnnualPrediction(predictionId)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete annual prediction')
      }
      return predictionId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: predictionKeys.annual() })
      toast.success('Annual prediction deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete annual prediction')
    },
  })
}

export function useDeleteQuarterlyPrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (predictionId: string) => {
      const response = await predictionsApi.quarterly.deleteQuarterlyPrediction(predictionId)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete quarterly prediction')
      }
      return predictionId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: predictionKeys.quarterly() })
      toast.success('Quarterly prediction deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete quarterly prediction')
    },
  })
}

export function useBulkUploadAnnualPredictions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await predictionsApi.annual.bulkUploadAnnualAsync(file)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to start bulk upload')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: predictionKeys.annual() })
      toast.success('Bulk upload started successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start bulk upload')
    },
  })
}

export function useBulkUploadQuarterlyPredictions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await predictionsApi.quarterly.bulkUploadQuarterlyAsync(file)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to start bulk upload')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: predictionKeys.quarterly() })
      toast.success('Bulk upload started successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start bulk upload')
    },
  })
}

export function useExportPredictions() {
  return useMutation({
    mutationFn: async (params: PredictionParams & { format?: 'csv' | 'xlsx' }) => {
      const blob = await predictionsApi.exportPredictions(params)

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `predictions-${params.model_type || 'annual'}-${new Date().toISOString().split('T')[0]}.${params.format || 'csv'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return true
    },
    onSuccess: () => {
      toast.success('Predictions exported successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export predictions')
    },
  })
}
