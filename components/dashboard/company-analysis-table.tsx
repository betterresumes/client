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
  selectedYear: string
  customYear: string
  isLoading: boolean
  onRefetch: () => void
}

type SortField = 'company' | 'defaultRate' | 'riskCategory' | 'sector' | 'reportingPeriod' | 'marketCap'
type SortDirection = 'asc' | 'desc'

export function CompanyAnalysisTable({
  data,
  type,
  searchTerm,
  selectedSector,
  selectedRiskLevel,
  selectedYear,
  customYear,
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

  // Format market cap helper function
  const formatMarketCap = (marketCap: number | undefined | null) => {
    if (!marketCap || marketCap === 0) return 'N/A'

    // The value is in actual dollars, so convert to appropriate units
    if (marketCap >= 1000000000000) {
      // For trillions (1,000,000,000,000+)
      return `$${(marketCap / 1000000000000).toFixed(1)}T`
    } else if (marketCap >= 1000000000) {
      // For billions (1,000,000,000+)
      return `$${(marketCap / 1000000000).toFixed(1)}B`
    } else if (marketCap >= 1000000) {
      // For millions (1,000,000+)
      return `$${(marketCap / 1000000).toFixed(0)}M`
    } else if (marketCap >= 1000) {
      // For thousands (1,000+)
      return `$${(marketCap / 1000).toFixed(0)}K`
    } else {
      // For less than 1000
      return `$${marketCap.toFixed(0)}`
    }
  }

  console.log(`📊 TABLE: ${type} pagination info:`, {
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    pageSize: pagination.pageSize,
    hasMore: pagination.hasMore,
    dataLength: data.length
  })

  const { navigateToCompanyDetails, navigateToCustomAnalysisWithData, setActiveTab } = useDashboardStore()

  // Simple pagination state - all data loaded upfront
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<SortField>('company')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // FIXED: Use filtered predictions from store - all data is now loaded upfront
  const storeData = getFilteredPredictions(type)
  const actualData = storeData.length > 0 ? storeData : data // Use store data if available, fallback to props

  console.log(`🔧 FIXED - Using filtered predictions:`, {
    type,
    activeDataFilter,
    propDataLength: data.length,
    filteredDataLength: storeData.length,
    actualDataUsed: actualData.length,
    message: 'All data loaded upfront - no batch loading needed'
  })

  // Filter and sort data (client-side) - now using store data!
  const filteredAndSortedData = useMemo(() => {
    let filtered = actualData.filter((item: any) => {
      // Search filter
      const searchMatch = searchTerm === '' ||
        item.company_symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.company_name?.toLowerCase().includes(searchTerm.toLowerCase())

      // Sector filter - handle normalized sector values (e.g., "financial-services" -> "Financial Services")
      const sectorMatch = selectedSector === 'all' ||
        item.sector?.toLowerCase().replace(/\s+/g, '-') === selectedSector.toLowerCase()

      // Risk level filter
      const riskMatch = selectedRiskLevel === 'all' ||
        (item.risk_level || item.risk_category)?.toLowerCase() === selectedRiskLevel.toLowerCase()

      // Year filter
      const getItemYear = (item: any) => {
        if (type === 'annual') {
          return item.reporting_year?.toString()
        } else {
          // For quarterly, extract year from reporting_year or created_at
          return item.reporting_year?.toString() || new Date(item.created_at).getFullYear().toString()
        }
      }

      const yearMatch = selectedYear === 'all' ||
        (selectedYear === 'custom' && customYear && getItemYear(item) === customYear) ||
        (selectedYear !== 'custom' && getItemYear(item) === selectedYear)

      return searchMatch && sectorMatch && riskMatch && yearMatch
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
        case 'marketCap':
          aValue = a.market_cap || 0
          bValue = b.market_cap || 0
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
  }, [actualData, searchTerm, selectedSector, selectedRiskLevel, selectedYear, customYear, sortField, sortDirection, getPredictionProbability, formatPredictionDate, formatMarketCap, type])

  // Get paginated data - only show items for current page
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAndSortedData.slice(startIndex, endIndex)
  }, [filteredAndSortedData, currentPage, pageSize])

  // Simple pagination - calculate total pages based on filtered results (all data loaded)
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize)

  console.log(`📊 Simple Pagination for ${type}:`, {
    allDataLength: actualData.length,
    filteredDataLength: filteredAndSortedData.length,
    totalPages,
    currentPage,
    pageSize,
    'PAGINATION_SOURCE': 'client-side filtering of all loaded data',
    'FILTER_STATES': { selectedYear, customYear, searchTerm, selectedSector, selectedRiskLevel }
  })

  // Use paginated data for display
  const currentData = paginatedData

  // Dialog states (only for delete)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1) // Use local state
  }, [searchTerm, selectedSector, selectedRiskLevel, selectedYear, customYear])

  // No batch loading needed - all data is loaded upfront

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Simple page change handler - all data already loaded
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return

    console.log(`📄 Page change for ${type}: ${currentPage} → ${page}`)
    setCurrentPage(page)
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

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      let start = Math.max(1, currentPage - halfVisible)
      let end = Math.min(totalPages, start + maxVisiblePages - 1)

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
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...')
        pages.push(totalPages)
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
                : `${filteredAndSortedData.length} of ${actualData.length} ${type} predictions`
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
                        <span>{type === 'annual' ? 'Year' : 'Quarter'}</span>
                        {getSortIcon('reportingPeriod')}
                      </Button>
                    )}
                  </TableHead>
                  {/* <TableHead>
                    {isLoading ? (
                      <p className="text-sm text-gray-600 font-semibold font-bricolage">Market Cap</p>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('marketCap')}
                        className="h-auto p-0 font-semibold flex items-center space-x-1 group font-bricolage"
                      >
                        <span>Market Cap</span>
                        {getSortIcon('marketCap')}
                      </Button>
                    )}
                  </TableHead> */}
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
                        <Skeleton className="h-4 w-20" />
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
                        <Badge variant="outline" className="text-black font-bricolage text-xs">
                          {type === 'annual' ? (item.reporting_year || 'Unknown') : formatPredictionDate(item)}
                        </Badge>
                      </TableCell>
                      {/* <TableCell className="font-bricolage text-sm">
                        <Badge variant="outline" className="text-black-600 border-border-200 font-bricolage text-xs ml-6">
                          {formatMarketCap(item.market_cap)}
                        </Badge>
                      </TableCell> */}
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
          <div className="text-center py-8 border rounded-xl px-8">
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

              <div className="text-center mt-3">
                <span className="text-xs text-gray-500 font-bricolage">
                  Page {currentPage} of {totalPages}
                </span>
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
                    disabled={false}
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
                  disabled={currentPage >= totalPages}
                  className="font-bricolage ml-2"
                >

                  Next
                </Button>
              </div>
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
