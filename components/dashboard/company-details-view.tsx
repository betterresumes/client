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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CompanyAnalysisPanel } from './company-analysis-panel'
import {
  Building2,
  TrendingUp,
  BarChart3,
  Calendar,
  Activity,
  Loader2,
  RefreshCw
} from 'lucide-react'

export function CompanyDetailsView() {
  const { selectedCompany, selectedPredictionType, setSelectedCompany, clearSelection } = useDashboardStore()
  const { isAuthenticated, user } = useAuthStore()
  const { stats: dashboardStats, fetchStats } = useDashboardStatsStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'annual' | 'quarterly'>('annual')
  const [forceRefresh, setForceRefresh] = useState(0)
  const [pageSize, setPageSize] = useState(5) // Default to 5 per page as requested
  const itemsPerPage = pageSize

  const {
    annualPredictions,
    quarterlyPredictions,
    systemAnnualPredictions,
    systemQuarterlyPredictions,
    isLoading: isPredictionsLoading,
    error: predictionsError,
    fetchPredictions,
    getPredictionProbability,
    getRiskBadgeColor,
    formatPredictionDate,
    getFilteredPredictions,
    activeDataFilter,
    lastFetched
  } = usePredictionsStore()

  // Set active tab based on selectedPredictionType when navigating from table
  useEffect(() => {
    if (selectedPredictionType) {
      setActiveTab(selectedPredictionType)
    }
  }, [selectedPredictionType])

  // Only fetch predictions if we don't have any data and user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && annualPredictions.length === 0 && quarterlyPredictions.length === 0 && !isPredictionsLoading) {
      console.log('🏢 Company details view - fetching predictions as none exist')
      fetchPredictions()
    }
  }, [isAuthenticated, user, annualPredictions.length, quarterlyPredictions.length, isPredictionsLoading, fetchPredictions])

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

  // Pagination logic - use dashboard total predictions to estimate companies
  const getTotalPredictionsFromStats = () => {
    if (!dashboardStats) return 0

    // Get the appropriate total based on user scope and data filter
    if (activeDataFilter === 'system' && dashboardStats.platform_statistics) {
      return dashboardStats.platform_statistics.total_predictions || 0
    } else if (activeDataFilter === 'user' && dashboardStats.user_dashboard) {
      return dashboardStats.user_dashboard.total_predictions || 0
    }

    // Fallback to main dashboard stats
    return dashboardStats.total_predictions || 0
  }

  const totalPredictionsInDB = getTotalPredictionsFromStats()
  const totalLoadedCompanies = companies.length

  // Better estimation of total companies based on database total predictions
  const estimatedTotalCompanies = (() => {
    if (totalPredictionsInDB === 0) return totalLoadedCompanies
    if (totalLoadedCompanies === 0) return 0

    // If we've loaded significant data, we can estimate better
    const currentPredictionsLoaded = safePredictions.length + safeQuarterlyPredictions.length
    if (currentPredictionsLoaded >= totalPredictionsInDB) {
      return totalLoadedCompanies // We have all the data
    }

    // If we haven't loaded much data yet, be more aggressive about estimating
    if (currentPredictionsLoaded < totalPredictionsInDB * 0.5) {
      // We've loaded less than 50% of predictions, estimate more conservatively
      // but ensure we show enough pages to trigger loading
      const estimatedFromTotal = Math.floor(totalPredictionsInDB / 2.0) // Assume 2 predictions per company average
      const minEstimate = totalLoadedCompanies + Math.ceil(totalLoadedCompanies * 0.5) // At least 50% more than loaded
      return Math.max(estimatedFromTotal, minEstimate)
    }

    // If we've loaded a good portion, estimate based on the ratio we've seen
    const loadedRatio = currentPredictionsLoaded / totalPredictionsInDB
    const predictionsPerCompany = currentPredictionsLoaded / totalLoadedCompanies
    const estimatedFromRatio = Math.floor(totalPredictionsInDB / predictionsPerCompany)

    // Use the higher of current loaded or estimated total
    return Math.max(totalLoadedCompanies, estimatedFromRatio)
  })()

  const totalPages = Math.ceil(estimatedTotalCompanies / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCompanies = companies.slice(startIndex, endIndex)

  console.log('🏢 Company Details Smart Pagination:', {
    totalLoadedCompanies,
    totalPredictionsInDB,
    estimatedTotalCompanies,
    currentPage,
    totalPages,
    pageSize: itemsPerPage,
    currentPredictionsLoaded: safePredictions.length + safeQuarterlyPredictions.length,
    loadedRatio: (safePredictions.length + safeQuarterlyPredictions.length) / Math.max(totalPredictionsInDB, 1)
  })

  // Auto-load more data if we have significantly fewer companies than expected
  useEffect(() => {
    if (dashboardStats && companies.length > 0 && !isPredictionsLoading) {
      const totalPredictions = getTotalPredictionsFromStats()
      const currentPredictionsLoaded = safePredictions.length + safeQuarterlyPredictions.length

      // If we have total predictions data but haven't loaded much, and companies seem low
      if (totalPredictions > 0 && currentPredictionsLoaded < totalPredictions * 0.3) {
        const expectedMinCompanies = Math.floor(totalPredictions / 3) // Very conservative estimate

        if (companies.length < expectedMinCompanies * 0.5) {
          console.log('🏢 Auto-loading more predictions - too few companies loaded:', {
            companiesLoaded: companies.length,
            expectedMinCompanies,
            totalPredictions,
            currentPredictionsLoaded,
            loadedRatio: currentPredictionsLoaded / totalPredictions
          })
          fetchPredictions()
        }
      }
    }
  }, [dashboardStats, companies.length, safePredictions.length, safeQuarterlyPredictions.length, isPredictionsLoading, fetchPredictions, getTotalPredictionsFromStats])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return

    // Calculate how many unique companies we need for this page
    const requiredCompanies = page * itemsPerPage
    const currentlyLoadedCompanies = companies.length
    const currentPredictionsLoaded = safePredictions.length + safeQuarterlyPredictions.length

    console.log('🏢 Page change requested:', {
      page,
      itemsPerPage,
      requiredCompanies,
      currentlyLoadedCompanies,
      currentPredictionsLoaded,
      totalPredictionsInDB,
      needsMoreCompanies: requiredCompanies > currentlyLoadedCompanies,
      hasMorePredictions: currentPredictionsLoaded < totalPredictionsInDB,
      estimatedTotalCompanies
    })

    // Check if we need to load more predictions
    // Load more if:
    // 1. We need more companies than currently loaded, OR
    // 2. We haven't loaded all available predictions and current page is getting close to our limit
    const shouldLoadMore = (
      // Case 1: Need more companies than we have
      (requiredCompanies > currentlyLoadedCompanies) ||
      // Case 2: Haven't loaded all predictions and we're near the end of what we can estimate
      (currentPredictionsLoaded < totalPredictionsInDB &&
        page >= Math.floor(currentlyLoadedCompanies / itemsPerPage))
    ) && !isPredictionsLoading

    if (shouldLoadMore) {
      console.log('🏢 Need to load more predictions for page', page, {
        reason: requiredCompanies > currentlyLoadedCompanies ? 'need_more_companies' : 'approaching_limit',
        currentlyLoadedCompanies,
        requiredCompanies,
        currentPredictionsLoaded,
        totalPredictionsInDB
      })
      fetchPredictions() // This will load more data
    }

    setCurrentPage(page)
  }

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle if no input is focused and pagination has multiple pages  
      if (document.activeElement?.tagName === 'INPUT' || totalPages <= 1) return

      if (event.key === 'ArrowLeft' && currentPage > 1) {
        event.preventDefault()
        handlePageChange(currentPage - 1)
      } else if (event.key === 'ArrowRight' && currentPage < totalPages) {
        event.preventDefault()
        handlePageChange(currentPage + 1)
      } else if (event.key === 'Home') {
        event.preventDefault()
        handlePageChange(1)
      } else if (event.key === 'End') {
        event.preventDefault()
        handlePageChange(totalPages)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, totalPages, handlePageChange]) // Added handlePageChange to dependencies

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 8 // Show up to 8 page numbers as requested

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first 8 pages as requested
      for (let i = 1; i <= Math.min(8, totalPages); i++) {
        pages.push(i)
      }
    }

    return pages
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

      {/* Show "No Data Available" if no companies exist */}
      {!isPredictionsLoading && companies.length === 0 && (
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

      {/* Main content area - only show if loading or have companies */}
      {(isPredictionsLoading || companies.length > 0) && (
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
            {/* Left Panel - Company Selection with Pagination */}
            <div className="h-[600px]">
              <Card className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-bricolage">
                    S&P 500 Companies
                  </h3>
                  {isPredictionsLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
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
                      {paginatedCompanies.map((company: any) => (
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
                    </div>

                    {/* Simple Pagination - Prev/Next with page info */}
                    {totalPages > 1 && (
                      <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0">
                        <div className="flex items-center justify-between">
                          {/* Show X per page */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 font-bricolage">Show</span>
                            <Select value={pageSize.toString()} onValueChange={(value) => {
                              setPageSize(Number(value))
                              setCurrentPage(1) // Reset to first page when changing page size
                            }}>
                              <SelectTrigger className="w-14 h-7">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="15">15</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-xs text-gray-600 font-bricolage">per page</span>
                          </div>

                          {/* Page info and navigation */}
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage <= 1}
                              className="h-7 px-2 text-xs font-bricolage"
                            >
                              Prev
                            </Button>

                            <span className="text-xs text-gray-600 font-bricolage">
                              Page {currentPage} of {totalPages}
                            </span>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage >= totalPages || (isPredictionsLoading && currentPage * itemsPerPage > totalLoadedCompanies)}
                              className="h-7 px-2 text-xs font-bricolage"
                            >
                              {isPredictionsLoading && currentPage * itemsPerPage > totalLoadedCompanies ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Next'
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Status info */}
                        <div className="text-center mt-2">
                          <span className="text-xs text-gray-500 font-bricolage">
                            {totalLoadedCompanies < estimatedTotalCompanies
                              ? `Showing ${totalLoadedCompanies} companies loaded (estimated ${estimatedTotalCompanies} total)`
                              : `Showing ${totalLoadedCompanies} companies`
                            }
                          </span>
                        </div>
                      </div>
                    )}
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
