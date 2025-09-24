'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { useDashboardStatsStore } from '@/lib/stores/dashboard-stats-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CompanyAnalysisPanel } from './company-analysis-panel'
import {
  Building2,
  TrendingUp,
  BarChart3,
  Calendar,
  Activity,
  Loader2,
  RefreshCw,
  Search,
  X
} from 'lucide-react'
import { Input } from '@/components/ui/input'

export function CompanyDetailsView() {
  const { selectedCompany, selectedPredictionType, setSelectedCompany, clearSelection } = useDashboardStore()
  const { isAuthenticated, user } = useAuthStore()
  const { stats: dashboardStats, fetchStats } = useDashboardStatsStore()
  const [activeTab, setActiveTab] = useState<'annual' | 'quarterly'>('annual')
  const [forceRefresh, setForceRefresh] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)

  // Show any 5 companies by default, but allow search through all
  const DEFAULT_COMPANIES_TO_SHOW = 5

  const {
    annualPredictions,
    quarterlyPredictions,
    systemAnnualPredictions,
    systemQuarterlyPredictions,
    isLoading: isPredictionsLoading,
    error: predictionsError,
    fetchPredictions,
    loadMorePredictions, // Add this method
    getPredictionProbability,
    getRiskBadgeColor,
    formatPredictionDate,
    getFilteredPredictions,
    activeDataFilter,
    lastFetched,
    annualPagination, // Add pagination states
    quarterlyPagination,
    systemAnnualPagination,
    systemQuarterlyPagination
  } = usePredictionsStore()

  // Set active tab based on selectedPredictionType when navigating from table
  useEffect(() => {
    if (selectedPredictionType) {
      setActiveTab(selectedPredictionType)
    }
  }, [selectedPredictionType])

  // Aggressively fetch predictions when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // If we don't have any data and we're not loading, start loading
      if (annualPredictions.length === 0 && quarterlyPredictions.length === 0 && !isPredictionsLoading && !hasAttemptedLoad) {
        console.log('🏢 Company details view - fetching predictions on login')
        setHasAttemptedLoad(true)
        // Force loading state by triggering a re-render
        setTimeout(() => fetchPredictions(), 0)
      }
      // Also fetch if we've never attempted a load
      else if (!hasAttemptedLoad && !isPredictionsLoading) {
        console.log('🏢 Company details view - fetching predictions as never attempted')
        setHasAttemptedLoad(true)
        setTimeout(() => fetchPredictions(), 0)
      }
    }
  }, [isAuthenticated, user, annualPredictions.length, quarterlyPredictions.length, isPredictionsLoading, hasAttemptedLoad, fetchPredictions])

  // Mark as attempted load when we have any data
  useEffect(() => {
    if (annualPredictions.length > 0 || quarterlyPredictions.length > 0) {
      setHasAttemptedLoad(true)
    }
  }, [annualPredictions.length, quarterlyPredictions.length])

  // Fetch dashboard stats on mount to get total prediction counts
  useEffect(() => {
    if (isAuthenticated && !dashboardStats) {
      console.log('🏢 Company details view - fetching dashboard stats for totals')
      fetchStats()
    }
  }, [isAuthenticated, dashboardStats, fetchStats])

  // Listen for data filter changes to refresh the view
  useEffect(() => {
    const handleDataFilterChanged = (event: CustomEvent) => {
      console.log('🏢 Company details view - data filter changed, refreshing:', event.detail)
      setForceRefresh(prev => prev + 1)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('data-filter-changed', handleDataFilterChanged as EventListener)
      return () => {
        window.removeEventListener('data-filter-changed', handleDataFilterChanged as EventListener)
      }
    }
  }, [])

  // Ensure predictions are arrays - use filtered data (trigger with forceRefresh)
  const filteredAnnualPredictions = useMemo(() => getFilteredPredictions('annual'), [getFilteredPredictions, forceRefresh, annualPredictions, systemAnnualPredictions, activeDataFilter])
  const filteredQuarterlyPredictions = useMemo(() => getFilteredPredictions('quarterly'), [getFilteredPredictions, forceRefresh, quarterlyPredictions, systemQuarterlyPredictions, activeDataFilter])
  const safePredictions = Array.isArray(filteredAnnualPredictions) ? filteredAnnualPredictions : []
  const safeQuarterlyPredictions = Array.isArray(filteredQuarterlyPredictions) ? filteredQuarterlyPredictions : []

  console.log('🔍 Company details using filtered predictions:', {
    annual: safePredictions.length,
    quarterly: safeQuarterlyPredictions.length
  })

  // Get all companies from both annual and quarterly predictions
  const allCompanies = [...safePredictions, ...safeQuarterlyPredictions]
  const companies = useMemo(() => {
    const uniqueCompanies = Array.from(new Set(allCompanies.map((pred: any) => pred.company_symbol)))
      .map(symbol => {
        const pred = allCompanies.find((p: any) => p.company_symbol === symbol)
        console.log("pred", pred)
        if (!pred) return null
        return {
          id: pred.company_symbol || pred.id,
          name: pred.company_symbol,
          subtitle: pred.company_name,
          sector: pred.sector || 'Unknown',
          defaultRate: `${((pred.default_probability || 0) * 100).toFixed(2)}%`,
          riskCategory: pred.risk_category || 'MEDIUM'
        }
      })
      .filter(Boolean)
    return uniqueCompanies.sort((a: any, b: any) => parseFloat(a.defaultRate) - parseFloat(b.defaultRate))
  }, [allCompanies])

  // Set first company as selected if none selected, but allow flexibility
  useEffect(() => {
    if (companies.length > 0) {
      // If a company is pre-selected from navigation, check if it still exists
      if (selectedCompany && companies.find(c => c?.id === selectedCompany)) {
        return // Keep the selected company
      }
      // If selected company no longer exists or none selected, default to first company
      if ((!selectedCompany || !companies.find(c => c?.id === selectedCompany)) && companies[0]) {
        setSelectedCompany(companies[0].id)
      }
    } else if (companies.length === 0 && selectedCompany) {
      // Clear selection if no companies available
      setSelectedCompany(null)
    }
  }, [companies, selectedCompany, setSelectedCompany])

  // Clear selection when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      // Don't clear selection on unmount - let users browse freely
    }
  }, [])

  const currentCompany = companies.find((comp: any) => comp.id === selectedCompany)

  // Get all predictions for selected company (can be multiple for each type)
  const currentAnnualPredictions = safePredictions.filter((pred: any) =>
    (pred.company_symbol || pred.id) === selectedCompany
  )
  const currentQuarterlyPredictions = safeQuarterlyPredictions.filter((pred: any) =>
    (pred.company_symbol || pred.id) === selectedCompany
  )

  // Determine which data is available for the selected company
  const hasAnnualData = currentAnnualPredictions.length > 0
  const hasQuarterlyData = currentQuarterlyPredictions.length > 0

  // Switch to available tab if current tab has no data for selected company
  useEffect(() => {
    if (selectedCompany) {
      if (activeTab === "annual" && !hasAnnualData && hasQuarterlyData) {
        setActiveTab("quarterly")
      } else if (activeTab === "quarterly" && !hasQuarterlyData && hasAnnualData) {
        setActiveTab("annual")
      } else if (hasAnnualData && !hasQuarterlyData) {
        setActiveTab("annual")
      } else if (!hasAnnualData && hasQuarterlyData) {
        setActiveTab("quarterly")
      }
    }
  }, [selectedCompany, hasAnnualData, hasQuarterlyData, activeTab])

  // Search and filter companies
  const filteredCompanies = useMemo(() => {
    let filtered = companies

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = companies.filter((company: any) =>
        company.name?.toLowerCase().includes(query) ||
        company.subtitle?.toLowerCase().includes(query) ||
        company.id?.toLowerCase().includes(query)
      )
    }

    // If no search, show first 5 companies by default
    if (!searchQuery.trim()) {
      return filtered.slice(0, DEFAULT_COMPANIES_TO_SHOW)
    }

    // If searching, show all matching results
    return filtered
  }, [companies, searchQuery])

  console.log('🔍 Company Search Results:', {
    totalCompanies: companies.length,
    searchQuery,
    filteredCount: filteredCompanies.length,
    annualPredictions: safePredictions.length,
    quarterlyPredictions: safeQuarterlyPredictions.length
  })

  // Load more data if needed when we don't have enough companies for search
  useEffect(() => {
    const hasMoreData = annualPagination.hasMore || quarterlyPagination.hasMore ||
      systemAnnualPagination.hasMore || systemQuarterlyPagination.hasMore

    // If we have very few companies and more data is available, load more
    if (companies.length < 50 && hasMoreData && !isPredictionsLoading) {
      console.log('🏢 Loading more companies for better search experience:', {
        currentCompaniesLoaded: companies.length,
        hasMoreData
      })

      const store = usePredictionsStore.getState()
      if (store.loadMorePredictions) {
        store.loadMorePredictions()
      } else {
        fetchPredictions()
      }
    }
  }, [companies.length, annualPagination.hasMore, quarterlyPagination.hasMore, systemAnnualPagination.hasMore, systemQuarterlyPagination.hasMore, isPredictionsLoading, fetchPredictions])

  // Handle clearing search
  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const getRiskColor = (riskCategory: string) => {
    switch (riskCategory) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDefaultRateColor = (riskCategory: string) => {
    switch (riskCategory) {
      case 'LOW':
        return 'text-green-600'
      case 'MEDIUM':
        return 'text-yellow-600'
      case 'HIGH':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }


  return (
    <div className="space-y-6 font-bricolage">
      {/* Company Details Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bricolage font-bold text-gray-900 dark:text-white">
            Company Details
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-bricolage">
            Detailed analysis and risk assessment for individual companies
          </p>
        </div>

        {currentCompany && (hasAnnualData || hasQuarterlyData) && (
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {hasAnnualData && (
              <button
                onClick={() => setActiveTab("annual")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors font-bricolage ${activeTab === "annual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Annual
              </button>
            )}
            {hasQuarterlyData && (
              <button
                onClick={() => setActiveTab("quarterly")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors font-bricolage ${activeTab === "quarterly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Quarterly
              </button>
            )}
          </div>
        )}
      </div>

      {/* Company selection and browsing */}

      {/* Show "No Data Available" only if we've attempted to load and finished, and still have no data */}
      {!isPredictionsLoading && hasAttemptedLoad && companies.length === 0 && (
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-center py-16 px-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              No Data Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              No prediction data is available for your current data source selection. Please check your permissions or try refreshing.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setHasAttemptedLoad(true)
                fetchPredictions()
              }}
              className="font-bricolage"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
          </div>
        </Card>
      )}

      {/* Only show the rest if we have companies or are loading */}
      {(isPredictionsLoading || companies.length > 0) && (
        <div className="space-y-4">
          {/* Show current selection with option to browse freely */}
          {selectedCompany && currentCompany && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-bricolage">Viewing:</span>
              <Badge variant="outline" className="font-bricolage">
                {currentCompany.name}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCompany(null)}
                className="text-xs text-gray-500 hover:text-gray-700 font-bricolage"
              >
                Browse All Companies
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Main content area - show if loading OR have companies OR if we're authenticated and haven't attempted load yet */}
      {(isPredictionsLoading || companies.length > 0 || (isAuthenticated && !hasAttemptedLoad)) && (
        isPredictionsLoading && companies.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-bricolage">
            {/* Left Panel Skeleton */}
            <div className="h-[600px]">
              <Card className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-4" />
                </div>

                {/* Company list skeleton */}
                <div className="space-y-2 flex-1">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-4 w-12 mb-1" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination skeleton */}
                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-20" />
                    <div className="flex items-center space-x-1">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <div className="text-center mt-2">
                    <Skeleton className="h-3 w-40 mx-auto" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Panel Skeleton */}
            <div className="lg:col-span-2 h-[600px]">
              <Card className="p-6 font-bricolage h-full flex flex-col">
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton className="h-10 w-48" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-5 w-64" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-10 w-24 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>

                {/* Content skeleton */}
                <div className="space-y-3 flex-1">
                  {/* Risk assessment skeleton */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="w-full h-2 rounded-full" />
                  </div>

                  {/* Financial ratios skeleton */}
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Skeleton className="w-4 h-4" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton className="h-4 w-12" />
                          </div>
                        </div>
                      ))}
                      <div className="bg-gray-50 rounded-lg p-2 col-span-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Skeleton className="w-4 h-4" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ML Model Insights skeleton */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Skeleton className="h-6 w-36 mb-2" />
                    <div className="bg-blue-50 rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-bricolage">
            {/* Left Panel - Company Search and Selection */}
            <div className="h-[600px]">
              <Card className="p-4 h-full flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-bricolage">
                      S&P 500 Companies
                    </h3>
                    <div className="flex items-center gap-2">
                      {annualPagination.hasMore || quarterlyPagination.hasMore || systemAnnualPagination.hasMore || systemQuarterlyPagination.hasMore ? (
                        !isPredictionsLoading && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const store = usePredictionsStore.getState()
                              if (store.loadMorePredictions) {
                                store.loadMorePredictions()
                              } else {
                                fetchPredictions()
                              }
                            }}
                            className="h-6 px-2 text-xs font-bricolage"
                          >
                            Load More
                          </Button>
                        )
                      ) : null}
                      {isPredictionsLoading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search companies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 h-9 text-sm font-bricolage"
                    />
                    {searchQuery && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Search Results Info */}
                  <div className="mt-2 text-xs text-gray-500 font-bricolage">
                    {searchQuery.trim() ? (
                      `Found ${filteredCompanies.length} companies matching "${searchQuery}"`
                    ) : (
                      `Showing all companies`
                    )}
                  </div>
                </div>

                {isPredictionsLoading ? (
                  <div className="space-y-2 flex-1">
                    {/* Company list skeleton */}
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Skeleton className="h-4 w-20 mb-1" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <div className="text-right">
                            <Skeleton className="h-4 w-12 mb-1" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : companies.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center"></div>
                ) : (
                  <>
                    {/* Company List */}
                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {filteredCompanies.map((company: any) => (
                        <div
                          key={company.id}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out border font-bricolage ${selectedCompany === company.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'border-gray-200 dark:border-gray-700'
                            }`}
                          onClick={() => setSelectedCompany(company.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-sm">{company.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {company.subtitle}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-sm">{company.defaultRate}</div>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${company.riskCategory === 'LOW' ? 'bg-green-100 text-green-800' :
                                  company.riskCategory === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}
                              >
                                {company.riskCategory}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* No search results */}
                      {filteredCompanies.length === 0 && searchQuery.trim() && (
                        <div className="text-center py-8">
                          <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-500 font-bricolage">
                            No companies found matching "{searchQuery}"
                          </p>
                          <button
                            onClick={handleClearSearch}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-2 font-bricolage"
                          >
                            Clear search
                          </button>
                        </div>
                      )}
                    </div>

                  </>
                )}
              </Card>
            </div>

            {/* Right Panel - Company Analysis */}
            {currentCompany && (
              <div className="lg:col-span-2 h-[600px]">
                <div
                  key={selectedCompany}
                  className="h-full animate-in fade-in-0 slide-in-from-right-5 duration-500"
                >
                  <CompanyAnalysisPanel
                    company={currentCompany}
                    annualPredictions={currentAnnualPredictions}
                    quarterlyPredictions={currentQuarterlyPredictions}
                    activeTab={activeTab}
                    isLoading={isPredictionsLoading}
                  />
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
