'use client'

import { useState, useMemo, useEffect } from 'react'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { useDashboardStatsStore } from '@/lib/stores/dashboard-stats-store'
import { useAuthStore } from '@/lib/stores/auth-store'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BarChart3,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { DeletePredictionDialog } from './delete-prediction-dialog'

interface CompanyAnalysisTableProps {
  data: any[]
  type: 'annual' | 'quarterly'
  searchTerm: string
  selectedSector: string
  selectedRiskLevel: string
  isLoading: boolean
  onRefetch: () => void
}

type SortField = 'company' | 'defaultRate' | 'riskCategory' | 'sector' | 'reportingPeriod'
type SortDirection = 'asc' | 'desc'

export function CompanyAnalysisTable({
  data,
  type,
  searchTerm,
  selectedSector,
  selectedRiskLevel,
  isLoading,
  onRefetch
}: CompanyAnalysisTableProps) {
  const {
    annualPredictions,
    quarterlyPredictions,
    isLoading: isStoreLoading,
    getPredictionProbability,
    getRiskBadgeColor,
    formatPredictionDate,
    isFetching,
    annualPagination,
    quarterlyPagination,
    fetchPredictions,
    activeDataFilter,
    getFilteredPredictions // FIXED: Add filtered predictions function
  } = usePredictionsStore()

  const { stats: dashboardStats } = useDashboardStatsStore()
  const { user, isAdmin } = useAuthStore()

  // Get pagination info for current prediction type
  const pagination = type === 'annual' ? annualPagination : quarterlyPagination

  console.log(`📊 TABLE: ${type} pagination info:`, {
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    pageSize: pagination.pageSize,
    hasMore: pagination.hasMore,
    dataLength: data.length
  })

  const { navigateToCompanyDetails, navigateToCustomAnalysisWithData, setActiveTab } = useDashboardStore()

  // Smart pagination state - connects to API when needed  
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<SortField>('company')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)  // Use local state for pagination
  const [isLoadingBatch, setIsLoadingBatch] = useState(false) // Prevent simultaneous API calls
  const [loadedBatches, setLoadedBatches] = useState<Set<number>>(new Set()) // Track which batches have been loaded

  // Get total predictions from dashboard stats for smart pagination - FIXED for annual/quarterly
  const getTotalPredictionsFromStats = (predictionType: 'annual' | 'quarterly') => {
    if (!dashboardStats) return data.length

    // Get the appropriate total based on prediction type and user scope
    if (activeDataFilter === 'system' && dashboardStats.platform_statistics) {
      return predictionType === 'annual'
        ? dashboardStats.platform_statistics.annual_predictions || data.length
        : dashboardStats.platform_statistics.quarterly_predictions || data.length
    } else if (activeDataFilter === 'user' && dashboardStats.user_dashboard) {
      return predictionType === 'annual'
        ? dashboardStats.user_dashboard.annual_predictions || data.length
        : dashboardStats.user_dashboard.quarterly_predictions || data.length
    }

    // Fallback to main dashboard stats
    return predictionType === 'annual'
      ? dashboardStats.annual_predictions || data.length
      : dashboardStats.quarterly_predictions || data.length
  }

  const totalPredictionsInDB = getTotalPredictionsFromStats(type)

  // FIXED: Use filtered predictions instead of raw store data
  const storeData = getFilteredPredictions(type) // Use filtered data instead of raw store data
  const actualData = storeData || data // Fallback to prop data if store is empty
  const totalLoadedPredictions = actualData.length

  console.log(`🔧 FIXED - Using filtered predictions:`, {
    type,
    activeDataFilter,
    propDataLength: data.length,
    filteredDataLength: storeData.length,
    actualDataUsed: actualData.length,
    totalInDB: totalPredictionsInDB
  })

  // Filter and sort data (client-side) - now using store data!
  const filteredAndSortedData = useMemo(() => {
    let filtered = actualData.filter((item: any) => {
      // Search filter
      const searchMatch = searchTerm === '' ||
        item.company_symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.company_name?.toLowerCase().includes(searchTerm.toLowerCase())

      // Sector filter
      const sectorMatch = selectedSector === 'all' ||
        item.sector?.toLowerCase() === selectedSector.toLowerCase()

      // Risk level filter
      const riskMatch = selectedRiskLevel === 'all' ||
        (item.risk_level || item.risk_category)?.toLowerCase() === selectedRiskLevel.toLowerCase()

      return searchMatch && sectorMatch && riskMatch
    })

    // Sort data
    filtered.sort((a: any, b: any) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'company':
          aValue = a.company_symbol || ''
          bValue = b.company_symbol || ''
          break
        case 'defaultRate':
          aValue = getPredictionProbability(a)
          bValue = getPredictionProbability(b)
          break
        case 'riskCategory':
          aValue = a.risk_level || a.risk_category || ''
          bValue = b.risk_level || b.risk_category || ''
          break
        case 'sector':
          aValue = a.sector || ''
          bValue = b.sector || ''
          break
        case 'reportingPeriod':
          aValue = formatPredictionDate(a)
          bValue = formatPredictionDate(b)
          break
        default:
          return 0
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [actualData, searchTerm, selectedSector, selectedRiskLevel, sortField, sortDirection, getPredictionProbability, formatPredictionDate])

  // Get paginated data - only show items for current page
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAndSortedData.slice(startIndex, endIndex)
  }, [filteredAndSortedData, currentPage, pageSize])

  // Smart pagination - calculate total pages from database total, not just loaded data
  const realTotalPages = Math.ceil(totalPredictionsInDB / pageSize) // Based on actual DB total
  const loadedPages = Math.ceil(totalLoadedPredictions / pageSize) // Based on loaded data
  const totalPages = Math.max(realTotalPages, loadedPages) // Use the higher value

  console.log(`📊 Smart Pagination for ${type}:`, {
    totalLoadedPredictions,
    totalPredictionsInDB,
    filteredDataLength: filteredAndSortedData.length,
    realTotalPages,
    loadedPages,
    totalPages,
    currentPage,
    pageSize,
    'PAGINATION_SOURCE': 'local calculation',
    'STORE_CURRENT_PAGE': pagination?.currentPage,
    'STORE_TOTAL_PAGES': pagination?.totalPages
  })

  // Use paginated data for display
  const currentData = paginatedData

  // Dialog states (only for delete)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1) // Use local state
  }, [searchTerm, selectedSector, selectedRiskLevel])

  // Simple batch loading - trigger only at pages 6, 16, 26, etc.
  useEffect(() => {
    // Don't trigger if already loading or fetching  
    if (isLoadingBatch || isLoading || isFetching) return

    // Only trigger at specific threshold pages (6, 16, 26, etc.)
    const isTriggerPage = currentPage % 10 === 6
    if (!isTriggerPage) return

    const currentBatch = Math.floor((currentPage - 1) / 10) + 1

    // Don't load if this batch has already been loaded
    if (loadedBatches.has(currentBatch)) {
      console.log(`📦 Batch ${currentBatch} already loaded for ${type} - skipping`)
      return
    }

    const currentlyLoaded = actualData.length
    const totalAvailable = totalPredictionsInDB
    const expectedDataForBatch = currentBatch * 100
    const needsThisBatch = currentlyLoaded < expectedDataForBatch && currentlyLoaded < totalAvailable

    if (needsThisBatch) {
      console.log(`🚀 BATCH ${currentBatch}: Loading 100 ${type} predictions at page ${currentPage}`)
      setIsLoadingBatch(true)

      // Mark this batch as being loaded
      setLoadedBatches(prev => new Set([...prev, currentBatch]))

      // Use fetchPredictions to refresh data
      fetchPredictions(true)
        .finally(() => setIsLoadingBatch(false))
    }
  }, [currentPage, type, totalPredictionsInDB, isLoadingBatch, isLoading, isFetching, fetchPredictions, loadedBatches])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Smart page change handler - simplified to just change pages
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || isLoadingBatch) return

    console.log(`📄 Page change for ${type}: ${currentPage} → ${page}`)

    // Update local pagination state
    setCurrentPage(page)

    // Note: Batch loading is handled by the threshold useEffect (pages 6, 16, 26, etc.)
  }

  // Keyboard navigation
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
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, totalPages])

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="h-4 w-4 opacity-100" /> :
      <ArrowDown className="h-4 w-4 opacity-100" />
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 7
    const halfVisible = Math.floor(maxVisiblePages / 2)

    if (pagination.totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= pagination.totalPages; i++) {
        pages.push(i)
      }
    } else {
      let start = Math.max(1, pagination.currentPage - halfVisible)
      let end = Math.min(pagination.totalPages, start + maxVisiblePages - 1)

      // Adjust start if we're near the end
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1)
      }

      // Add ellipsis and first page if needed
      if (start > 1) {
        pages.push(1)
        if (start > 2) pages.push('...')
      }

      // Add visible page range
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis and last page if needed
      if (end < pagination.totalPages) {
        if (end < pagination.totalPages - 1) pages.push('...')
        pages.push(pagination.totalPages)
      }
    }

    return pages
  }

  // Action handlers
  const handleViewDetails = (item: any) => {
    navigateToCompanyDetails(item.company_symbol, type)
  }

  const handleEdit = (item: any) => {
    // Navigate to custom analysis with prefilled data
    navigateToCustomAnalysisWithData(item, type)
  }

  const handleDelete = (item: any) => {
    setSelectedPrediction(item)
    setDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setDeleteDialogOpen(false)
    setSelectedPrediction(null)
  }



  if (actualData.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <BarChart3 className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 font-bricolage">
          No {type === 'annual' ? 'Annual' : 'Quarterly'} Predictions Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 font-bricolage">
          No {type} prediction data found. Please check your authentication or try refreshing the data.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefetch}
          className="mt-4 font-bricolage"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Loading Data
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Table Header with Info and Pagination Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-bricolage">
              {type === 'annual' ? 'Annual Analysis' : 'Quarterly Analysis'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-bricolage">
              {isLoading
                ? "Loading predictions..."
                : totalLoadedPredictions < totalPredictionsInDB
                  ? `${filteredAndSortedData.length} filtered from ${totalLoadedPredictions} loaded (${totalPredictionsInDB} total ${type} predictions)`
                  : `${filteredAndSortedData.length} of ${totalLoadedPredictions} ${type} predictions`
              }
            </p>
          </div>
        </div>

        {/* Table */}
        {filteredAndSortedData.length > 0 || isLoading ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {isLoading ? (
                      <p className="text-sm text-gray-600 font-semibold font-bricolage">Company</p>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('company')}
                        className="h-auto p-0 font-semibold flex items-center space-x-1 group font-bricolage"
                      >
                        <span>Company</span>
                        {getSortIcon('company')}
                      </Button>
                    )}
                  </TableHead>
                  <TableHead>
                    {isLoading ? (
                      <p className="text-sm text-gray-600 font-semibold font-bricolage">Sector</p>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('sector')}
                        className="h-auto p-0 font-semibold flex items-center space-x-1 group font-bricolage"
                      >
                        <span>Sector</span>
                        {getSortIcon('sector')}
                      </Button>
                    )}
                  </TableHead>
                  <TableHead>
                    {isLoading ? (
                      <p className="text-sm text-gray-600 font-semibold font-bricolage">Default Rate</p>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('defaultRate')}
                        className="h-auto p-0 font-semibold flex items-center space-x-1 group font-bricolage"
                      >
                        <span>Default Rate</span>
                        {getSortIcon('defaultRate')}
                      </Button>
                    )}
                  </TableHead>
                  <TableHead>
                    {isLoading ? (
                      <p className="text-sm text-gray-600 font-semibold font-bricolage">Risk Category</p>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('riskCategory')}
                        className="h-auto p-0 font-semibold flex items-center space-x-1 group font-bricolage"
                      >
                        <span>Risk Category</span>
                        {getSortIcon('riskCategory')}
                      </Button>
                    )}
                  </TableHead>
                  <TableHead>
                    {isLoading ? (
                      <p className="text-sm text-gray-600 font-semibold font-bricolage">{type === 'annual' ? 'Period' : 'Quarter'}</p>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('reportingPeriod')}
                        className="h-auto p-0 font-semibold flex items-center space-x-1 group font-bricolage"
                      >
                        <span>{type === 'annual' ? 'Period' : 'Quarter'}</span>
                        {getSortIcon('reportingPeriod')}
                      </Button>
                    )}
                  </TableHead>
                  <TableHead>
                    <p className="text-sm text-gray-600 font-semibold font-bricolage">Key Ratios</p>
                  </TableHead>
                  <TableHead>
                    <p className="text-sm text-gray-600 font-semibold font-bricolage">Actions</p>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <Skeleton className="h-5 w-16 mb-1" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-12" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-4 h-4" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-8" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  currentData.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className='pl-5'>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white font-bricolage text-sm">{item.company_symbol}</div>
                          <div className="text-xs text-gray-500 font-bricolage">{item.company_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bricolage text-sm">{item.sector || 'N/A'}</TableCell>
                      <TableCell className='pl-6'>
                        <Badge className={`${getRiskBadgeColor(item.risk_level || item.risk_category || 'unknown')} font-bricolage text-xs`}>
                          {(getPredictionProbability(item) * 100).toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className='pl-10'>
                        <Badge className={`${getRiskBadgeColor(item.risk_level || item.risk_category || 'unknown')} font-bricolage text-xs`}>
                          {item.risk_level || item.risk_category || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-blue-600 font-bricolage text-xs">
                          {formatPredictionDate(item)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1 font-bricolage">
                          {item.financial_ratios ? (
                            <>
                              <div className="text-xs">ROA: {item.financial_ratios.roa || 'N/A'}</div>
                              <div className="text-xs">LTD/TC: {item.financial_ratios.ltdtc || 'N/A'}</div>
                              <div className="text-xs">EBIT/Int: {item.financial_ratios.ebitint || 'N/A'}</div>
                            </>
                          ) : (
                            <div className="text-xs">No ratios available</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="font-bricolage"
                              onClick={() => handleViewDetails(item)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {/* Hide Edit/Delete options for non-super admin users when viewing platform data */}
                            {(isAdmin() || activeDataFilter !== 'system') && (
                              <>
                                <DropdownMenuItem
                                  className="font-bricolage"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 font-bricolage"
                                  onClick={() => handleDelete(item)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <BarChart3 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 font-bricolage">
              No Results Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 font-bricolage">
              No companies match your current filter criteria. Try adjusting your search or filters.
            </p>
          </div>
        )}

        {/* Smart Pagination - Show per page + page numbers + Next */}
        {filteredAndSortedData.length > 0 && totalPages > 1 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {/* Show X per page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-bricolage">Show</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value))
                    setCurrentPage(1) // Reset to first page using local state
                  }}
                >
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600 font-bricolage">per page</span>
              </div>

              {/* Page numbers - show up to 8 + Next */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(8, totalPages) }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      console.log(`🎯 Clicking page ${page}, current: ${currentPage}`)
                      handlePageChange(page)
                    }}
                    disabled={isLoadingBatch}
                    className="font-bricolage w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log(`🎯 Clicking Next, current: ${currentPage}, total: ${totalPages}`)
                    handlePageChange(currentPage + 1)
                  }}
                  disabled={currentPage >= totalPages || isLoadingBatch}
                  className="font-bricolage ml-2"
                >
                  {isLoadingBatch ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Next
                </Button>
              </div>
            </div>

            {/* Status info */}
            <div className="text-center mt-3">
              <span className="text-xs text-gray-500 font-bricolage">
                Page {currentPage} of {totalPages}
                {isLoadingBatch && ` (loading more ${type} predictions...)`}
                {!isLoadingBatch && totalLoadedPredictions < totalPredictionsInDB && ` (${totalLoadedPredictions} of ${totalPredictionsInDB} loaded - more will load automatically)`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <DeletePredictionDialog
        isOpen={deleteDialogOpen}
        onClose={closeDialogs}
        prediction={selectedPrediction}
        type={type}
      />
    </>
  )
}
