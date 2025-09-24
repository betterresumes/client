'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

  // Legacy pagination for backward compatibility
  // Separate pagination for user and system data
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
  setDataFilter: (filter: string) => void
  getDefaultFilterForUser: (user: any) => string

  // Helper method for processing predictions data  
  processAllPredictionsData: (
    userAnnualResponse: any,
    userQuarterlyResponse: any,
    systemAnnualResponse: any,
    systemQuarterlyResponse: any,
    user: any
  ) => Promise<{
    transformedUserAnnual: Prediction[]
    transformedUserQuarterly: Prediction[]
    transformedSystemAnnual: Prediction[]
    transformedSystemQuarterly: Prediction[]
  }>

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
            console.error('Failed to fetch predictions:', error)
            const isAuthError = (error as any)?.response?.status === 401 || (error as any)?.message?.includes('unauthorized')

            if (isAuthError) {
              console.log('🔒 Auth error detected - keeping existing data, will retry after token refresh')
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

        // Helper method to process all predictions data for non-super-admin users
        processAllPredictionsData: async (
          userAnnualResponse: any,
          userQuarterlyResponse: any,
          systemAnnualResponse: any,
          systemQuarterlyResponse: any,
          user: any
        ) => {
          console.log('🎯 Processing predictions data for user role:', user.role)

          // Process user annual predictions
          const userAnnualData = userAnnualResponse?.data?.items || userAnnualResponse?.data?.predictions || userAnnualResponse?.data || []
          const userQuarterlyData = userQuarterlyResponse?.data?.items || userQuarterlyResponse?.data?.predictions || userQuarterlyResponse?.data || []
          const systemAnnualData = systemAnnualResponse?.data?.items || systemAnnualResponse?.data?.predictions || systemAnnualResponse?.data || []
          const systemQuarterlyData = systemQuarterlyResponse?.data?.items || systemQuarterlyResponse?.data?.predictions || systemQuarterlyResponse?.data || []

          console.log('📊 Raw data processing results:', {
            userAnnual: userAnnualData.length,
            userQuarterly: userQuarterlyData.length,
            systemAnnual: systemAnnualData.length,
            systemQuarterly: systemQuarterlyData.length
          })

          // Debug: Log sample of each data type
          console.log('🔍 Sample userAnnual data:', userAnnualData.slice(0, 2).map((p: any) => ({
            company: p.company_symbol,
            access: p.access_level,
            org_id: p.organization_id,
            created_by: p.created_by
          })))

          console.log('🔍 Sample systemAnnual data:', systemAnnualData.slice(0, 2).map((p: any) => ({
            company: p.company_symbol,
            access: p.access_level,
            org_id: p.organization_id,
            created_by: p.created_by
          })))

          // Transform user annual predictions - SIMPLIFIED: Trust backend role-based filtering
          const transformedUserAnnual = Array.isArray(userAnnualData) ? userAnnualData.map((pred: any) => {
            console.log('🔍 Processing user annual prediction:', {
              company: pred.company_symbol,
              userRole: user.role,
              backendAccessLevel: pred.access_level
            })

            // SIMPLIFIED: Trust backend to provide correct role-based data
            // Backend APIs already filter based on user role:
            // - Normal user: gets personal predictions
            // - Org admin/member: gets organization predictions  
            // - Tenant admin: gets tenant-scoped predictions
            const organization_access = pred.access_level || pred.organization_access ||
              (user.role === 'org_admin' || user.role === 'org_member' ? 'organization' : 'personal')

            console.log(`   ✅ Using access level: ${organization_access}`)

            return {
              ...pred,
              default_probability: pred.probability || 0,
              risk_category: pred.risk_level,
              reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
              organization_access,
              financial_ratios: {
                ltdtc: pred.long_term_debt_to_total_capital,
                roa: pred.return_on_assets,
                ebitint: pred.ebit_to_interest_expense
              }
            }
          }) : []

          // Transform user quarterly predictions - SIMPLIFIED: Trust backend role-based filtering
          const transformedUserQuarterly = Array.isArray(userQuarterlyData) ? userQuarterlyData.map((pred: any) => {
            console.log('🔍 Processing user quarterly prediction:', {
              company: pred.company_symbol,
              userRole: user.role,
              backendAccessLevel: pred.access_level
            })

            // SIMPLIFIED: Trust backend to provide correct role-based data
            const organization_access = pred.access_level || pred.organization_access ||
              (user.role === 'org_admin' || user.role === 'org_member' ? 'organization' : 'personal')

            console.log(`   ✅ Using access level: ${organization_access}`)

            return {
              ...pred,
              default_probability: pred.logistic_probability || 0,
              risk_category: pred.risk_level,
              reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
              reporting_quarter: pred.reporting_quarter?.toUpperCase() || "Q1",
              organization_access,
              financial_ratios: {
                ltdtc: pred.long_term_debt_to_total_capital,
                sga: pred.sga_margin,
                roa: pred.return_on_capital,
                tdte: pred.total_debt_to_ebitda
              }
            }
          }) : []

          // Transform system annual predictions - always 'system' access
          const transformedSystemAnnual = Array.isArray(systemAnnualData) ? systemAnnualData.map((pred: any) => ({
            ...pred,
            default_probability: pred.probability || 0,
            risk_category: pred.risk_level,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            organization_access: 'system', // Always system for these predictions
            financial_ratios: {
              ltdtc: pred.long_term_debt_to_total_capital,
              roa: pred.return_on_assets,
              ebitint: pred.ebit_to_interest_expense
            }
          })) : []

          // Transform system quarterly predictions - always 'system' access
          const transformedSystemQuarterly = Array.isArray(systemQuarterlyData) ? systemQuarterlyData.map((pred: any) => ({
            ...pred,
            default_probability: pred.logistic_probability || 0,
            risk_category: pred.risk_level,
            reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
            reporting_quarter: pred.reporting_quarter?.toUpperCase() || "Q1",
            organization_access: 'system', // Always system for these predictions
            financial_ratios: {
              ltdtc: pred.long_term_debt_to_total_capital,
              sga: pred.sga_margin,
              roa: pred.return_on_capital,
              tdte: pred.total_debt_to_ebitda
            }
          })) : []

          console.log('✅ Transformed predictions:', {
            userAnnual: transformedUserAnnual.length,
            userQuarterly: transformedUserQuarterly.length,
            systemAnnual: transformedSystemAnnual.length,
            systemQuarterly: transformedSystemQuarterly.length
          })

          console.log('🔍 User Annual access breakdown:', transformedUserAnnual.reduce((acc: any, p) => {
            acc[p.organization_access] = (acc[p.organization_access] || 0) + 1
            return acc
          }, {}))

          console.log('🔍 User Annual sample:', transformedUserAnnual.slice(0, 3).map((p: any) => ({
            company: p.company_symbol,
            access: p.organization_access,
            org_id: p.organization_id,
            created_by: p.created_by
          })))

          console.log('🔍 System Annual sample:', transformedSystemAnnual.slice(0, 3).map((p: any) => ({
            company: p.company_symbol,
            access: p.organization_access,
            org_id: p.organization_id,
            created_by: p.created_by
          })))

          return {
            transformedUserAnnual,
            transformedUserQuarterly,
            transformedSystemAnnual,
            transformedSystemQuarterly
          }
        },

        // SIMPLIFIED: Trust backend role-based filtering instead of complex client-side filtering
        getFilteredPredictions: (type: 'annual' | 'quarterly') => {
          const state = get()

          console.log(`🔍 FILTERING ${type} predictions:`)
          console.log(`   - activeDataFilter: "${state.activeDataFilter}"`)
          console.log(`   - systemAnnualPredictions count: ${state.systemAnnualPredictions.length}`)
          console.log(`   - systemQuarterlyPredictions count: ${state.systemQuarterlyPredictions.length}`)
          console.log(`   - annualPredictions count: ${state.annualPredictions.length}`)
          console.log(`   - quarterlyPredictions count: ${state.quarterlyPredictions.length}`)

          // Get predictions from appropriate store based on filter
          if (state.activeDataFilter === 'system') {
            // Platform tab: ONLY system/platform predictions
            const systemPredictions = type === 'annual' ? state.systemAnnualPredictions : state.systemQuarterlyPredictions
            console.log(`   🔵 Platform filter: ${systemPredictions.length} system predictions`)
            return systemPredictions
          } else {
            // User tabs: Backend already filtered data correctly based on user role
            // - Normal user: gets personal predictions
            // - Org admin/member: gets organization predictions
            // - Tenant admin: gets tenant-scoped predictions
            const userPredictions = type === 'annual' ? state.annualPredictions : state.quarterlyPredictions

            console.log(`   📋 User predictions (backend filtered): ${userPredictions.length}`)
            console.log(`   📋 Sample user data:`, userPredictions.slice(0, 3).map(p => ({
              company: p.company_symbol,
              access: p.organization_access
            })))

            // Return all user predictions since backend already filtered correctly
            return userPredictions
          }
        },

        getDefaultFilterForUser: (user: any) => {
          if (!user) {
            console.log('🔍 No user, returning default filter: personal')
            return 'personal'
          }
          console.log('🔍 Getting default filter for user role:', user.role)

          // Role-based default filter logic
          switch (user.role) {
            case 'user':
              // Normal user: start with their personal data
              return 'personal'

            case 'super_admin':
              // Super admin: only has platform data
              return 'system'

            case 'org_admin':
            case 'org_member':
              // Org roles: start with organization data (no personal data)
              return 'organization'

            case 'tenant_admin':
              // Tenant admin: start with organization data (manages multiple orgs)
              return 'organization'

            default:
              // Fallback: personal
              return 'personal'
          }
        },

        setDataFilter: (filter: string) => {
          console.log(`🔄 Switching data filter from "${get().activeDataFilter}" to "${filter}"`)
          set({ activeDataFilter: filter })
        },

        // Add prediction to the appropriate store when user creates new prediction
        addPrediction: (prediction: Prediction, type: 'annual' | 'quarterly') => {
          const state = get()
          console.log(`➕ Adding new ${type} prediction to cache:`, prediction.company_symbol)

          if (prediction.organization_access === 'system') {
            // Add to system predictions
            if (type === 'annual') {
              set({
                systemAnnualPredictions: [prediction, ...state.systemAnnualPredictions]
              })
            } else {
              set({
                systemQuarterlyPredictions: [prediction, ...state.systemQuarterlyPredictions]
              })
            }
          } else {
            // Add to user predictions
            if (type === 'annual') {
              set({
                annualPredictions: [prediction, ...state.annualPredictions]
              })
            } else {
              set({
                quarterlyPredictions: [prediction, ...state.quarterlyPredictions]
              })
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

        refetchPredictions: async () => {
          await get().fetchPredictions(true)
        },

        // Load more data by incrementing page numbers
        loadMorePredictions: async () => {
          const state = get()

          // Get current user from auth store
          const authStore = useAuthStore.getState()
          const user = authStore.user

          if (!user || state.isFetching) {
            return false
          }

          console.log('🔄 Loading more predictions...', {
            currentUser: state.annualPagination.currentPage,
            currentUserQ: state.quarterlyPagination.currentPage,
            currentSystem: state.systemAnnualPagination.currentPage,
            currentSystemQ: state.systemQuarterlyPagination.currentPage
          })

          set({ isFetching: true })

          try {
            // Determine which pages to load next
            const nextAnnualPage = state.annualPagination.hasMore ? state.annualPagination.currentPage + 1 : state.annualPagination.currentPage
            const nextQuarterlyPage = state.quarterlyPagination.hasMore ? state.quarterlyPagination.currentPage + 1 : state.quarterlyPagination.currentPage
            const nextSystemAnnualPage = state.systemAnnualPagination.hasMore ? state.systemAnnualPagination.currentPage + 1 : state.systemAnnualPagination.currentPage
            const nextSystemQuarterlyPage = state.systemQuarterlyPagination.hasMore ? state.systemQuarterlyPagination.currentPage + 1 : state.systemQuarterlyPagination.currentPage

            let responses: any[] = []

            if (user.role === 'super_admin') {
              // Super admin: Only load system data
              responses = await Promise.all([
                state.systemAnnualPagination.hasMore ? predictionsApi.annual.getSystemAnnualPredictions({
                  page: nextSystemAnnualPage,
                  size: state.systemAnnualPagination.pageSize
                }) : { success: true, data: [], meta: null },
                state.systemQuarterlyPagination.hasMore ? predictionsApi.quarterly.getSystemQuarterlyPredictions({
                  page: nextSystemQuarterlyPage,
                  size: state.systemQuarterlyPagination.pageSize
                }) : { success: true, data: [], meta: null }
              ])
            } else {
              // All other users: Load all data types that have more pages
              responses = await Promise.all([
                state.annualPagination.hasMore ? predictionsApi.annual.getAnnualPredictions({
                  page: nextAnnualPage,
                  size: state.annualPagination.pageSize
                }) : { success: true, data: [], meta: null },
                state.quarterlyPagination.hasMore ? predictionsApi.quarterly.getQuarterlyPredictions({
                  page: nextQuarterlyPage,
                  size: state.quarterlyPagination.pageSize
                }) : { success: true, data: [], meta: null },
                state.systemAnnualPagination.hasMore ? predictionsApi.annual.getSystemAnnualPredictions({
                  page: nextSystemAnnualPage,
                  size: state.systemAnnualPagination.pageSize
                }) : { success: true, data: [], meta: null },
                state.systemQuarterlyPagination.hasMore ? predictionsApi.quarterly.getSystemQuarterlyPredictions({
                  page: nextSystemQuarterlyPage,
                  size: state.systemQuarterlyPagination.pageSize
                }) : { success: true, data: [], meta: null }
              ])
            }

            // Process the new data
            if (user.role === 'super_admin') {
              const [systemAnnualResponse, systemQuarterlyResponse] = responses

              if (systemAnnualResponse.success || systemQuarterlyResponse.success) {
                const { transformedSystemAnnual, transformedSystemQuarterly } = await get().processAllPredictionsData(
                  { success: true, data: [], meta: null }, // Empty user annual response
                  { success: true, data: [], meta: null }, // Empty user quarterly response
                  systemAnnualResponse, systemQuarterlyResponse, user
                )

                // Append new data
                set((state) => ({
                  systemAnnualPredictions: [...state.systemAnnualPredictions, ...transformedSystemAnnual],
                  systemQuarterlyPredictions: [...state.systemQuarterlyPredictions, ...transformedSystemQuarterly],
                  isFetching: false,
                  systemAnnualPagination: {
                    ...state.systemAnnualPagination,
                    currentPage: nextSystemAnnualPage,
                    hasMore: nextSystemAnnualPage < (systemAnnualResponse.meta?.pages || 1)
                  },
                  systemQuarterlyPagination: {
                    ...state.systemQuarterlyPagination,
                    currentPage: nextSystemQuarterlyPage,
                    hasMore: nextSystemQuarterlyPage < (systemQuarterlyResponse.meta?.pages || 1)
                  }
                }))
                return true
              }
            } else {
              const [userAnnualResponse, userQuarterlyResponse, systemAnnualResponse, systemQuarterlyResponse] = responses

              if (userAnnualResponse.success || userQuarterlyResponse.success || systemAnnualResponse.success || systemQuarterlyResponse.success) {
                const { transformedUserAnnual, transformedUserQuarterly, transformedSystemAnnual, transformedSystemQuarterly } =
                  await get().processAllPredictionsData(
                    userAnnualResponse, userQuarterlyResponse,
                    systemAnnualResponse, systemQuarterlyResponse,
                    user
                  )

                // Append new data
                set((state) => ({
                  annualPredictions: [...state.annualPredictions, ...transformedUserAnnual],
                  quarterlyPredictions: [...state.quarterlyPredictions, ...transformedUserQuarterly],
                  systemAnnualPredictions: [...state.systemAnnualPredictions, ...transformedSystemAnnual],
                  systemQuarterlyPredictions: [...state.systemQuarterlyPredictions, ...transformedSystemQuarterly],
                  isFetching: false,
                  annualPagination: {
                    ...state.annualPagination,
                    currentPage: nextAnnualPage,
                    hasMore: nextAnnualPage < (userAnnualResponse.meta?.pages || 1)
                  },
                  quarterlyPagination: {
                    ...state.quarterlyPagination,
                    currentPage: nextQuarterlyPage,
                    hasMore: nextQuarterlyPage < (userQuarterlyResponse.meta?.pages || 1)
                  },
                  systemAnnualPagination: {
                    ...state.systemAnnualPagination,
                    currentPage: nextSystemAnnualPage,
                    hasMore: nextSystemAnnualPage < (systemAnnualResponse.meta?.pages || 1)
                  },
                  systemQuarterlyPagination: {
                    ...state.systemQuarterlyPagination,
                    currentPage: nextSystemQuarterlyPage,
                    hasMore: nextSystemQuarterlyPage < (systemQuarterlyResponse.meta?.pages || 1)
                  }
                }))
                return true
              }
            }

            set({ isFetching: false })
            return false

          } catch (error) {
            console.error('Error loading more predictions:', error)
            set({ isFetching: false, error: 'Failed to load more predictions' })
            return false
          }
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
          activeDataFilter: 'personal', // Reset to initial state (updated on next login)

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
    },
    {
      name: 'predictions-storage',
      partialize: (state) => ({
        // Only persist data, not loading states
        annualPredictions: state.annualPredictions,
        quarterlyPredictions: state.quarterlyPredictions,
        systemAnnualPredictions: state.systemAnnualPredictions,
        systemQuarterlyPredictions: state.systemQuarterlyPredictions,
        lastFetched: state.lastFetched,
        isInitialized: state.isInitialized,
        activeDataFilter: state.activeDataFilter,
        // Don't persist pagination as it can be recalculated
      }),
      // Clear persisted data when no user is authenticated
      onRehydrateStorage: () => (state) => {
        if (state) {
          const authStore = useAuthStore.getState()
          if (!authStore.isAuthenticated) {
            // Clear data if not authenticated
            state.annualPredictions = []
            state.quarterlyPredictions = []
            state.systemAnnualPredictions = []
            state.systemQuarterlyPredictions = []
            state.lastFetched = null
            state.isInitialized = false
          }
        }
      }
    }
  ))
