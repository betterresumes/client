'use client'

import { useState, useMemo, useEffect } from 'react'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
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
    getPredictionProbability,
    getRiskBadgeColor,
    formatPredictionDate,
    isFetching,
    annualPagination,
    quarterlyPagination,
    fetchPage
  } = usePredictionsStore()

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

  // Removed client-side pagination - using only server-side pagination
  const [sortField, setSortField] = useState<SortField>('company')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Dialog states (only for delete)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null)

  // Reset to first page when filters change
  useEffect(() => {
    if (pagination.currentPage !== 1) {
      fetchPage(type, 1)
    }
  }, [searchTerm, selectedSector, selectedRiskLevel])

  // Filter and sort data (client-side for current page only)
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((item: any) => {
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
  }, [data, searchTerm, selectedSector, selectedRiskLevel, sortField, sortDirection, getPredictionProbability, formatPredictionDate])

  // Use filtered data directly (no client-side pagination slicing)
  const currentData = filteredAndSortedData

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Server-side page change handler
  const handlePageChange = (page: number) => {
    console.log(`📄 Fetching page ${page} for ${type} predictions`)
    fetchPage(type, page)
  }

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
    const showPages = 5

    if (pagination.totalPages <= showPages) {
      for (let i = 1; i <= pagination.totalPages; i++) {
        pages.push(i)
      }
    } else {
      const start = Math.max(1, pagination.currentPage - 2)
      const end = Math.min(pagination.totalPages, start + showPages - 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
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



  if (data.length === 0 && !isLoading) {
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
                ? "Loading companies..."
                : `Showing page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.totalItems} total ${type} predictions)`
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
                          <div className="font-semibold text-gray-900 dark:text-white font-bricolage">{item.company_symbol}</div>
                          <div className="text-sm text-gray-500 font-bricolage">{item.company_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bricolage">{item.sector || 'N/A'}</TableCell>
                      <TableCell className='pl-6'>
                        <Badge className={`${getRiskBadgeColor(item.risk_level || item.risk_category || 'unknown')} font-bricolage`}>
                          {(getPredictionProbability(item) * 100).toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className='pl-10'>
                        <Badge className={`${getRiskBadgeColor(item.risk_level || item.risk_category || 'unknown')} font-bricolage`}>
                          {item.risk_level || item.risk_category || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-blue-600 font-bricolage">
                          {formatPredictionDate(item)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1 font-bricolage">
                          {item.financial_ratios ? (
                            <>
                              <div>ROA: {item.financial_ratios.roa || 'N/A'}</div>
                              <div>LTD/TC: {item.financial_ratios.ltdtc || 'N/A'}</div>
                              <div>EBIT/Int: {item.financial_ratios.ebitint || 'N/A'}</div>
                            </>
                          ) : (
                            <div>No ratios available</div>
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

        {/* Server-side Pagination Info and Load More */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600 font-bricolage">
            Loaded {data.length} of {pagination.totalItems} {type} predictions
            {pagination.totalPages > 1 && (
              <span className="ml-2 text-gray-500">
                (Server: page {pagination.currentPage} of {pagination.totalPages})
              </span>
            )}
          </div>

        </div>

        {/* Server-side Pagination - Always show if we have pagination data */}
        {(pagination.totalPages > 1 || pagination.totalItems > 10) && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500 font-bricolage">
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total results)
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || isFetching}
                className="flex items-center gap-1 font-bricolage"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page) => (
                  <Button
                    key={page}
                    variant={pagination.currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    disabled={isFetching}
                    className="w-8 h-8 p-0 font-bricolage"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages || isFetching}
                className="flex items-center gap-1 font-bricolage"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
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
