'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { useAuthStore } from '@/lib/stores/auth-store'

interface Prediction {
  id: string
  company_id: string
  company_symbol: string
  company_name: string
  reporting_year: string
  reporting_quarter?: string
  probability?: number
  logistic_probability?: number
  gbm_probability?: number
  ensemble_probability?: number
  default_probability?: number
  risk_level: string
  confidence: number
  organization_id?: string | null
  organization_name?: string | null
  organization_access: string
  created_by: string
  created_by_email?: string
  created_at: string
}

interface SmartPaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
  loadedItems: number
  isLoading: boolean
  hasLoadedInitialBatch: boolean
  items: Prediction[]
}

interface UseSmartPaginationOptions {
  type: 'annual' | 'quarterly'
  mode: 'user' | 'system'
  initialPageSize?: number
  initialBatchSize?: number
}

export function useSmartPagination({
  type,
  mode,
  initialPageSize = 20,
  initialBatchSize = 100
}: UseSmartPaginationOptions) {
  const { user } = useAuthStore()
  const {
    annualPredictions,
    quarterlyPredictions,
    systemAnnualPredictions,
    systemQuarterlyPredictions,
    fetchPredictions,
    dashboardStats
  } = usePredictionsStore()

  // Get the correct data array based on mode and type
  const getCurrentData = () => {
    if (mode === 'system') {
      return type === 'annual' ? systemAnnualPredictions : systemQuarterlyPredictions
    }
    return type === 'annual' ? annualPredictions : quarterlyPredictions
  }

  // Get total items from stats
  const getTotalItems = () => {
    if (!dashboardStats) return 0

    const key = mode === 'system'
      ? (type === 'annual' ? 'system_annual_predictions' : 'system_quarterly_predictions')
      : (type === 'annual' ? 'annual_predictions' : 'quarterly_predictions')

    return dashboardStats[key]?.total_predictions || 0
  }

  const [state, setState] = useState<SmartPaginationState>({
    currentPage: 1,
    pageSize: initialPageSize,
    totalItems: 0,
    loadedItems: 0,
    isLoading: false,
    hasLoadedInitialBatch: false,
    items: []
  })

  // Initialize stats and load initial batch
  useEffect(() => {
    const initialize = async () => {
      if (!user?.organization_id) return

      setState(prev => ({ ...prev, isLoading: true }))

      try {
        // Fetch stats to get total counts
        await fetchStats()

        const currentData = getCurrentData()
        const totalItems = getTotalItems()

        // Load initial batch if we don't have enough data
        if (currentData.length < initialBatchSize && totalItems > 0) {
          console.log(`🔄 Loading initial batch of ${initialBatchSize} items...`)
          await loadInitialBatch()
        }

        setState(prev => ({
          ...prev,
          totalItems,
          loadedItems: currentData.length,
          hasLoadedInitialBatch: currentData.length > 0,
          items: currentData,
          isLoading: false
        }))
      } catch (error) {
        console.error('Failed to initialize smart pagination:', error)
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    initialize()
  }, [user?.organization_id, type, mode])

  // Update state when data changes
  useEffect(() => {
    const currentData = getCurrentData()
    const totalItems = getTotalItems()

    setState(prev => ({
      ...prev,
      totalItems,
      loadedItems: currentData.length,
      items: currentData
    }))
  }, [predictions, systemPredictions, stats])

  const loadInitialBatch = async () => {
    if (!user?.organization_id) return

    try {
      const params = {
        page: 1,
        page_size: initialBatchSize,
        [type]: 'true'
      }

      if (mode === 'system') {
        await fetchPredictions(params, true) // true for system predictions
      } else {
        await fetchPredictions(params)
      }
    } catch (error) {
      console.error('Failed to load initial batch:', error)
    }
  }

  const loadMoreData = useCallback(async () => {
    if (!user?.organization_id || state.isLoading) return

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const currentData = getCurrentData()
      const nextPage = Math.floor(currentData.length / initialBatchSize) + 1

      console.log(`🔄 Loading more data... Page ${nextPage}`)

      const params = {
        page: nextPage,
        page_size: initialBatchSize,
        [type]: 'true'
      }

      if (mode === 'system') {
        await fetchPredictions(params, true)
      } else {
        await fetchPredictions(params)
      }
    } catch (error) {
      console.error('Failed to load more data:', error)
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [user?.organization_id, state.isLoading, type, mode, initialBatchSize])

  // Get paginated items for current page (client-side pagination)
  const getPaginatedItems = () => {
    const startIndex = (state.currentPage - 1) * state.pageSize
    const endIndex = startIndex + state.pageSize
    return state.items.slice(startIndex, endIndex)
  }

  // Check if we need more data for a specific page
  const needsMoreDataForPage = (page: number) => {
    const requiredEndIndex = page * state.pageSize
    return requiredEndIndex > state.loadedItems && state.loadedItems < state.totalItems
  }

  // Page change handler
  const handlePageChange = (page: number) => {
    if (needsMoreDataForPage(page)) {
      loadMoreData()
    }
    setState(prev => ({ ...prev, currentPage: page }))
  }

  // Page size change handler
  const handlePageSizeChange = (newPageSize: number) => {
    const newTotalPages = Math.ceil(state.totalItems / newPageSize)
    const newCurrentPage = Math.min(state.currentPage, newTotalPages)

    setState(prev => ({
      ...prev,
      pageSize: newPageSize,
      currentPage: newCurrentPage
    }))
  }

  return {
    // State
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    totalItems: state.totalItems,
    loadedItems: state.loadedItems,
    isLoading: state.isLoading,
    hasLoadedInitialBatch: state.hasLoadedInitialBatch,

    // Data
    items: getPaginatedItems(),
    allLoadedItems: state.items,

    // Actions
    handlePageChange,
    handlePageSizeChange,
    loadMoreData,

    // Helpers
    needsMoreDataForPage,
    totalPages: Math.ceil(state.totalItems / state.pageSize),
    hasNextPage: state.currentPage < Math.ceil(state.totalItems / state.pageSize),
    hasPreviousPage: state.currentPage > 1
  }
}
