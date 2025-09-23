'use client'

import { create } from 'zustand'
import { predictionsApi } from '@/lib/api/predictions'
import { dashboardApi } from '@/lib/api/dashboard'
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

  // Pagination state
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

  // Data access filter state  
  activeDataFilter: string // 'personal', 'organization', 'system', or 'all' for viewing

  // Actions
  fetchPredictions: (forceRefresh?: boolean) => Promise<void>
  loadMorePredictions: (type: 'annual' | 'quarterly') => Promise<void>
  fetchPage: (type: 'annual' | 'quarterly', page: number) => Promise<void>
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
  // Set up minimal event listeners - avoid automatic fetching
  if (typeof window !== 'undefined') {
    // Only listen for logout to clear data
    window.addEventListener('auth-logout', () => {
      console.log('🔓 Logout detected - clearing prediction data')
      get().reset()
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

    // Initial pagination state - fetch more data initially to ensure we get both user and platform data
    annualPagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      pageSize: 200, // Fetch 200 items initially to get comprehensive data coverage
      hasMore: false
    },
    quarterlyPagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      pageSize: 200, // Fetch 200 items initially to get comprehensive data coverage
      hasMore: false
    },


    fetchPredictions: async (forceRefresh = false) => {
      const state = get()

      console.log('🚀 fetchPredictions called:', {
        forceRefresh,
        isFetching: state.isFetching,
        isInitialized: state.isInitialized,
        hasAnnual: state.annualPredictions.length,
        hasQuarterly: state.quarterlyPredictions.length,
        lastFetched: state.lastFetched ? new Date(state.lastFetched).toISOString() : 'never'
      })

      // Prevent multiple simultaneous calls
      if (state.isFetching) {
        console.log('📦 Predictions already being fetched - skipping duplicate call')
        return
      }

      // Don't fetch if we already have recent data and app is initialized, unless forcing refresh
      if (!forceRefresh && state.isInitialized && state.lastFetched && Date.now() - state.lastFetched < 30 * 60 * 1000) {
        console.log('📋 Using cached predictions data (less than 30 min old) - no API call needed')
        return
      }

      console.log('� Making API calls to fetch predictions...')
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

        // Get pagination settings
        const { annualPagination, quarterlyPagination } = get()

        const [annualResponse, quarterlyResponse] = await Promise.all([
          predictionsApi.annual.getAnnualPredictions({
            page: 1, // Always start from page 1 for fresh fetch
            size: annualPagination.pageSize
          }),
          predictionsApi.quarterly.getQuarterlyPredictions({
            page: 1, // Always start from page 1 for fresh fetch
            size: quarterlyPagination.pageSize
          })
        ])

        // Handle the new API response structure with predictions array and pagination info
        const annualData = annualResponse?.data?.items || annualResponse?.data?.predictions || annualResponse?.data || []
        const quarterlyData = quarterlyResponse?.data?.items || quarterlyResponse?.data?.predictions || quarterlyResponse?.data || []

        // Get pagination info from response
        const annualMeta = annualResponse?.data
        const quarterlyMeta = quarterlyResponse?.data

        console.log('Raw annual predictions data:', annualData)
        console.log("****")
        console.log('Raw quarterly predictions data:', quarterlyData)

        // Transform annual predictions - NO ROLE FILTERING, only data transformation
        let annualPredictions = Array.isArray(annualData) ? annualData.map((pred: any) => {
          console.log('Transforming annual prediction:', pred)

          // Properly map organization_access from API response
          let organization_access = pred.access_level || pred.organization_access || 'personal'

          // For tenant admin, map based on actual data relationships
          if (user.role === 'tenant_admin' && pred.tenant_id === user.tenant_id) {
            if (pred.organization_id && tenantOrganizations.some(org => org.id === pred.organization_id)) {
              organization_access = 'organization'
            } else if (pred.created_by === user.id) {
              organization_access = 'personal'
            }
          }

          // For org users, map based on organization relationships
          if ((user.role === 'org_admin' || user.role === 'org_member') && user.organization_id) {
            if (pred.organization_id === user.organization_id) {
              organization_access = 'organization'
            } else if (pred.created_by === user.id) {
              organization_access = 'personal'
            }
          }

          return {
            ...pred,
            // Add computed fields for backward compatibility
            default_probability: pred.probability || 0,
            risk_category: pred.risk_level,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            // Use properly mapped organization_access
            organization_access,
            // Map financial ratios to legacy format for annual predictions
            financial_ratios: {
              ltdtc: pred.long_term_debt_to_total_capital,
              roa: pred.return_on_assets,
              ebitint: pred.ebit_to_interest_expense
            }
          }
        }) : []

        // Transform quarterly predictions - NO ROLE FILTERING, only data transformation
        let quarterlyPredictions = Array.isArray(quarterlyData) ? quarterlyData.map((pred: any) => {
          console.log('Transforming quarterly prediction:', pred)

          // Properly map organization_access from API response
          let organization_access = pred.access_level || pred.organization_access || 'personal'

          // For tenant admin, map based on actual data relationships
          if (user.role === 'tenant_admin' && pred.tenant_id === user.tenant_id) {
            if (pred.organization_id && tenantOrganizations.some(org => org.id === pred.organization_id)) {
              organization_access = 'organization'
            } else if (pred.created_by === user.id) {
              organization_access = 'personal'
            }
          }

          // For org users, map based on organization relationships
          if ((user.role === 'org_admin' || user.role === 'org_member') && user.organization_id) {
            if (pred.organization_id === user.organization_id) {
              organization_access = 'organization'
            } else if (pred.created_by === user.id) {
              organization_access = 'personal'
            }
          }

          return {
            ...pred,
            // Add computed fields for backward compatibility
            default_probability: pred.logistic_probability || 0,
            risk_category: pred.risk_level,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            reporting_quarter: pred.reporting_quarter?.toUpperCase() || "Q1",
            // Use properly mapped organization_access
            organization_access,
            // Map financial ratios to legacy format for quarterly predictions
            financial_ratios: {
              ltdtc: pred.long_term_debt_to_total_capital,
              sga: pred.sga_margin,
              roa: pred.return_on_capital,
              debt_to_ebitda: pred.total_debt_to_ebitda,
            }
          }
        }) : []

        // NO ROLE-BASED FILTERING - data transformation already handled organization_access properly
        console.log("quarterly prediction", quarterlyPredictions)
        console.log("annual predictions after transformation:", annualPredictions)
        console.log(`✅ Loaded ${annualPredictions.length} annual and ${quarterlyPredictions.length} quarterly predictions`)

        // Log access levels for debugging
        console.log('Annual predictions access levels:', annualPredictions.map(p => ({ id: p.id, company: p.company_symbol, access: p.organization_access })))
        console.log('Quarterly predictions access levels:', quarterlyPredictions.map(p => ({ id: p.id, company: p.company_symbol, access: p.organization_access })))

        // Calculate proper pagination totals based on dashboard stats instead of just API response
        const calculatePaginationTotals = (meta: any, currentData: any[]) => {
          // Try to get dashboard stats to calculate real totals
          const dashboardStatsStore = require('@/lib/stores/dashboard-stats-store').useDashboardStatsStore.getState()
          const dashboardStats = dashboardStatsStore.stats

          let realTotalPredictions = meta?.total || currentData.length

          // Use dashboard stats for more accurate totals if available
          if (dashboardStats) {
            const state = get()
            const isShowingPlatform = state.activeDataFilter === 'system'

            if (isShowingPlatform && dashboardStats.platform_statistics) {
              // Platform tab: use platform statistics total
              realTotalPredictions = dashboardStats.platform_statistics.total_predictions || realTotalPredictions
            } else if (!isShowingPlatform && dashboardStats.user_dashboard) {
              // User tabs: use user dashboard total
              realTotalPredictions = dashboardStats.user_dashboard.total_predictions || realTotalPredictions
            }
          }

          console.log(`📊 Pagination calculation:`, {
            apiMetaTotal: meta?.total,
            currentDataLength: currentData.length,
            dashboardTotal: realTotalPredictions,
            activeDataFilter: get().activeDataFilter
          })

          return {
            totalItems: realTotalPredictions,
            totalPages: Math.ceil(realTotalPredictions / (meta?.size || 200)),
            hasMore: currentData.length < realTotalPredictions
          }
        }

        const annualPaginationData = calculatePaginationTotals(annualMeta, annualPredictions)
        const quarterlyPaginationData = calculatePaginationTotals(quarterlyMeta, quarterlyPredictions)

        set({
          annualPredictions,
          quarterlyPredictions,
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
          isInitialized: true,
          isFetching: false,
          // Update pagination state with dashboard-aware totals
          annualPagination: {
            currentPage: 1,
            totalPages: annualPaginationData.totalPages,
            totalItems: annualPaginationData.totalItems,
            pageSize: annualPagination.pageSize,
            hasMore: annualPaginationData.hasMore
          },
          quarterlyPagination: {
            currentPage: 1,
            totalPages: quarterlyPaginationData.totalPages,
            totalItems: quarterlyPaginationData.totalItems,
            pageSize: quarterlyPagination.pageSize,
            hasMore: quarterlyPaginationData.hasMore
          }
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

    loadMorePredictions: async (type: 'annual' | 'quarterly') => {
      const state = get()

      // Prevent multiple simultaneous calls
      if (state.isFetching) {
        console.log('📦 Predictions already being fetched - skipping load more call')
        return
      }

      const pagination = type === 'annual' ? state.annualPagination : state.quarterlyPagination

      // Check if there are more pages to load
      if (!pagination.hasMore) {
        console.log(`📋 No more ${type} predictions to load`)
        return
      }

      console.log(`🚀 Loading more ${type} predictions (page ${pagination.currentPage + 1})...`)
      set({ isFetching: true, error: null })

      try {
        const authStore = useAuthStore.getState()
        const user = authStore.user

        if (!user) {
          set({ isFetching: false, error: 'User not authenticated' })
          return
        }

        const nextPage = pagination.currentPage + 1
        const apiCall = type === 'annual'
          ? predictionsApi.annual.getAnnualPredictions({ page: nextPage, size: pagination.pageSize })
          : predictionsApi.quarterly.getQuarterlyPredictions({ page: nextPage, size: pagination.pageSize })

        const response = await apiCall
        const newData = response?.data?.items || response?.data?.predictions || response?.data || []
        const meta = response?.data

        // Transform new predictions same as in fetchPredictions
        let newPredictions = Array.isArray(newData) ? newData.map((pred: any) => {
          if (type === 'annual') {
            return {
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
            }
          } else {
            return {
              ...pred,
              default_probability: pred.ensemble_probability || pred.logistic_probability || pred.gbm_probability || 0,
              risk_category: pred.risk_level,
              reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
              reporting_quarter: pred.reporting_quarter?.toString() || 'Q1',
              organization_access: pred.access_level || pred.organization_access || 'personal'
            }
          }
        }) : []

        // Apply same filtering logic as fetchPredictions
        if (user.role === 'tenant_admin' && user.tenant_id) {
          // Get tenant organizations (you might want to cache this)
          let orgIds: string[] = []
          try {
            const orgResponse = await organizationsApi.list({
              tenant_id: user.tenant_id,
              page: 1,
              limit: 1000
            })
            if (orgResponse.success) {
              orgIds = (orgResponse.data?.organizations || []).map((org: any) => org.id)
            }
          } catch (error) {
            console.warn('⚠️ Failed to fetch tenant organizations for load more:', error)
          }

          newPredictions = newPredictions.filter(p =>
            // Include tenant's personal data
            (p.organization_access === 'personal' && p.created_by === user.id) ||
            // Include organization data for tenant's organizations
            (p.organization_access === 'organization' && p.organization_id && orgIds.includes(p.organization_id)) ||
            // Include system data (but will be filtered later based on activeDataFilter)
            p.organization_access === 'system'
          )
        } else if ((user.role === 'org_admin' || user.role === 'org_member') && user.organization_id) {
          newPredictions = newPredictions.filter(p =>
            // Include user's personal data
            (p.organization_access === 'personal' && p.created_by === user.id) ||
            // Include organization data
            (p.organization_access === 'organization' && p.organization_id === user.organization_id) ||
            // Include system data (but will be filtered later based on activeDataFilter)
            p.organization_access === 'system'
          )
        }

        console.log(`✅ Loaded ${newPredictions.length} more ${type} predictions`)

        // Update state with new predictions and pagination info
        set({
          [type === 'annual' ? 'annualPredictions' : 'quarterlyPredictions']: [
            ...(type === 'annual' ? state.annualPredictions : state.quarterlyPredictions),
            ...newPredictions
          ],
          [`${type}Pagination`]: {
            currentPage: nextPage,
            totalPages: meta?.pages || pagination.totalPages,
            totalItems: meta?.total || pagination.totalItems,
            pageSize: pagination.pageSize,
            hasMore: nextPage < (meta?.pages || pagination.totalPages)
          },
          isFetching: false
        })
      } catch (error: any) {
        console.error(`Failed to load more ${type} predictions:`, error)
        set({
          isFetching: false,
          error: error.message || `Failed to load more ${type} predictions`
        })
      }
    },

    fetchPage: async (type: 'annual' | 'quarterly', page: number) => {
      const state = get()

      // Prevent multiple simultaneous calls
      if (state.isFetching) {
        console.log('📦 Predictions already being fetched - skipping page fetch call')
        return
      }

      console.log(`🚀 Fetching ${type} predictions page ${page}...`)
      set({ isFetching: true, error: null })

      try {
        // Get current user from auth store
        const authStore = useAuthStore.getState()
        const user = authStore.user

        if (!user) {
          set({
            isFetching: false,
            error: 'User not authenticated'
          })
          return
        }

        const pagination = type === 'annual' ? state.annualPagination : state.quarterlyPagination

        // Use 10 for first page, 20 for subsequent pages
        const pageSize = page === 1 ? 10 : 20

        console.log(`📄 Page ${page} with size ${pageSize}`)

        // Make API call to get specific page
        const response = type === 'annual'
          ? await predictionsApi.annual.getAnnualPredictions({ page, size: pageSize })
          : await predictionsApi.quarterly.getQuarterlyPredictions({ page, size: pageSize })

        if (!response.success) {
          throw new Error(typeof response.error === 'string' ? response.error : `Failed to fetch ${type} predictions`)
        }

        let predictions = response.data?.predictions || []
        const meta = response.data?.meta

        // Apply role-based filtering (same as other functions)
        if (user.role === 'tenant_admin' && user.tenant_id) {
          let orgIds: string[] = []
          try {
            const orgResponse = await organizationsApi.list({
              tenant_id: user.tenant_id,
              page: 1,
              limit: 1000
            })
            if (orgResponse.success) {
              orgIds = (orgResponse.data?.organizations || []).map((org: any) => org.id)
            }
          } catch (error) {
            console.warn('⚠️ Failed to fetch tenant organizations for page fetch:', error)
          }

          predictions = predictions.filter((p: any) =>
            // Include tenant's personal data
            (p.organization_access === 'personal' && p.created_by === user.id) ||
            // Include organization data for tenant's organizations
            (p.organization_access === 'organization' && p.organization_id && orgIds.includes(p.organization_id)) ||
            // Include system data (but will be filtered later based on activeDataFilter)
            p.organization_access === 'system'
          )
        } else if ((user.role === 'org_admin' || user.role === 'org_member') && user.organization_id) {
          predictions = predictions.filter((p: any) =>
            // Include user's personal data
            (p.organization_access === 'personal' && p.created_by === user.id) ||
            // Include organization data
            (p.organization_access === 'organization' && p.organization_id === user.organization_id) ||
            // Include system data (but will be filtered later based on activeDataFilter)
            p.organization_access === 'system'
          )
        }

        console.log(`✅ Fetched ${predictions.length} ${type} predictions for page ${page}`)
        console.log(`📊 API Response sample:`, predictions.slice(0, 2).map((p: any) => ({
          company: p.company_symbol,
          access: p.organization_access,
          org_name: p.organization_name,
          org_id: p.organization_id
        })))

        // Update state with page predictions (replace, not append)
        set({
          [type === 'annual' ? 'annualPredictions' : 'quarterlyPredictions']: predictions,
          [`${type}Pagination`]: {
            currentPage: page,
            totalPages: meta?.pages || pagination.totalPages,
            totalItems: meta?.total || pagination.totalItems,
            pageSize: pageSize, // Update pageSize for this page
            hasMore: page < (meta?.pages || pagination.totalPages)
          },
          isFetching: false
        })
      } catch (error: any) {
        console.error(`Failed to fetch ${type} predictions page ${page}:`, error)
        set({
          isFetching: false,
          error: error.message || `Failed to fetch ${type} predictions`
        })
      }
    },

    refetchPredictions: async () => {
      set({ lastFetched: null, isInitialized: false }) // Force refetch and reset initialization
      return get().fetchPredictions(true)
    },

    invalidateCache: () => {
      console.log('🗑️ Invalidating predictions cache - will fetch on next request')
      set({ lastFetched: null, isInitialized: false })
      // Don't automatically fetch - let components request fresh data when needed
    },

    clearError: () => set({ error: null }),

    reset: () => set({
      annualPredictions: [],
      quarterlyPredictions: [],
      isLoading: false,
      error: null,
      lastFetched: null,
      isInitialized: false,
      isFetching: false,
      // Reset pagination state
      annualPagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        pageSize: 10, // Reset to 10 for first load
        hasMore: false
      },
      quarterlyPagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        pageSize: 10, // Reset to 10 for first load
        hasMore: false
      }
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

      console.log(`🔍 FILTERING ${type} predictions:`)
      console.log(`   - activeDataFilter: "${state.activeDataFilter}"`)
      console.log(`   - Total predictions: ${predictions.length}`)
      console.log(`   - Raw prediction sample:`, predictions.slice(0, 2).map(p => ({
        id: p.id,
        company: p.company_symbol,
        access: p.organization_access,
        org_id: p.organization_id
      })))

      // STRICT Data Source Separation (matching dashboard stats logic):
      let filtered
      if (state.activeDataFilter === 'system') {
        // Platform tab: ONLY system/platform predictions
        filtered = predictions.filter(p => p.organization_access === 'system')
        console.log(`   🔵 Platform filter: ${filtered.length} system predictions`)
      } else {
        // User tabs (personal/organization): ONLY user data, NEVER system data
        filtered = predictions.filter(p =>
          p.organization_access === 'personal' ||
          p.organization_access === 'organization'
        )
        console.log(`   🟢 User filter: ${filtered.length} personal/org predictions`)
      }

      console.log(`   - Filtered results: ${filtered.length} predictions`)
      console.log(`   - Filtered sample:`, filtered.slice(0, 2).map(p => ({
        company: p.company_symbol,
        access: p.organization_access
      })))

      return filtered
    },

    getDefaultFilterForUser: (user: any) => {
      if (!user) {
        console.log('🔍 No user, returning default filter: personal')
        return 'personal'
      }

      console.log('🔍 Getting default filter for user role:', user.role)

      // Normal user: start with their personal data
      if (user.role === 'user') {
        return 'personal'
      }

      // Super admin: start with system data to see platform overview
      if (user.role === 'super_admin') {
        return 'system'
      }

      // Tenant admin: start with organization data (their managed organizations)
      if (user.role === 'tenant_admin') {
        return 'organization'
      }

      // Org admin/members: start with their organization data (NOT system)
      if (user.role === 'org_admin' || user.role === 'org_member') {
        return 'organization'
      }

      console.log('🔍 Default filter fallback: personal')
      return 'personal'
    }
  }
})
