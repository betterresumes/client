'use client'

import { create } from 'zustand'
import { predictionsApi } from '@/lib/api/predictions'
import { useAuthStore } from '@/lib/stores/auth-store'

interface Prediction {
  // Core identification
  id: string
  company_id: string
  company_symbol: string
  company_name: string

  // Reporting period
  reporting_year: string
  reporting_quarter?: string

  // Financial ratios (different names than expected)
  long_term_debt_to_total_capital?: number
  total_debt_to_ebitda?: number
  net_income_margin?: number
  ebit_to_interest_expense?: number
  return_on_assets?: number
  sga_margin?: number
  return_on_capital?: number

  // Probability fields (multiple types)
  probability?: number // Annual predictions
  logistic_probability?: number // Quarterly predictions
  gbm_probability?: number // Quarterly predictions  
  ensemble_probability?: number // Quarterly predictions
  default_probability?: number // Computed field for backward compatibility

  // Risk assessment
  risk_level: string // "LOW", "MEDIUM", "HIGH"
  risk_category?: string // Backward compatibility
  confidence: number

  // Organization and access
  organization_id?: string | null
  organization_name?: string | null
  organization_access: string // "personal" | "organization" | "system" (simplified from backend)

  // Audit fields
  created_by: string
  created_by_email?: string
  created_at: string

  // Legacy fields for backward compatibility
  sector?: string
  model_type?: string
  model_version?: string
  updated_at?: string
}

interface PredictionsState {
  // Separate storage for user role data vs system data
  annualPredictions: Prediction[] // User role-based predictions (personal + org)
  quarterlyPredictions: Prediction[] // User role-based predictions (personal + org)
  systemAnnualPredictions: Prediction[] // System/platform predictions
  systemQuarterlyPredictions: Prediction[] // System/platform predictions

  isLoading: boolean
  error: string | null
  lastFetched: number | null
  isInitialized: boolean
  isFetching: boolean // Add flag to prevent multiple simultaneous calls

  // Smart pagination state
  smartPagination: {
    annual: {
      currentPage: number
      pageSize: number
      totalItems: number // From dashboard stats
      loadedItems: number // Actually loaded predictions
      hasLoadedInitialBatch: boolean
    }
    quarterly: {
      currentPage: number
      pageSize: number
      totalItems: number // From dashboard stats
      loadedItems: number // Actually loaded predictions
      hasLoadedInitialBatch: boolean
    }
    systemAnnual: {
      currentPage: number
      pageSize: number
      totalItems: number // From dashboard stats
      loadedItems: number // Actually loaded predictions
      hasLoadedInitialBatch: boolean
    }
    systemQuarterly: {
      currentPage: number
      pageSize: number
      totalItems: number // From dashboard stats
      loadedItems: number // Actually loaded predictions
      hasLoadedInitialBatch: boolean
    }
  }

  // Legacy pagination for backward compatibility
  // Separate pagination for user and system data
  annualPagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    pageSize: number
    hasMore: boolean
  }
  quarterlyPagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    pageSize: number
    hasMore: boolean
  }
  systemAnnualPagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    pageSize: number
    hasMore: boolean
  }
  systemQuarterlyPagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    pageSize: number
    hasMore: boolean
  }

  // Data access filter state  
  activeDataFilter: string // 'personal', 'organization', 'system', or 'all' for viewing

}

