import { QueryClient } from '@tanstack/react-query'
import { useNotifications } from '../stores/ui'

// Default options for all queries
const defaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount: number, error: any) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      return failureCount < 3
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: false,
  },
}

// Create query client
export const queryClient = new QueryClient({
  defaultOptions,
})

// Global error handler for queries
queryClient.setMutationDefaults(['*'], {
  onError: (error: any) => {
    console.error('Mutation error:', error)

    // You can add global error handling here
    // For example, show toast notifications
    if (typeof window !== 'undefined') {
      // Use notification system if available
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred'
      console.error('API Error:', errorMessage)
    }
  },
})

// Query key factory for consistent cache keys
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  profile: () => [...queryKeys.auth, 'profile'] as const,

  // Companies
  companies: ['companies'] as const,
  companiesList: (params?: any) => [...queryKeys.companies, 'list', params] as const,
  company: (id: string) => [...queryKeys.companies, 'detail', id] as const,
  companyBySymbol: (symbol: string) => [...queryKeys.companies, 'symbol', symbol] as const,
  companyStats: () => [...queryKeys.companies, 'stats'] as const,
  companyAutocomplete: (query?: string) => [...queryKeys.companies, 'autocomplete', query] as const,

  // Predictions
  predictions: ['predictions'] as const,
  predictionsList: (params?: any) => [...queryKeys.predictions, 'list', params] as const,
  prediction: (id: string) => [...queryKeys.predictions, 'detail', id] as const,
  predictionByCompany: (companyId: string, modelType: string) => [...queryKeys.predictions, 'company', companyId, modelType] as const,
  predictionStats: () => [...queryKeys.predictions, 'stats'] as const,
  riskDistribution: (params?: any) => [...queryKeys.predictions, 'risk-distribution', params] as const,
  historicalTrends: (params?: any) => [...queryKeys.predictions, 'trends', params] as const,
  modelPerformance: () => [...queryKeys.predictions, 'model-performance'] as const,

  // Jobs
  jobs: ['jobs'] as const,
  jobsList: (params?: any) => [...queryKeys.jobs, 'list', params] as const,
  job: (id: string) => [...queryKeys.jobs, 'detail', id] as const,
  jobProgress: (id: string) => [...queryKeys.jobs, 'progress', id] as const,
  jobResults: (id: string) => [...queryKeys.jobs, 'results', id] as const,
  jobLogs: (id: string, params?: any) => [...queryKeys.jobs, 'logs', id, params] as const,
  activeJobs: () => [...queryKeys.jobs, 'active'] as const,
  recentJobs: (limit?: number) => [...queryKeys.jobs, 'recent', limit] as const,
  jobStats: () => [...queryKeys.jobs, 'stats'] as const,
} as const

// Helper function to invalidate related queries
export const invalidateQueries = {
  companies: () => queryClient.invalidateQueries({ queryKey: queryKeys.companies }),
  predictions: () => queryClient.invalidateQueries({ queryKey: queryKeys.predictions }),
  jobs: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs }),
  auth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth }),

  // Specific invalidations
  companyDetail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.company(id) }),
  predictionDetail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.prediction(id) }),
  jobDetail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.job(id) }),
} as const
