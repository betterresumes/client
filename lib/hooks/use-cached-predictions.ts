'use client'

import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { useMemo } from 'react'

/**
 * Optimized hook that uses cached data from Zustand store instead of making new API calls
 * This replaces the React Query hooks to prevent unnecessary API calls
 */
export function useCachedPredictions(type: 'annual' | 'quarterly' | 'both' = 'both') {
  const {
    annualPredictions,
    quarterlyPredictions,
    systemAnnualPredictions,
    systemQuarterlyPredictions,
    isLoading,
    error,
    lastFetched,
    getFilteredPredictions,
    activeDataFilter
  } = usePredictionsStore()

  // Get filtered predictions based on current data access filter
  const filteredAnnual = useMemo(() => {
    if (type === 'quarterly') return []
    return getFilteredPredictions('annual')
  }, [getFilteredPredictions, type, annualPredictions, systemAnnualPredictions, activeDataFilter])

  const filteredQuarterly = useMemo(() => {
    if (type === 'annual') return []
    return getFilteredPredictions('quarterly')
  }, [getFilteredPredictions, type, quarterlyPredictions, systemQuarterlyPredictions, activeDataFilter])

  // Combined data for 'both' type
  const allPredictions = useMemo(() => {
    if (type === 'annual') return filteredAnnual
    if (type === 'quarterly') return filteredQuarterly
    return [...filteredAnnual, ...filteredQuarterly]
  }, [type, filteredAnnual, filteredQuarterly])

  // Check if we have any data
  const hasData = useMemo(() => {
    const totalCount = annualPredictions.length +
      quarterlyPredictions.length +
      systemAnnualPredictions.length +
      systemQuarterlyPredictions.length
    return totalCount > 0
  }, [annualPredictions.length, quarterlyPredictions.length, systemAnnualPredictions.length, systemQuarterlyPredictions.length])

  // Data freshness indicator
  const isStale = useMemo(() => {
    if (!lastFetched) return true
    const now = Date.now()
    const thirtyMinutes = 30 * 60 * 1000
    return (now - lastFetched) > thirtyMinutes
  }, [lastFetched])

  return {
    // Filtered data based on current access filter
    data: type === 'annual' ? filteredAnnual :
      type === 'quarterly' ? filteredQuarterly :
        allPredictions,

    // Raw data arrays
    annualPredictions: filteredAnnual,
    quarterlyPredictions: filteredQuarterly,

    // System data (for platform view)
    systemAnnualPredictions,
    systemQuarterlyPredictions,

    // Loading and error states
    isLoading,
    error,

    // Data state information
    hasData,
    isStale,
    lastFetched,
    activeDataFilter,

    // Counts for quick reference
    counts: {
      annual: filteredAnnual.length,
      quarterly: filteredQuarterly.length,
      systemAnnual: systemAnnualPredictions.length,
      systemQuarterly: systemQuarterlyPredictions.length,
      total: allPredictions.length
    }
  }
}

/**
 * Hook for getting raw prediction data without filtering
 * Use this when you need access to all data regardless of current filter
 */
export function useRawPredictions() {
  const {
    annualPredictions,
    quarterlyPredictions,
    systemAnnualPredictions,
    systemQuarterlyPredictions,
    isLoading,
    error,
    lastFetched
  } = usePredictionsStore()

  const totalCount = annualPredictions.length +
    quarterlyPredictions.length +
    systemAnnualPredictions.length +
    systemQuarterlyPredictions.length

  return {
    annualPredictions,
    quarterlyPredictions,
    systemAnnualPredictions,
    systemQuarterlyPredictions,
    isLoading,
    error,
    lastFetched,
    totalCount,
    hasData: totalCount > 0
  }
}