type PredictionsStore = PredictionsState & {
  // Actions
  fetchPredictions: (forceRefresh?: boolean) => Promise<void>
  loadMorePredictions: (type: 'annual' | 'quarterly') => Promise<void>
  fetchPage: (type: 'annual' | 'quarterly', page: number) => Promise<void>
  fetchBatch: (type: 'annual' | 'quarterly', batchSize?: number) => Promise<void> // NEW: Batch loading
  refetchPredictions: () => Promise<void>

  // Smart pagination actions
  setSmartPageSize: (type: 'annual' | 'quarterly', pageSize: number) => void
  setSmartCurrentPage: (type: 'annual' | 'quarterly', page: number) => void
  getSmartPaginatedData: (type: 'annual' | 'quarterly') => Prediction[]
  loadMoreDataIfNeeded: (type: 'annual' | 'quarterly', page: number) => Promise<void>
  initializeSmartPaginationFromStats: (annualTotal: number, quarterlyTotal: number) => void
  clearError: () => void
  reset: () => void
  invalidateCache: () => void
  addPrediction: (prediction: Prediction, type: 'annual' | 'quarterly') => void
  replacePrediction: (prediction: Prediction, type: 'annual' | 'quarterly', tempId: string) => void
  removePrediction: (predictionId: string, type: 'annual' | 'quarterly') => void
  setDataFilter: (filter: string) => void
  getDefaultFilterForUser: (user: any) => string

  // Utility functions
  getPredictionProbability: (prediction: Prediction) => number
  getRiskBadgeColor: (riskLevel: string | undefined | null) => string
  formatPredictionDate: (prediction: Prediction) => string
  getFilteredPredictions: (type: 'annual' | 'quarterly') => Prediction[]
}

