'use client'

import { create } from 'zustand'
import { predictionsApi } from '@/lib/api/predictions'

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
  organization_access: string // "personal" | "organization"

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

  // Actions
  fetchPredictions: () => Promise<void>
  refetchPredictions: () => Promise<void>
  clearError: () => void
  reset: () => void
  invalidateCache: () => void
  addPrediction: (prediction: Prediction, type: 'annual' | 'quarterly') => void

  // Utility functions
  getPredictionProbability: (prediction: Prediction) => number
  getRiskBadgeColor: (riskLevel: string | undefined | null) => string
  formatPredictionDate: (prediction: Prediction) => string
}

export const usePredictionsStore = create<PredictionsState>((set, get) => {
  // Set up event listener for automatic refresh
  if (typeof window !== 'undefined') {
    window.addEventListener('predictions-updated', () => {
      console.log('🔄 Predictions updated - auto-refreshing data...')
      get().invalidateCache()
    })
  }

  return {
    annualPredictions: [],
    quarterlyPredictions: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    isInitialized: false,


    fetchPredictions: async () => {
      const state = get()

      // Don't fetch if we already have recent data (less than 30 minutes old) and app is initialized
      if (state.isInitialized && state.lastFetched && Date.now() - state.lastFetched < 30 * 60 * 1000) {
        console.log('Using cached predictions data - no API call needed')
        return
      }

      console.log('Fetching fresh predictions data from API...')
      set({ isLoading: true, error: null })

      try {
        const [annualResponse, quarterlyResponse] = await Promise.all([
          predictionsApi.annual.getAnnualPredictions({ page: 1, size: 100 }),
          predictionsApi.quarterly.getQuarterlyPredictions({ page: 1, size: 100 })
        ])

        // Handle the new API response structure with predictions array
        const annualData = annualResponse?.data?.predictions || annualResponse?.data || []
        const quarterlyData = quarterlyResponse?.data?.predictions || quarterlyResponse?.data || []

        // Transform annual predictions
        const annualPredictions = Array.isArray(annualData) ? annualData.map((pred: any) => ({
          ...pred,
          // Add computed fields for backward compatibility
          default_probability: pred.probability || 0,
          risk_category: pred.risk_level,
          reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
          // Map financial ratios to legacy format
          financial_ratios: {
            ltdtc: pred.long_term_debt_to_total_capital,
            roa: pred.return_on_assets,
            ebitint: pred.ebit_to_interest_expense
          }
        })) : []

        // Transform quarterly predictions  
        const quarterlyPredictions = Array.isArray(quarterlyData) ? quarterlyData.map((pred: any) => ({
          ...pred,
          // Add computed fields for backward compatibility
          default_probability: pred.ensemble_probability || pred.logistic_probability || pred.gbm_probability || 0,
          risk_category: pred.risk_level,
          reporting_year: pred.reporting_year?.toString() || new Date().getFullYear().toString(),
          // Map financial ratios to legacy format
          financial_ratios: {
            ltdtc: pred.long_term_debt_to_total_capital,
            roa: pred.return_on_assets,
            ebitint: pred.ebit_to_interest_expense
          }
        })) : []

        console.log(`✅ Loaded ${annualPredictions.length} annual and ${quarterlyPredictions.length} quarterly predictions`)

        set({
          annualPredictions,
          quarterlyPredictions,
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
          isInitialized: true
        })
      } catch (error: any) {
        console.error('Failed to fetch predictions:', error)
        set({
          isLoading: false,
          error: error.message || 'Failed to fetch predictions',
          annualPredictions: [],
          quarterlyPredictions: []
        })
      }
    },

    refetchPredictions: async () => {
      set({ lastFetched: null }) // Force refetch
      return get().fetchPredictions()
    },

    invalidateCache: () => {
      set({ lastFetched: null, isInitialized: false })
      get().fetchPredictions()
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
    }
  }
})
