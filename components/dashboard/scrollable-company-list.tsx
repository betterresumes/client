'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Search, X, Loader2, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCompanies } from '@/lib/hooks/use-companies'
import { companiesApi } from '@/lib/api/companies'
import type { Company } from '@/lib/types/company'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer'
import { useDashboardStore } from '@/lib/stores/dashboard-store'

interface CompanyListItem {
  id: string
  name: string
  subtitle: string
  symbol?: string
  sector?: string
  defaultRate?: string
  riskCategory?: string
  predictions?: any[]
}

interface ScrollableCompanyListProps {
  onCompanySelect: (companyId: string) => void
  selectedCompanyId?: string | null
  className?: string
}

export function ScrollableCompanyList({
  onCompanySelect,
  selectedCompanyId,
  className = ''
}: ScrollableCompanyListProps) {
  const { selectedCompany, setSelectedCompany } = useDashboardStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [allCompanies, setAllCompanies] = useState<CompanyListItem[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalCompanies, setTotalCompanies] = useState(0)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const companyListRef = useRef<HTMLDivElement>(null)
  const companyItemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Get predictions to merge with company data
  const {
    annualPredictions,
    quarterlyPredictions,
    systemAnnualPredictions,
    systemQuarterlyPredictions,
    getFilteredPredictions,
    fetchPredictions,
    isLoading: isPredictionsLoading,
    activeDataFilter
  } = usePredictionsStore()

  const pageSize = 50 // Load 50 companies at a time
  const isInitialLoading = isPredictionsLoading

  // Ensure predictions are loaded on mount
  useEffect(() => {
    const allPredictions = [
      ...getFilteredPredictions('annual'),
      ...getFilteredPredictions('quarterly')
    ]

    console.log('🔄 Initial predictions check:', {
      allPredictionsLength: allPredictions.length,
      isPredictionsLoading,
      activeDataFilter
    })

    if (allPredictions.length === 0 && !isPredictionsLoading) {
      console.log('🔄 No predictions found, fetching...')
      fetchPredictions()
    }
  }, [getFilteredPredictions, isPredictionsLoading, fetchPredictions, activeDataFilter])

  // Listen for data filter changes to refresh company list
  useEffect(() => {
    const handleDataFilterChanged = (event: CustomEvent) => {
      console.log('🔄 Company list: Data filter changed via event:', event.detail)
      // The main useEffect will handle the refresh since it depends on activeDataFilter
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('data-filter-changed', handleDataFilterChanged as EventListener)
      return () => {
        window.removeEventListener('data-filter-changed', handleDataFilterChanged as EventListener)
      }
    }
  }, [])

  // Load more companies function
  const loadMoreCompanies = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const nextPage = Math.floor(allCompanies.length / pageSize) + 1
      const response = await companiesApi.getCompanies({
        page: nextPage,
        limit: pageSize,
        search: searchQuery.trim() || undefined,
      })

      if (response.success && response.data) {
        const newCompanies: CompanyListItem[] = response.data.items?.map((company: any) => ({
          id: company.id || company.symbol,
          name: company.symbol || company.name,
          subtitle: company.name || company.symbol,
          symbol: company.symbol,
          sector: company.sector || 'Unknown',
          defaultRate: '0.00%',
          riskCategory: 'MEDIUM',
          predictions: []
        })) || []

        if (newCompanies.length === 0) {
          setHasMore(false)
        } else {
          setAllCompanies(prev => [...prev, ...newCompanies])
          setTotalCompanies(response.data.total || 0)
        }
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more companies:', error)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [allCompanies.length, hasMore, isLoadingMore, pageSize, searchQuery])

  // Intersection observer for infinite scroll
  useIntersectionObserver(loadMoreRef, loadMoreCompanies, {
    threshold: 0.1,
    rootMargin: '100px',
  })

  // Initialize companies from predictions data - respecting data source filter
  useEffect(() => {
    console.log('🔄 Company list: Data filter changed to:', activeDataFilter)

    // Get filtered predictions based on current data source selection
    const filteredAnnualPredictions = getFilteredPredictions('annual')
    const filteredQuarterlyPredictions = getFilteredPredictions('quarterly')

    const allFilteredPredictions = [
      ...filteredAnnualPredictions,
      ...filteredQuarterlyPredictions
    ]

    console.log('📊 Filtered Predictions for company list:', {
      dataFilter: activeDataFilter,
      annualCount: filteredAnnualPredictions.length,
      quarterlyCount: filteredQuarterlyPredictions.length,
      totalCount: allFilteredPredictions.length,
      sampleData: allFilteredPredictions.slice(0, 3)
    })

    // Debug: Check what data we have in stores
    console.log('🔍 Raw store data:', {
      annualPredictions: annualPredictions.length,
      quarterlyPredictions: quarterlyPredictions.length,
      systemAnnualPredictions: systemAnnualPredictions.length,
      systemQuarterlyPredictions: systemQuarterlyPredictions.length,
      activeDataFilter: activeDataFilter
    })

    if (allFilteredPredictions.length > 0) {
      // Debug: Check the structure of predictions
      console.log('🔍 First 3 predictions structure:', allFilteredPredictions.slice(0, 3))

      // Extract company symbols and check for issues
      const companySymbols = allFilteredPredictions.map((pred: any) => pred.company_symbol).filter(Boolean)
      console.log('🔍 Company symbols found:', companySymbols.slice(0, 10))
      console.log('🔍 Total company symbols:', companySymbols.length)

      // Extract unique companies from filtered predictions
      const uniqueCompanies: CompanyListItem[] = Array.from(
        new Set(companySymbols)
      ).map(symbol => {
        const pred = allFilteredPredictions.find((p: any) => p.company_symbol === symbol)
        console.log(`🔍 Processing company ${symbol}:`, pred)
        return {
          id: symbol,
          name: symbol,
          subtitle: pred?.company_name || symbol,
          symbol: symbol,
          sector: pred?.sector || 'Unknown',
          defaultRate: `${((pred?.default_probability || pred?.probability || 0) * 100).toFixed(2)}%`,
          riskCategory: pred?.risk_category || pred?.risk_level || 'MEDIUM',
          predictions: allFilteredPredictions.filter((p: any) => p.company_symbol === symbol)
        }
      })

      console.log('🏢 Unique companies extracted:', uniqueCompanies.length, uniqueCompanies.slice(0, 3))

      setAllCompanies(uniqueCompanies)
      setTotalCompanies(uniqueCompanies.length)
      setHasMore(false) // No pagination needed for now, we have all companies

      // Clear any selected company if it's not in the new list
      if (selectedCompany && !uniqueCompanies.find(c => c.id === selectedCompany)) {
        console.log('🔄 Clearing selected company as it\'s not in filtered data')
        setSelectedCompany(null)
      } else if ((selectedCompany || selectedCompanyId) && uniqueCompanies.find(c => c.id === (selectedCompanyId || selectedCompany))) {
        // If we have a selected company and it's in the new list, scroll to it after a brief delay
        const targetCompanyId = selectedCompanyId || selectedCompany
        console.log('🎯 Company list updated with selected company, will scroll to:', targetCompanyId)
        setTimeout(() => {
          scrollToSelectedCompany(targetCompanyId!)
        }, 200) // Slightly longer delay to ensure DOM is fully rendered
      }
    } else {
      // No predictions available for current filter
      console.log('📭 No predictions found for current data filter:', activeDataFilter)
      console.log('📭 Store state check:', {
        totalAnnual: annualPredictions.length,
        totalQuarterly: quarterlyPredictions.length,
        totalSystemAnnual: systemAnnualPredictions.length,
        totalSystemQuarterly: systemQuarterlyPredictions.length,
        isPredictionsLoading,
        activeDataFilter
      })

      // If we're looking for system data but have no system predictions loaded, try fetching
      if (activeDataFilter === 'system' &&
        systemAnnualPredictions.length === 0 &&
        systemQuarterlyPredictions.length === 0 &&
        !isPredictionsLoading) {
        console.log('🔄 No system data found, triggering fetch...')
        fetchPredictions(true) // Force refresh
      }

      setAllCompanies([])
      setTotalCompanies(0)
      setHasMore(false)
      setSelectedCompany(null)
    }
  }, [getFilteredPredictions, activeDataFilter, selectedCompany, setSelectedCompany, annualPredictions.length, quarterlyPredictions.length, systemAnnualPredictions.length, systemQuarterlyPredictions.length, isPredictionsLoading, fetchPredictions])

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCompanies
    }

    const query = searchQuery.toLowerCase()
    return allCompanies.filter(company =>
      company.name?.toLowerCase().includes(query) ||
      company.subtitle?.toLowerCase().includes(query) ||
      company.symbol?.toLowerCase().includes(query) ||
      company.sector?.toLowerCase().includes(query)
    )
  }, [allCompanies, searchQuery])

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompany(companyId)
    onCompanySelect(companyId)
  }

  // Function to scroll to selected company
  const scrollToSelectedCompany = useCallback((companyId: string, retryCount = 0) => {
    const companyElement = companyItemRefs.current[companyId]
    const listContainer = companyListRef.current

    if (companyElement && listContainer) {
      console.log('📍 Scrolling to selected company:', companyId)

      // Calculate the position to scroll to (center the company in view)
      const containerRect = listContainer.getBoundingClientRect()
      const companyRect = companyElement.getBoundingClientRect()

      const scrollTop = listContainer.scrollTop
      const companyOffsetTop = companyRect.top - containerRect.top + scrollTop
      const containerHeight = containerRect.height
      const companyHeight = companyRect.height

      // Calculate center position
      const targetScrollTop = companyOffsetTop - (containerHeight / 2) + (companyHeight / 2)

      // Smooth scroll to the target position
      listContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      })
    } else if (retryCount < 3) {
      // Retry if element not found (DOM might still be updating)
      console.log(`🔄 Company element not found, retrying... (${retryCount + 1}/3)`)
      setTimeout(() => {
        scrollToSelectedCompany(companyId, retryCount + 1)
      }, 200)
    } else {
      console.log('❌ Could not scroll to company after 3 retries:', companyId)
    }
  }, [])

  // Effect to scroll to selected company when it changes
  useEffect(() => {
    const currentSelectedCompany = selectedCompanyId || selectedCompany

    if (currentSelectedCompany && allCompanies.length > 0 && !searchQuery.trim()) {
      // Only scroll if not searching (to avoid scrolling when company is filtered out)
      // Check if the selected company exists in the current filtered list
      const companyExists = filteredCompanies.some(c => c.id === currentSelectedCompany)

      if (companyExists) {
        console.log('🎯 Selected company changed, scrolling to:', currentSelectedCompany)
        // Small delay to ensure DOM has updated
        setTimeout(() => {
          scrollToSelectedCompany(currentSelectedCompany)
        }, 100)
      }
    }
  }, [selectedCompanyId, selectedCompany, allCompanies, filteredCompanies, searchQuery, scrollToSelectedCompany])

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
    <Card className={`p-4 h-full flex flex-col ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-bricolage">
            {activeDataFilter === 'system' ? 'Platform Companies' :
              activeDataFilter === 'organization' ? 'Your Organization Companies' :
                'Your Companies'}
          </h3>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 font-bricolage">
              {activeDataFilter === 'system' ? 'Platform Data' :
                activeDataFilter === 'organization' ? 'Your Org Data' :
                  'Your Data'}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                console.log('🔄 Manual refresh triggered')
                fetchPredictions(true)
              }}
              className="h-6 px-2 text-xs font-bricolage"
            >
              Refresh
            </Button>
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
            `Showing ${allCompanies.length} of ${totalCompanies.toLocaleString()} companies`
          )}
        </div>
      </div>

      {/* Company List */}
      <div
        ref={companyListRef}
        className="flex-1 overflow-y-auto space-y-2"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6'
        }}
      >
        {isInitialLoading && allCompanies.length === 0 ? (
          // Loading skeleton
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
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
        ) : filteredCompanies.length === 0 ? (
          // No results
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Building2 className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              No Companies Found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {searchQuery.trim()
                ? `No companies match "${searchQuery}"`
                : activeDataFilter === 'system'
                  ? "No platform companies available"
                  : activeDataFilter === 'organization'
                    ? "No organization companies available"
                    : "No personal companies available"
              }
            </p>
          </div>
        ) : (
          // Company list
          <>
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                ref={(el) => {
                  if (el) {
                    companyItemRefs.current[company.id] = el
                  } else {
                    delete companyItemRefs.current[company.id]
                  }
                }}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out border font-bricolage scroll-mt-4 ${(selectedCompanyId || selectedCompany) === company.id
                  ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900 ring-opacity-50'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                onClick={() => handleCompanySelect(company.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{company.name}</div>
                    <div className={`text-xs truncate ${(selectedCompanyId || selectedCompany) === company.id
                      ? 'text-gray-300'
                      : 'text-gray-500 dark:text-gray-400'
                      }`}>
                      {company.subtitle}
                    </div>
                    {company.sector && (
                      <div className={`text-xs mt-1 truncate ${(selectedCompanyId || selectedCompany) === company.id
                        ? 'text-gray-400'
                        : 'text-gray-400'
                        }`}>
                        {company.sector}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-2">
                    <div className={`text-sm font-medium ${getDefaultRateColor(company.riskCategory!)}`}>
                      {company.defaultRate}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getRiskColor(company.riskCategory!)}`}
                    >
                      {company.riskCategory}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}

            {/* Load more trigger */}
            {!searchQuery.trim() && hasMore && (
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-bricolage">Loading more companies...</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreCompanies}
                    className="font-bricolage"
                  >
                    Load More Companies
                  </Button>
                )}
              </div>
            )}

            {/* End of list indicator */}
            {!hasMore && !searchQuery.trim() && allCompanies.length > 0 && (
              <div className="py-4 text-center">
                <div className="text-xs text-gray-500 font-bricolage">
                  Showing all {allCompanies.length} companies
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