export const usePredictionsStore = create<PredictionsStore>((set, get) => {
  // Set up event listeners for auth state changes
  if (typeof window !== 'undefined') {
    window.addEventListener('auth-logout', () => {
      get().reset()
    })
    
    window.addEventListener('auth-login-success', () => {
      get().invalidateCache()
    })
  }

  return {
    annualPredictions: [],
    quarterlyPredictions: [],
    systemAnnualPredictions: [],
    systemQuarterlyPredictions: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    isInitialized: false,
    isFetching: false,
    activeDataFilter: 'system', // Start with 'system' for user role

    // Smart pagination - client-side pagination with lazy loading
    smartPagination: {
      annual: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        loadedItems: 0,
        hasLoadedInitialBatch: false
      },
      quarterly: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        loadedItems: 0,
        hasLoadedInitialBatch: false
      },
      systemAnnual: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        loadedItems: 0,
        hasLoadedInitialBatch: false
      },
      systemQuarterly: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        loadedItems: 0,
        hasLoadedInitialBatch: false
      }
    },

    // Legacy server-side pagination
    // User data pagination - fetch smaller amounts for user-specific data
    annualPagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      pageSize: 100, // Smaller size for user data
      hasMore: false
    },
    quarterlyPagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      pageSize: 100, // Smaller size for user data
      hasMore: false
    },

    // System data pagination - fetch more for comprehensive platform view
    systemAnnualPagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      pageSize: 100, // Initial load for system data
      hasMore: false
    },
    systemQuarterlyPagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      pageSize: 100, // Initial load for system data
      hasMore: false
    },

    fetchPredictions: async (forceRefresh = false) => {
      const state = get()
      const authStore = useAuthStore.getState()
      const user = authStore.user

      if (!user) return
      if (state.isFetching) return

      // Smart caching: Only fetch what's needed based on user role and active filter
      const needsUserData = ['personal', 'organization', 'all'].includes(state.activeDataFilter) && 
                           user.role !== 'super_admin'
      const needsSystemData = state.activeDataFilter === 'system'

      // Check cache validity - 10 minutes for good UX
      const cacheValidTime = 10 * 60 * 1000 // 10 minutes
      const isCacheValid = !forceRefresh && state.isInitialized && state.lastFetched && 
                          (Date.now() - state.lastFetched < cacheValidTime)

      if (isCacheValid) {
        const hasNeededUserData = !needsUserData || (state.annualPredictions.length > 0 || state.quarterlyPredictions.length > 0)
        const hasNeededSystemData = !needsSystemData || (state.systemAnnualPredictions.length > 0 || state.systemQuarterlyPredictions.length > 0)
        
        if (hasNeededUserData && hasNeededSystemData) {
          return
        }
      }
      
      set({ isLoading: true, error: null, isFetching: true })

      try {
        // Get pagination state for API calls
        const { annualPagination, quarterlyPagination, systemAnnualPagination, systemQuarterlyPagination } = state

        // Prepare selective API calls based on needs
        const apiCalls = [
          needsUserData ? predictionsApi.annual.getAnnualPredictions({
            page: annualPagination.currentPage,
            size: annualPagination.pageSize,
          }) : null,
          needsUserData ? predictionsApi.quarterly.getQuarterlyPredictions({
            page: quarterlyPagination.currentPage,
            size: quarterlyPagination.pageSize,
          }) : null,
          needsSystemData ? predictionsApi.annual.getSystemAnnualPredictions({
            page: systemAnnualPagination.currentPage,
            size: systemAnnualPagination.pageSize,
          }) : null,
          needsSystemData ? predictionsApi.quarterly.getSystemQuarterlyPredictions({
            page: systemQuarterlyPagination.currentPage,
            size: systemQuarterlyPagination.pageSize,
          }) : null
        ]

        // Execute API calls
        const responses = await Promise.all(
          apiCalls.map(call => call ? call : Promise.resolve(null))
        )

        const [userAnnualResponse, userQuarterlyResponse, systemAnnualResponse, systemQuarterlyResponse] = responses

        // Process USER data only if fetched
        let transformedUserAnnual = state.annualPredictions
        let transformedUserQuarterly = state.quarterlyPredictions
        let userAnnualMeta = null
        let userQuarterlyMeta = null

        if (userAnnualResponse && needsUserData) {
          const userAnnualData = userAnnualResponse?.data?.items || 
                                userAnnualResponse?.data?.predictions || 
                                userAnnualResponse?.data || []
          userAnnualMeta = userAnnualResponse?.data

          transformedUserAnnual = Array.isArray(userAnnualData) ? userAnnualData.map((pred: any) => ({
            ...pred,
            default_probability: pred.probability || 0,
            risk_category: pred.risk_level,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            organization_access: pred.access_level || pred.organization_access || 'personal',
            financial_ratios: {
              ltdtc: pred.long_term_debt_to_total_capital,
              roa: pred.return_on_assets,
              ebitint: pred.ebit_to_interest_expense
            }
          })) : []
        }

        if (userQuarterlyResponse && needsUserData) {
          const userQuarterlyData = userQuarterlyResponse?.data?.items || 
                                   userQuarterlyResponse?.data?.predictions || 
                                   userQuarterlyResponse?.data || []
          userQuarterlyMeta = userQuarterlyResponse?.data

          transformedUserQuarterly = Array.isArray(userQuarterlyData) ? userQuarterlyData.map((pred: any) => ({
            ...pred,
            default_probability: pred.logistic_probability || 0,
            risk_category: pred.risk_level,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            reporting_quarter: pred.reporting_quarter?.toUpperCase() || "Q1",
            organization_access: pred.access_level || pred.organization_access || 'personal',
            financial_ratios: {
              ltdtc: pred.long_term_debt_to_total_capital,
              sga: pred.sga_margin,
              roa: pred.return_on_capital,
              tdte: pred.total_debt_to_ebitda
            }
          })) : []
        }

        // Process SYSTEM data only if fetched
        let transformedSystemAnnual = state.systemAnnualPredictions
        let transformedSystemQuarterly = state.systemQuarterlyPredictions
        let systemAnnualMeta = null
        let systemQuarterlyMeta = null

        if (systemAnnualResponse && needsSystemData) {
          let systemAnnualData
          
          if (Array.isArray(systemAnnualResponse?.data)) {
            systemAnnualData = systemAnnualResponse.data
          } else if (systemAnnualResponse?.data?.items) {
            systemAnnualData = systemAnnualResponse.data.items
          } else if (systemAnnualResponse?.data?.predictions) {
            systemAnnualData = systemAnnualResponse.data.predictions
          } else {
            systemAnnualData = []
          }
          
          systemAnnualMeta = systemAnnualResponse?.data

          transformedSystemAnnual = Array.isArray(systemAnnualData) ? systemAnnualData.map((pred: any) => ({
            ...pred,
            default_probability: pred.probability || 0,
            risk_category: pred.risk_level,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            organization_access: 'system',
            financial_ratios: {
              ltdtc: pred.long_term_debt_to_total_capital,
              roa: pred.return_on_assets,
              ebitint: pred.ebit_to_interest_expense
            }
          })) : []
        }

        if (systemQuarterlyResponse && needsSystemData) {
          let systemQuarterlyData
          
          if (Array.isArray(systemQuarterlyResponse?.data)) {
            systemQuarterlyData = systemQuarterlyResponse.data
          } else if (systemQuarterlyResponse?.data?.items) {
            systemQuarterlyData = systemQuarterlyResponse.data.items
          } else if (systemQuarterlyResponse?.data?.predictions) {
            systemQuarterlyData = systemQuarterlyResponse.data.predictions
          } else {
            systemQuarterlyData = []
          }
          
          systemQuarterlyMeta = systemQuarterlyResponse?.data

          transformedSystemQuarterly = Array.isArray(systemQuarterlyData) ? systemQuarterlyData.map((pred: any) => ({
            ...pred,
            default_probability: pred.logistic_probability || pred.probability || 0,
            risk_category: pred.risk_level,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            reporting_quarter: pred.reporting_quarter?.toUpperCase() || "Q1",
            organization_access: 'system',
            financial_ratios: {
              ltdtc: pred.long_term_debt_to_total_capital,
              sga: pred.sga_margin,
              roa: pred.return_on_capital,
              tdte: pred.total_debt_to_ebitda
            }
          })) : []
        }

        // Set initial data filter based on user role
        const initialFilter = get().getDefaultFilterForUser(user)

        set({
          annualPredictions: transformedUserAnnual,
          quarterlyPredictions: transformedUserQuarterly,
          systemAnnualPredictions: transformedSystemAnnual,
          systemQuarterlyPredictions: transformedSystemQuarterly,
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
          isInitialized: true,
          isFetching: false,
          activeDataFilter: initialFilter,
          // Update user pagination
          annualPagination: {
            currentPage: 1,
            totalPages: userAnnualMeta?.pages || 1,
            totalItems: userAnnualMeta?.total || transformedUserAnnual.length,
            pageSize: annualPagination.pageSize,
            hasMore: 1 < (userAnnualMeta?.pages || 1)
          },
          quarterlyPagination: {
            currentPage: 1,
            totalPages: userQuarterlyMeta?.pages || 1,
            totalItems: userQuarterlyMeta?.total || transformedUserQuarterly.length,
            pageSize: quarterlyPagination.pageSize,
            hasMore: 1 < (userQuarterlyMeta?.pages || 1)
          },
          // Update system pagination
          systemAnnualPagination: {
            currentPage: 1,
            totalPages: systemAnnualMeta?.pages || 1,
            totalItems: systemAnnualMeta?.total || transformedSystemAnnual.length,
            pageSize: systemAnnualPagination.pageSize,
            hasMore: 1 < (systemAnnualMeta?.pages || 1)
          },
          systemQuarterlyPagination: {
            currentPage: 1,
            totalPages: systemQuarterlyMeta?.pages || 1,
            totalItems: systemQuarterlyMeta?.total || transformedSystemQuarterly.length,
            pageSize: systemQuarterlyPagination.pageSize,
            hasMore: 1 < (systemQuarterlyMeta?.pages || 1)
          }
        })

      } catch (error) {
        const isAuthError = (error as any)?.response?.status === 401 || (error as any)?.message?.includes('unauthorized')

        if (isAuthError) {
          set({
            isLoading: false,
            error: null,
            isFetching: false
          })
        } else {
          set({
            isLoading: false,
            error: (error as any)?.message || 'Failed to fetch predictions',
            isFetching: false
          })
        }
      }
    },

    // Clean getFilteredPredictions with strict data separation
    getFilteredPredictions: (type: 'annual' | 'quarterly') => {
      const state = get()

      if (state.activeDataFilter === 'system') {
        // System tab: ONLY system/platform predictions
        return type === 'annual' ? state.systemAnnualPredictions : state.systemQuarterlyPredictions
      } else {
        // User tabs: ONLY user data, NEVER system data
        const userPredictions = type === 'annual' ? state.annualPredictions : state.quarterlyPredictions

        // Filter based on specific user data filter
        switch (state.activeDataFilter) {
          case 'personal':
            return userPredictions.filter(p => p.organization_access === 'personal')
          case 'organization':
            return userPredictions.filter(p => p.organization_access === 'organization')
          case 'all':
            return userPredictions // All user data (personal + organization)
          default:
            return userPredictions
        }
      }
    },

    getDefaultFilterForUser: (user: any) => {
      if (!user) return 'personal'
      
      // Super admin: system data only
      if (user.role === 'super_admin') return 'system'
      // Tenant admin: organization data
      if (user.role === 'tenant_admin') return 'organization'
      // Org admin/members: organization data
      if (user.role === 'org_admin' || user.role === 'org_member') return 'organization'
      // Default: personal
      return 'personal'
    },

    setDataFilter: (filter: string) => {
      const authStore = useAuthStore.getState()
      const user = authStore.user
      
      // Super admin can only access 'system' data
      if (user?.role === 'super_admin' && filter !== 'system') {
        filter = 'system'
      }
      
      set({ activeDataFilter: filter })
    },

    // Add prediction to the appropriate store when user creates new prediction
    addPrediction: (prediction: Prediction, type: 'annual' | 'quarterly') => {
      const state = get()

      if (prediction.organization_access === 'system') {
        // Add to system predictions
        if (type === 'annual') {
          set({ systemAnnualPredictions: [prediction, ...state.systemAnnualPredictions] })
        } else {
          set({ systemQuarterlyPredictions: [prediction, ...state.systemQuarterlyPredictions] })
        }
      } else {
        // Add to user predictions
        if (type === 'annual') {
          set({ annualPredictions: [prediction, ...state.annualPredictions] })
        } else {
          set({ quarterlyPredictions: [prediction, ...state.quarterlyPredictions] })
        }
      }
    },

    // Replace prediction when editing
    replacePrediction: (prediction: Prediction, type: 'annual' | 'quarterly', tempId: string) => {
      const state = get()

      if (prediction.organization_access === 'system') {
        // Replace in system predictions
        if (type === 'annual') {
          set({
            systemAnnualPredictions: state.systemAnnualPredictions.map(p =>
              p.id === tempId ? prediction : p
            )
          })
        } else {
          set({
            systemQuarterlyPredictions: state.systemQuarterlyPredictions.map(p =>
              p.id === tempId ? prediction : p
            )
          })
        }
      } else {
        // Replace in user predictions
        if (type === 'annual') {
          set({
            annualPredictions: state.annualPredictions.map(p =>
              p.id === tempId ? prediction : p
            )
          })
        } else {
          set({
            quarterlyPredictions: state.quarterlyPredictions.map(p =>
              p.id === tempId ? prediction : p
            )
          })
        }
      }
    },

    // Remove prediction from both stores
    removePrediction: (predictionId: string, type: 'annual' | 'quarterly') => {
      const state = get()

      if (type === 'annual') {
        set({
          annualPredictions: state.annualPredictions.filter(p => p.id !== predictionId),
          systemAnnualPredictions: state.systemAnnualPredictions.filter(p => p.id !== predictionId)
        })
      } else {
        set({
          quarterlyPredictions: state.quarterlyPredictions.filter(p => p.id !== predictionId),
          systemQuarterlyPredictions: state.systemQuarterlyPredictions.filter(p => p.id !== predictionId)
        })
      }
    },

    // Utility functions (unchanged)
    getPredictionProbability: (prediction: Prediction) => {
      return prediction.default_probability ||
        prediction.probability ||
        prediction.logistic_probability ||
        prediction.ensemble_probability ||
        0
    },

    getRiskBadgeColor: (riskLevel: string | undefined | null) => {
      switch (riskLevel?.toUpperCase()) {
        case 'LOW':
          return 'bg-green-100 text-green-800 border-green-200'
        case 'MEDIUM':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'HIGH':
          return 'bg-orange-100 text-orange-800 border-orange-200'
        case 'CRITICAL':
          return 'bg-red-100 text-red-800 border-red-200'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    },

    formatPredictionDate: (prediction: Prediction) => {
      if (prediction.reporting_quarter) {
        return `${prediction.reporting_quarter} ${prediction.reporting_year}`
      }
      return prediction.reporting_year || 'Unknown'
    },

    loadMorePredictions: async (type: 'annual' | 'quarterly') => {
      // Implementation for pagination - would need to be updated for separate stores
      console.log(`Loading more ${type} predictions...`)
    },

    fetchPage: async (type: 'annual' | 'quarterly', page: number) => {
      console.log(`📄 Fetching page ${page} for ${type} predictions`)

      const { activeDataFilter } = get()
      const { user } = useAuthStore.getState()

      if (!user) {
        console.error('No user found for fetchPage')
        return
      }

      try {
        set({ isFetching: true, error: null })

        // Determine which pagination object to update and which API to call
        const isSystemData = activeDataFilter === 'system'

        let response: any
        let paginationKey: keyof PredictionsState
        let predictionKey: keyof PredictionsState

        if (type === 'annual') {
          paginationKey = isSystemData ? 'systemAnnualPagination' : 'annualPagination'
          predictionKey = isSystemData ? 'systemAnnualPredictions' : 'annualPredictions'
          const pageSize = isSystemData ? 20 : 10

          if (isSystemData) {
            response = await predictionsApi.annual.getSystemAnnualPredictions({
              page,
              size: pageSize
            })
          } else {
            response = await predictionsApi.annual.getAnnualPredictions({
              page,
              size: pageSize
            })
          }
        } else {
          paginationKey = isSystemData ? 'systemQuarterlyPagination' : 'quarterlyPagination'
          predictionKey = isSystemData ? 'systemQuarterlyPredictions' : 'quarterlyPredictions'
          const pageSize = isSystemData ? 20 : 10

          if (isSystemData) {
            response = await predictionsApi.quarterly.getSystemQuarterlyPredictions({
              page,
              size: pageSize
            })
          } else {
            response = await predictionsApi.quarterly.getQuarterlyPredictions({
              page,
              size: pageSize
            })
          }
        }

        // Handle response - check if it's paginated response format
        const predictions = response.data || []
        const totalPages = response.pages || Math.ceil((response.total || predictions.length) / (isSystemData ? 20 : 10))
        const totalItems = response.total || predictions.length

        // Update the specific data array and pagination info
        set((state) => {
          const updateObj: Partial<PredictionsState> = {}
          const currentPredictions = state[predictionKey] as Prediction[] || []

          // For batch loading: append new data to existing data
          // Remove duplicates by filtering out predictions with same ID
          const existingIds = new Set(currentPredictions.map(p => p.id))
          const newPredictions = predictions.filter((p: Prediction) => !existingIds.has(p.id))

          // Append new predictions to existing ones
          updateObj[predictionKey] = [...currentPredictions, ...newPredictions]

          console.log(`📊 Batch loading: ${currentPredictions.length} existing + ${newPredictions.length} new = ${currentPredictions.length + newPredictions.length} total ${type} predictions`)

          // Update pagination info
          updateObj[paginationKey] = {
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            pageSize: response.size || (isSystemData ? 20 : 10),
            hasMore: page < totalPages
          } as any

          updateObj.isFetching = false
          updateObj.lastFetched = Date.now()

          return { ...state, ...updateObj }
        })

        console.log(`✅ Successfully loaded page ${page} for ${type} predictions (${isSystemData ? 'system' : 'user'} data)`)

      } catch (error) {
        console.error(`❌ Failed to fetch page ${page} for ${type}:`, error)
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch predictions',
          isFetching: false
        })
      }
    },

    // NEW: Batch loading function to load 100 predictions at once
    fetchBatch: async (type: 'annual' | 'quarterly', batchSize: number = 100) => {
      const state = get()

      // Prevent multiple simultaneous batch calls
      if (state.isFetching) {
        console.log(`📦 Batch loading already in progress for ${type} - skipping duplicate call`)
        return
      }

      console.log(`📦 Loading batch of ${batchSize} ${type} predictions`)

      const { activeDataFilter } = get()
      const { user } = useAuthStore.getState()

      if (!user) {
        console.error('No user found for fetchBatch')
        return
      }

      try {
        set({ isFetching: true, error: null })

        // Determine which data to update and which API to call
        const isSystemData = activeDataFilter === 'system'

        let response: any
        let paginationKey: keyof PredictionsState
        let predictionKey: keyof PredictionsState

        // Calculate the next page to load based on current data
        const currentData = isSystemData
          ? (type === 'annual' ? get().systemAnnualPredictions : get().systemQuarterlyPredictions)
          : (type === 'annual' ? get().annualPredictions : get().quarterlyPredictions)

        const nextPage = Math.floor(currentData.length / 10) + 1 // Assuming 10 items per page in API

        if (type === 'annual') {
          paginationKey = isSystemData ? 'systemAnnualPagination' : 'annualPagination'
          predictionKey = isSystemData ? 'systemAnnualPredictions' : 'annualPredictions'

          if (isSystemData) {
            response = await predictionsApi.annual.getSystemAnnualPredictions({
              page: nextPage,
              size: batchSize // Load full batch at once
            })
          } else {
            response = await predictionsApi.annual.getAnnualPredictions({
              page: nextPage,
              size: batchSize // Load full batch at once
            })
          }
        } else {
          paginationKey = isSystemData ? 'systemQuarterlyPagination' : 'quarterlyPagination'
          predictionKey = isSystemData ? 'systemQuarterlyPredictions' : 'quarterlyPredictions'

          if (isSystemData) {
            response = await predictionsApi.quarterly.getSystemQuarterlyPredictions({
              page: nextPage,
              size: batchSize // Load full batch at once
            })
          } else {
            response = await predictionsApi.quarterly.getQuarterlyPredictions({
              page: nextPage,
              size: batchSize // Load full batch at once
            })
          }
        }

        // Handle response
        const predictions = response.data || []
        const totalPages = response.pages || Math.ceil((response.total || predictions.length) / batchSize)
        const totalItems = response.total || predictions.length

        // Update the specific data array and pagination info
        set((state) => {
          const updateObj: Partial<PredictionsState> = {}
          const currentPredictions = state[predictionKey] as Prediction[] || []

          // For batch loading: append new data to existing data
          // Remove duplicates by filtering out predictions with same ID
          const existingIds = new Set(currentPredictions.map(p => p.id))
          const newPredictions = predictions.filter((p: Prediction) => !existingIds.has(p.id))

          // Append new predictions to existing ones
          updateObj[predictionKey] = [...currentPredictions, ...newPredictions]

          console.log(`📦 BATCH LOADING: ${currentPredictions.length} existing + ${newPredictions.length} new = ${currentPredictions.length + newPredictions.length} total ${type} predictions`)

          // Update pagination info
          updateObj[paginationKey] = {
            currentPage: nextPage,
            totalPages: totalPages,
            totalItems: totalItems,
            pageSize: batchSize,
            hasMore: (currentPredictions.length + newPredictions.length) < totalItems
          } as any

          updateObj.isFetching = false
          updateObj.lastFetched = Date.now()

          return { ...state, ...updateObj }
        })

        console.log(`✅ Successfully loaded batch of ${predictions.length} ${type} predictions (${isSystemData ? 'system' : 'user'} data)`)

      } catch (error) {
        console.error(`❌ Failed to fetch batch for ${type}:`, error)
        set({
          error: error instanceof Error ? error.message : 'Failed to load batch of predictions',
          isFetching: false
        })
      }
    },

    refetchPredictions: async () => {
      await get().fetchPredictions(true)
    },

    invalidateCache: () => {
      set({
        lastFetched: null,
        isInitialized: false
      })
    },

    clearError: () => set({ error: null }),

    // Smart pagination methods
    setSmartPageSize: (type: 'annual' | 'quarterly', pageSize: number) => {
      set((state) => ({
        smartPagination: {
          ...state.smartPagination,
          [type]: {
            ...state.smartPagination[type],
            pageSize,
            currentPage: 1 // Reset to first page when changing page size
          }
        }
      }))
    },

    setSmartCurrentPage: (type: 'annual' | 'quarterly', page: number) => {
      set((state) => ({
        smartPagination: {
          ...state.smartPagination,
          [type]: {
            ...state.smartPagination[type],
            currentPage: page
          }
        }
      }))
    },

    getSmartPaginatedData: (type: 'annual' | 'quarterly') => {
      const state = get()
      const smartPag = state.smartPagination[type]
      const data = type === 'annual' ? state.annualPredictions : state.quarterlyPredictions

      const startIndex = (smartPag.currentPage - 1) * smartPag.pageSize
      const endIndex = startIndex + smartPag.pageSize

      return data.slice(startIndex, endIndex)
    },

    loadMoreDataIfNeeded: async (type: 'annual' | 'quarterly', page: number) => {
      const state = get()
      const smartPag = state.smartPagination[type]
      const requiredEndIndex = page * smartPag.pageSize

      if (requiredEndIndex > smartPag.loadedItems && smartPag.loadedItems < smartPag.totalItems) {
        console.log(`🔄 Loading more ${type} data for smart pagination...`)
        // This would trigger API call to load next batch
        await get().fetchPredictions()
      }
    },

    initializeSmartPaginationFromStats: (annualTotal: number, quarterlyTotal: number) => {
      set((state) => ({
        smartPagination: {
          ...state.smartPagination,
          annual: {
            ...state.smartPagination.annual,
            totalItems: annualTotal
          },
          quarterly: {
            ...state.smartPagination.quarterly,
            totalItems: quarterlyTotal
          }
        }
      }))
    },

    reset: () => set({
      annualPredictions: [],
      quarterlyPredictions: [],
      systemAnnualPredictions: [],
      systemQuarterlyPredictions: [],
      isLoading: false,
      error: null,
      lastFetched: null,
      isInitialized: false,
      isFetching: false,
      activeDataFilter: 'system',

      // Reset smart pagination
      smartPagination: {
        annual: {
          currentPage: 1,
          pageSize: 10,
          totalItems: 0,
          loadedItems: 0,
          hasLoadedInitialBatch: false
        },
        quarterly: {
          currentPage: 1,
          pageSize: 10,
          totalItems: 0,
          loadedItems: 0,
          hasLoadedInitialBatch: false
        },
        systemAnnual: {
          currentPage: 1,
          pageSize: 10,
          totalItems: 0,
          loadedItems: 0,
          hasLoadedInitialBatch: false
        },
        systemQuarterly: {
          currentPage: 1,
          pageSize: 10,
          totalItems: 0,
          loadedItems: 0,
          hasLoadedInitialBatch: false
        }
      },

      annualPagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        pageSize: 100,
        hasMore: false
      },
      quarterlyPagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        pageSize: 100,
        hasMore: false
      },
      systemAnnualPagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        pageSize: 100,
        hasMore: false
      },
      systemQuarterlyPagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        pageSize: 100,
        hasMore: false
      }
    })
  }
})
