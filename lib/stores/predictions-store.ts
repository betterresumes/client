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

  // Financial ratios
  long_term_debt_to_total_capital?: number
  total_debt_to_ebitda?: number
  net_income_margin?: number
  ebit_to_interest_expense?: number
  return_on_assets?: number
  sga_margin?: number
  return_on_capital?: number

  // Probability fields
  probability?: number
  logistic_probability?: number
  gbm_probability?: number
  ensemble_probability?: number
  default_probability?: number

  // Risk assessment
  risk_level: string
  risk_category?: string
  confidence: number

  // Organization and access
  organization_id?: string | null
  organization_name?: string | null
  organization_access: string // "personal" | "organization" | "system"

  // Audit fields
  created_by: string
  created_by_email?: string
  created_at: string

  // Legacy fields
  sector?: string
  model_type?: string
  model_version?: string
  updated_at?: string
}

interface PredictionsState {
  // SEPARATE storage for user and system data - NEVER mix
  annualPredictions: Prediction[] // User predictions only
  quarterlyPredictions: Prediction[] // User predictions only
  systemAnnualPredictions: Prediction[] // System predictions only
  systemQuarterlyPredictions: Prediction[] // System predictions only

  isLoading: boolean
  error: string | null
  lastFetched: number | null
  isInitialized: boolean
  isFetching: boolean
  activeDataFilter: string // 'personal', 'organization', 'system', or 'all'

  // Basic pagination info
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
}

