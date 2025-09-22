'use client'

import { create } from 'zustand'
import { predictionsApi } from '@/lib/api/predictions'
import { organizationsApi } from '@/lib/api/organizations'
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
  annualPredictions: Prediction[]
  quarterlyPredictions: Prediction[]
  isLoading: boolean
  error: string | null
  lastFetched: number | null
  isInitialized: boolean
  isFetching: boolean // Add flag to prevent multiple simultaneous calls

  // Data access filter state  
  activeDataFilter: string // 'personal', 'organization', 'system', or 'all' for viewing

  // Actions
  fetchPredictions: (forceRefresh?: boolean) => Promise<void>
  refetchPredictions: () => Promise<void>
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

export const usePredictionsStore = create<PredictionsState>((set, get) => {
  // Set up event listeners for automatic refresh and auth events
  if (typeof window !== 'undefined') {
    window.addEventListener('predictions-updated', () => {
      console.log('🔄 Predictions updated - auto-refreshing data...')
      get().invalidateCache()
    })

    // Listen for successful login to refresh data
    window.addEventListener('auth-login-success', () => {
      console.log('🔑 Login successful - forcing prediction refresh')
      setTimeout(() => {
        get().invalidateCache()
      }, 200) // Small delay to ensure API client has tokens
    })

    // Listen for logout to clear data
    window.addEventListener('auth-logout', () => {
      console.log('🔓 Logout detected - clearing prediction data')
      get().reset()
    })

    // Listen for token refresh success to retry failed requests
    window.addEventListener('auth-token-refreshed', () => {
      console.log('🔄 Token refreshed - retrying prediction fetch if needed')
      const state = get()
      if (state.error && state.error.includes('Authentication issue')) {
        setTimeout(() => {
          get().fetchPredictions(true)
        }, 500)
      }
    })
  }

  return {
    annualPredictions: [],
    quarterlyPredictions: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    isInitialized: false,
    isFetching: false,
    activeDataFilter: 'system', // Start with 'system' for user role


    fetchPredictions: async (forceRefresh = false) => {
      const state = get()

      // Prevent multiple simultaneous calls
      if (state.isFetching) {
        console.log('📦 Predictions already being fetched - skipping duplicate call')
        return
      }

      // Don't fetch if we already have recent data (less than 30 minutes old) and app is initialized, unless forcing refresh
      if (!forceRefresh && state.isInitialized && state.lastFetched && Date.now() - state.lastFetched < 30 * 60 * 1000) {
        console.log('📋 Using cached predictions data - no API call needed')
        return
      }

      console.log('🚀 Fetching fresh predictions data from API...')
      set({ isLoading: true, error: null, isFetching: true })

      try {
        // Get current user from auth store
        const authStore = useAuthStore.getState()
        const user = authStore.user

        if (!user) {
          set({
            isLoading: false,
            error: 'User not authenticated',
            isFetching: false
          })
          return
        }

        // For tenant admins, get their organizations first to filter predictions
        let tenantOrganizations: any[] = []
        if (user.role === 'tenant_admin' && user.tenant_id) {
          try {
            console.log('🏢 Fetching organizations for tenant admin:', user.tenant_id)
            const orgResponse = await organizationsApi.list({
              tenant_id: user.tenant_id,
              page: 1,
              limit: 1000
            })
            if (orgResponse.success) {
              tenantOrganizations = orgResponse.data?.organizations || []
              console.log('🏢 Found tenant organizations:', tenantOrganizations.length)
            }
          } catch (error) {
            console.warn('⚠️ Failed to fetch tenant organizations:', error)
          }
        }

        const [annualResponse, quarterlyResponse] = await Promise.all([
          predictionsApi.annual.getAnnualPredictions({ page: 1, size: 100 }),
          predictionsApi.quarterly.getQuarterlyPredictions({ page: 1, size: 100 })
        ])

        // Handle the new API response structure with predictions array
        const annualData = annualResponse?.data?.predictions || annualResponse?.data || []
        const quarterlyData = quarterlyResponse?.data?.predictions || quarterlyResponse?.data || []

        console.log('Raw annual predictions data:', annualData)
        console.log("****")
        console.log('Raw quarterly predictions data:', quarterlyData)

        // Transform annual predictions
        let annualPredictions = Array.isArray(annualData) ? annualData.map((pred: any) => {
          console.log('Transforming annual prediction:', pred)
          return {
            ...pred,
            // Add computed fields for backward compatibility
            default_probability: pred.probability || 0,
            risk_category: pred.risk_level,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            // Ensure organization_access is properly mapped from the new backend
            organization_access: pred.access_level || pred.organization_access || 'personal',
            // Map financial ratios to legacy format for annual predictions
            financial_ratios: {
              ltdtc: pred.long_term_debt_to_total_capital,
              roa: pred.return_on_assets,
              ebitint: pred.ebit_to_interest_expense
            }
          }
        }) : []

        // Transform quarterly predictions  
        let quarterlyPredictions = Array.isArray(quarterlyData) ? quarterlyData.map((pred: any) => {
          console.log('Transforming quarterly prediction:', pred)
          return {
            ...pred,
            // Add computed fields for backward compatibility
            default_probability: pred.logistic_probability || 0,
            risk_category: pred.risk_level,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            reporting_quarter: pred.reporting_quarter?.toUpperCase() || "Q1",
            // Ensure organization_access is properly mapped from the new backend
            organization_access: pred.access_level || pred.organization_access || 'personal',
            // Map financial ratios to legacy format for quarterly predictions
            financial_ratios: {
              ltdtc: pred.long_term_debt_to_total_capital,
              sga: pred.sga_margin,
              roa: pred.return_on_capital,
              debt_to_ebitda: pred.total_debt_to_ebitda,
            }
          }
        }) : []

        // Filter predictions based on user role - but ALWAYS include system data
        if (user.role === 'tenant_admin' && tenantOrganizations.length > 0) {
          const orgIds = tenantOrganizations.map(org => org.id)
          console.log('🔍 Filtering predictions for tenant admin organizations:', orgIds)

          annualPredictions = annualPredictions.filter(p =>
            // Always include system data
            p.organization_access === 'system' ||
            // Include tenant's data
            p.tenant_id === user.tenant_id ||
            // Include organization data for tenant's organizations
            (p.organization_id && orgIds.includes(p.organization_id))
          )

          quarterlyPredictions = quarterlyPredictions.filter(p =>
            // Always include system data
            p.organization_access === 'system' ||
            // Include tenant's data
            p.tenant_id === user.tenant_id ||
            // Include organization data for tenant's organizations
            (p.organization_id && orgIds.includes(p.organization_id))
          )

          console.log('🔍 Filtered to tenant predictions (including system):', {
            annual: annualPredictions.length,
            quarterly: quarterlyPredictions.length
          })
        } else if (user.role === 'org_admin' || user.role === 'org_member') {
          // Filter by organization for org-level users - but keep system data
          if (user.organization_id) {
            annualPredictions = annualPredictions.filter(p =>
              // Always include system data
              p.organization_access === 'system' ||
              // Include organization data
              p.organization_id === user.organization_id
            )
            quarterlyPredictions = quarterlyPredictions.filter(p =>
              // Always include system data
              p.organization_access === 'system' ||
              // Include organization data
              p.organization_id === user.organization_id
            )
            console.log('🔍 Filtered to organization predictions (including system):', user.organization_id)
          }
        }
        // Super admin sees all predictions (no filtering)

        console.log("quarterly prediction", quarterlyPredictions)
        console.log("annual predictions after transformation:", annualPredictions)
        console.log(`✅ Loaded ${annualPredictions.length} annual and ${quarterlyPredictions.length} quarterly predictions`)

        // Log access levels for debugging
        console.log('Annual predictions access levels:', annualPredictions.map(p => ({ id: p.id, company: p.company_symbol, access: p.organization_access })))
        console.log('Quarterly predictions access levels:', quarterlyPredictions.map(p => ({ id: p.id, company: p.company_symbol, access: p.organization_access })))

        set({
          annualPredictions,
          quarterlyPredictions,
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
          isInitialized: true,
          isFetching: false
        })
      } catch (error: any) {
        console.error('Failed to fetch predictions:', error)

        // Check if this is an auth error vs other error
        const isAuthError = error?.response?.status === 401 || error?.message?.includes('unauthorized')

        if (isAuthError) {
          console.log('🔒 Auth error detected - keeping existing data, will retry after token refresh')
          // Don't clear existing data on auth errors, just mark as not loading
          set({
            isLoading: false,
            error: null, // Don't show error to user for auth issues
            isFetching: false
          })

          // Retry after a short delay to allow token refresh
          setTimeout(() => {
            console.log('🔄 Retrying prediction fetch after auth error')
            get().fetchPredictions(true)
          }, 2000)
        } else {
          // For non-auth errors, show error but keep existing data
          set({
            isLoading: false,
            error: error.message || 'Failed to fetch predictions',
            isFetching: false
          })
        }
      }
    },

    refetchPredictions: async () => {
      set({ lastFetched: null, isInitialized: false }) // Force refetch and reset initialization
      return get().fetchPredictions(true)
    },

    invalidateCache: () => {
      set({ lastFetched: null, isInitialized: false })
      get().fetchPredictions(true)
    },

    clearError: () => set({ error: null }),

    reset: () => set({
      annualPredictions: [],
      quarterlyPredictions: [],
      isLoading: false,
      error: null,
      lastFetched: null
    }),

    addPrediction: (prediction: Prediction, type: 'annual' | 'quarterly') => {
      const state = get()
      if (type === 'annual') {
        set({
          annualPredictions: [prediction, ...state.annualPredictions],
          lastFetched: Date.now()
        })
      } else {
        set({
          quarterlyPredictions: [prediction, ...state.quarterlyPredictions],
          lastFetched: Date.now()
        })
      }
      console.log(`✅ Added ${type} prediction instantly to store`)

      // IMMEDIATE: Trigger custom events for instant UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-added-optimistic', {
          detail: { type, prediction }
        }))
      }
    },

    replacePrediction: (prediction: Prediction, type: 'annual' | 'quarterly', tempId: string) => {
      const state = get()
      if (type === 'annual') {
        const updatedPredictions = state.annualPredictions.map(p =>
          p.id === tempId ? prediction : p
        )
        set({
          annualPredictions: updatedPredictions,
          lastFetched: Date.now()
        })
      } else {
        const updatedPredictions = state.quarterlyPredictions.map(p =>
          p.id === tempId ? prediction : p
        )
        set({
          quarterlyPredictions: updatedPredictions,
          lastFetched: Date.now()
        })
      }
      console.log(`🔄 Replaced temporary ${type} prediction with real data`)

      // IMMEDIATE: Trigger custom events for instant UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-replaced-real', {
          detail: { type, prediction }
        }))
      }
    },

    removePrediction: (predictionId: string, type: 'annual' | 'quarterly') => {
      const state = get()
      if (type === 'annual') {
        const updatedPredictions = state.annualPredictions.filter(p => p.id !== predictionId)
        set({
          annualPredictions: updatedPredictions,
          lastFetched: Date.now()
        })
      } else {
        const updatedPredictions = state.quarterlyPredictions.filter(p => p.id !== predictionId)
        set({
          quarterlyPredictions: updatedPredictions,
          lastFetched: Date.now()
        })
      }
      console.log(`🗑️ Removed ${type} prediction with ID: ${predictionId}`)
    },

    // Utility functions
    getPredictionProbability: (prediction: Prediction) => {
      // Return the appropriate probability based on prediction type
      return prediction.default_probability ||
        prediction.probability ||
        prediction.ensemble_probability ||
        prediction.logistic_probability ||
        prediction.gbm_probability ||
        0
    },

    getRiskBadgeColor: (riskLevel: string | undefined | null) => {
      if (!riskLevel) {
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      }

      switch (riskLevel.toUpperCase()) {
        case 'LOW':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        case 'MEDIUM':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
        case 'HIGH':
          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        case 'CRITICAL':
          return 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200'
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      }
    },

    formatPredictionDate: (prediction: Prediction) => {
      if (prediction.reporting_quarter) {
        return `${prediction.reporting_quarter.toUpperCase()} ${prediction.reporting_year}`
      }
      return `Annual ${prediction.reporting_year}`
    },

    setDataFilter: (filter: string) => {
      const state = get()
      const previousFilter = state.activeDataFilter

      set({ activeDataFilter: filter })
      console.log(`🔍 Data filter changed from ${previousFilter} to: ${filter}`)

      // Dispatch event to notify all dashboard components about filter change
      window.dispatchEvent(new CustomEvent('data-filter-changed', {
        detail: { previousFilter, newFilter: filter }
      }))

      // Don't refresh on filter change - we have all data cached
      // Just filter client-side for better performance
    },

    getFilteredPredictions: (type: 'annual' | 'quarterly') => {
      const state = get()
      const predictions = type === 'annual' ? state.annualPredictions : state.quarterlyPredictions

      console.log(`🔍 Filtering ${type} predictions with filter: ${state.activeDataFilter}`)
      console.log(`Total ${type} predictions:`, predictions.length)
      console.log(`Access levels in data:`, predictions.map(p => p.organization_access))

      // Filter based on activeDataFilter
      let filtered
      switch (state.activeDataFilter) {
        case 'personal':
          // Only personal data (no system data mixed in)
          filtered = predictions.filter(p => p.organization_access === 'personal')
          break

        case 'organization':
          // Only organization data (no system data mixed in)
          filtered = predictions.filter(p => p.organization_access === 'organization')
          break

        case 'system':
          // Only system data
          filtered = predictions.filter(p => p.organization_access === 'system')
          break

        case 'all':
          // All data (for super admin)
          filtered = predictions
          break

        default:
          // Default: show system data
          filtered = predictions.filter(p => p.organization_access === 'system')
          break
      }

      console.log(`Filtered ${type} predictions:`, filtered.length)
      console.log(`Filtered data:`, filtered.map(p => ({ id: p.id, company: p.company_symbol, access: p.organization_access })))

      return filtered
    },

    getDefaultFilterForUser: (user: any) => {
      if (!user) {
        console.log('🔍 No user, returning default filter: system')
        return 'system'
      }

      console.log('🔍 Getting default filter for user role:', user.role)

      // Normal user: start with system data (most users don't have personal data initially)
      if (user.role === 'user') {
        return 'system'
      }

      // Super admin: start with system data to see platform overview
      if (user.role === 'super_admin') {
        return 'system'
      }

      // Tenant admin: start with system data to see platform overview
      if (user.role === 'tenant_admin') {
        return 'system'
      }

      // Org admin/members: start with system data to see platform overview
      if (user.role === 'org_admin' || user.role === 'org_member') {
        return 'system'
      }

      console.log('🔍 Default filter fallback: system')
      return 'system'
    }
  }
})