type PredictionsStore = PredictionsState & {
  fetchPredictions: (forceRefresh?: boolean) => Promise<void>
  refetchPredictions: () => Promise<void>
  getFilteredPredictions: (type: 'annual' | 'quarterly') => Prediction[]
  setDataFilter: (filter: string) => void
  getDefaultFilterForUser: (user: any) => string
  getPredictionProbability: (prediction: Prediction) => number
  getRiskBadgeColor: (riskLevel: string | undefined | null) => string
  formatPredictionDate: (prediction: Prediction) => string
  clearError: () => void
  reset: () => void
  invalidateCache: () => void
  addPrediction: (prediction: Prediction, type: 'annual' | 'quarterly') => void
  replacePrediction: (prediction: Prediction, type: 'annual' | 'quarterly', tempId: string) => void
  removePrediction: (predictionId: string, type: 'annual' | 'quarterly') => void

  // Basic pagination methods expected by components
  fetchPage: (type: 'annual' | 'quarterly', page: number) => Promise<void>
  fetchBatch: (type: 'annual' | 'quarterly', size: number) => Promise<void>
  setSmartPageSize: (type: 'annual' | 'quarterly', size: number) => void
  setSmartCurrentPage: (type: 'annual' | 'quarterly', page: number) => void
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
    // Initial state
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

    // Basic pagination state
    annualPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      pageSize: 10,
      hasMore: false
    },
    quarterlyPagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      pageSize: 10,
      hasMore: false
    },

    /**
     * Main fetch function - loads BOTH user and system data on first render
     * Then caches them separately for the entire application
     */
    fetchPredictions: async (forceRefresh = false) => {
      const state = get()
      const authStore = useAuthStore.getState()
      const user = authStore.user

      if (!user || state.isFetching) return

      // Always fetch both user and system data on initial load for proper caching
      const needsUserData = user.role !== 'super_admin'
      const needsSystemData = true // ALWAYS fetch system data

      // Check cache validity - 5 minutes
      const cacheValidTime = 5 * 60 * 1000
      const isCacheValid = !forceRefresh && state.isInitialized && state.lastFetched &&
        (Date.now() - state.lastFetched < cacheValidTime)

      // Use cache if valid and we have the required data
      if (isCacheValid) {
        const hasSystemData = state.systemAnnualPredictions.length > 0 && state.systemQuarterlyPredictions.length > 0
        const hasUserData = !needsUserData || (state.annualPredictions.length > 0 && state.quarterlyPredictions.length > 0)

        if (hasSystemData && hasUserData) return
      }

      set({ isLoading: true, error: null, isFetching: true })

      try {
        const apiPromises = []

        // User predictions (if not super admin)
        if (needsUserData) {
          apiPromises.push(
            predictionsApi.annual.getAnnualPredictions({ page: 1, size: 100 }),
            predictionsApi.quarterly.getQuarterlyPredictions({ page: 1, size: 100 })
          )
        } else {
          apiPromises.push(null, null) // Placeholders for super admin
        }

        // System predictions (ALWAYS fetch these)
        apiPromises.push(
          predictionsApi.annual.getSystemAnnualPredictions({ page: 1, size: 100 }),
          predictionsApi.quarterly.getSystemQuarterlyPredictions({ page: 1, size: 100 })
        )

        const [userAnnualResponse, userQuarterlyResponse, systemAnnualResponse, systemQuarterlyResponse] = await Promise.all(apiPromises)

        // Transform USER data
        let transformedUserAnnual: Prediction[] = []
        let transformedUserQuarterly: Prediction[] = []

        if (userAnnualResponse && needsUserData) {
          // API returns array directly, not wrapped in data property
          const userData = Array.isArray(userAnnualResponse) ? userAnnualResponse : (userAnnualResponse?.data || [])
          console.log('🔍 USER Annual Response - FIXED:', {
            responseType: Array.isArray(userAnnualResponse) ? 'direct array' : 'wrapped',
            itemCount: userData.length,
            firstItem: userData.length > 0 ? userData[0] : 'none'
          })

          transformedUserAnnual = userData.map((pred: any) => ({
            ...pred,
            default_probability: pred.probability || pred.default_probability || 0,
            risk_category: pred.risk_level || pred.risk_category,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            organization_access: pred.access_level || pred.organization_access || 'personal',
          }))
        }

        if (userQuarterlyResponse && needsUserData) {
          // API returns array directly, not wrapped in data property
          const userData = Array.isArray(userQuarterlyResponse) ? userQuarterlyResponse : (userQuarterlyResponse?.data || [])
          console.log('🔍 USER Quarterly Response - FIXED:', {
            responseType: Array.isArray(userQuarterlyResponse) ? 'direct array' : 'wrapped',
            itemCount: userData.length,
            firstItem: userData.length > 0 ? userData[0] : 'none'
          })

          transformedUserQuarterly = userData.map((pred: any) => ({
            ...pred,
            default_probability: pred.logistic_probability || pred.probability || pred.default_probability || 0,
            risk_category: pred.risk_level || pred.risk_category,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            reporting_quarter: pred.reporting_quarter?.toUpperCase() || "Q1",
            organization_access: pred.access_level || pred.organization_access || 'personal',
          }))
        }

        // Transform SYSTEM data (ALWAYS)
        let transformedSystemAnnual: Prediction[] = []
        let transformedSystemQuarterly: Prediction[] = []

        if (systemAnnualResponse) {
          // API returns array directly, not wrapped in data property
          const systemData = Array.isArray(systemAnnualResponse) ? systemAnnualResponse : (systemAnnualResponse?.data || [])
          console.log('🔍 SYSTEM Annual Response - FIXED:', {
            responseType: Array.isArray(systemAnnualResponse) ? 'direct array' : 'wrapped',
            itemCount: systemData.length,
            firstItem: systemData.length > 0 ? systemData[0] : 'none'
          })

          transformedSystemAnnual = systemData.map((pred: any) => ({
            ...pred,
            default_probability: pred.probability || pred.default_probability || 0,
            risk_category: pred.risk_level || pred.risk_category,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            organization_access: 'system', // ALWAYS system
          }))
        }

        if (systemQuarterlyResponse) {
          // API returns array directly, not wrapped in data property
          const systemData = Array.isArray(systemQuarterlyResponse) ? systemQuarterlyResponse : (systemQuarterlyResponse?.data || [])
          console.log('🔍 SYSTEM Quarterly Response - FIXED:', {
            responseType: Array.isArray(systemQuarterlyResponse) ? 'direct array' : 'wrapped',
            itemCount: systemData.length,
            firstItem: systemData.length > 0 ? systemData[0] : 'none'
          })

          transformedSystemQuarterly = systemData.map((pred: any) => ({
            ...pred,
            default_probability: pred.logistic_probability || pred.probability || pred.default_probability || 0,
            risk_category: pred.risk_level || pred.risk_category,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            reporting_quarter: pred.reporting_quarter?.toUpperCase() || "Q1",
            organization_access: 'system', // ALWAYS system
          }))
        }

        // Log the final transformed data counts
        console.log('🎯 Final Data Transformation Results:', {
          userAnnual: transformedUserAnnual.length,
          userQuarterly: transformedUserQuarterly.length,
          systemAnnual: transformedSystemAnnual.length,
          systemQuarterly: transformedSystemQuarterly.length,
          userRole: user?.role,
          needsUserData,
          needsSystemData
        })

        // Set proper data filter based on user role
        const initialFilter = get().getDefaultFilterForUser(user)

        // Update pagination info based on data
        const annualPaginationUpdate = {
          currentPage: 1,
          totalPages: Math.ceil((transformedUserAnnual.length + transformedSystemAnnual.length) / 10),
          totalItems: transformedUserAnnual.length + transformedSystemAnnual.length,
          pageSize: 10,
          hasMore: false
        }

        const quarterlyPaginationUpdate = {
          currentPage: 1,
          totalPages: Math.ceil((transformedUserQuarterly.length + transformedSystemQuarterly.length) / 10),
          totalItems: transformedUserQuarterly.length + transformedSystemQuarterly.length,
          pageSize: 10,
          hasMore: false
        }

        // Update state with SEPARATED data
        set({
          // User data (empty array for super admin)
          annualPredictions: transformedUserAnnual,
          quarterlyPredictions: transformedUserQuarterly,
          // System data (ALWAYS populated)
          systemAnnualPredictions: transformedSystemAnnual,
          systemQuarterlyPredictions: transformedSystemQuarterly,
          // Pagination info
          annualPagination: annualPaginationUpdate,
          quarterlyPagination: quarterlyPaginationUpdate,
          // State management
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
          isInitialized: true,
          isFetching: false,
          activeDataFilter: initialFilter,
        })

      } catch (error) {
        const isAuthError = (error as any)?.response?.status === 401

        set({
          isLoading: false,
          error: isAuthError ? null : (error as any)?.message || 'Failed to fetch predictions',
          isFetching: false
        })
      }
    },

    /**
     * Get filtered predictions based on current data filter
     * CRITICAL: This ensures data separation - user data vs system data
     */
    getFilteredPredictions: (type: 'annual' | 'quarterly') => {
      const state = get()

      console.log('🎯 getFilteredPredictions called:', {
        type,
        activeDataFilter: state.activeDataFilter,
        userAnnualCount: state.annualPredictions.length,
        userQuarterlyCount: state.quarterlyPredictions.length,
        systemAnnualCount: state.systemAnnualPredictions.length,
        systemQuarterlyCount: state.systemQuarterlyPredictions.length
      })

      if (state.activeDataFilter === 'system') {
        // Platform tab: ONLY system predictions
        const result = type === 'annual' ? state.systemAnnualPredictions : state.systemQuarterlyPredictions
        console.log('🎯 Returning SYSTEM predictions:', result.length)
        return result
      } else {
        // User tabs: ONLY user predictions, filtered by access level
        const userPredictions = type === 'annual' ? state.annualPredictions : state.quarterlyPredictions

        let filtered: Prediction[]
        switch (state.activeDataFilter) {
          case 'personal':
            filtered = userPredictions.filter(p => p.organization_access === 'personal')
            break
          case 'organization':
            filtered = userPredictions.filter(p => p.organization_access === 'organization')
            break
          case 'all':
            filtered = userPredictions // All user data (personal + organization)
            break
          default:
            filtered = userPredictions
        }

        console.log('🎯 Returning USER predictions:', {
          filter: state.activeDataFilter,
          totalUser: userPredictions.length,
          filtered: filtered.length
        })
        return filtered
      }
    },

    getDefaultFilterForUser: (user: any) => {
      if (!user) return 'personal'

      switch (user.role) {
        case 'super_admin':
          return 'system' // Super admin can ONLY see system data
        case 'tenant_admin':
          return 'organization'
        case 'org_admin':
        case 'org_member':
          return 'organization'
        case 'user':
        default:
          return 'personal'
      }
    },

    setDataFilter: (filter: string) => {
      const authStore = useAuthStore.getState()
      const user = authStore.user

      // Super admin can only access system data
      if (user?.role === 'super_admin' && filter !== 'system') {
        filter = 'system'
      }

      set({ activeDataFilter: filter })
    },

    // Add prediction to appropriate store
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

    // Replace prediction
    replacePrediction: (prediction: Prediction, type: 'annual' | 'quarterly', tempId: string) => {
      const state = get()

      if (prediction.organization_access === 'system') {
        // Replace in system predictions
        const key = type === 'annual' ? 'systemAnnualPredictions' : 'systemQuarterlyPredictions'
        set({
          [key]: state[key].map(p => p.id === tempId ? prediction : p)
        })
      } else {
        // Replace in user predictions
        const key = type === 'annual' ? 'annualPredictions' : 'quarterlyPredictions'
        set({
          [key]: state[key].map(p => p.id === tempId ? prediction : p)
        })
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

    // Utility functions
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
      annualPagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: 10,
        hasMore: false
      },
      quarterlyPagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: 10,
        hasMore: false
      }
    }),

    // Basic pagination methods (simplified implementations)
    fetchPage: async (type: 'annual' | 'quarterly', page: number) => {
      // For now, just update the current page - full implementation would fetch specific page
      const paginationKey = type === 'annual' ? 'annualPagination' : 'quarterlyPagination'
      const state = get()
      set({
        [paginationKey]: {
          ...state[paginationKey],
          currentPage: page
        }
      })
    },

    fetchBatch: async (type: 'annual' | 'quarterly', size: number) => {
      // For now, just call the main fetch function
      await get().fetchPredictions()
    },

    setSmartPageSize: (type: 'annual' | 'quarterly', size: number) => {
      const paginationKey = type === 'annual' ? 'annualPagination' : 'quarterlyPagination'
      const state = get()
      set({
        [paginationKey]: {
          ...state[paginationKey],
          pageSize: size
        }
      })
    },

    setSmartCurrentPage: (type: 'annual' | 'quarterly', page: number) => {
      const paginationKey = type === 'annual' ? 'annualPagination' : 'quarterlyPagination'
      const state = get()
      set({
        [paginationKey]: {
          ...state[paginationKey],
          currentPage: page
        }
      })
    }
  }
})