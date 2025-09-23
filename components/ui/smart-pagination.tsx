'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SmartPaginationProps {
  // Data info
  currentPage: number
  pageSize: number
  totalItems: number
  loadedItems: number

  // Callbacks
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onLoadMore?: () => void

  // Options
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  showLoadedInfo?: boolean
  className?: string
  disabled?: boolean
}

export function SmartPagination({
  currentPage,
  pageSize,
  totalItems,
  loadedItems,
  onPageChange,
  onPageSizeChange,
  onLoadMore,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
  showLoadedInfo = true,
  className = '',
  disabled = false
}: SmartPaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)
  const currentPageStartItem = (currentPage - 1) * pageSize + 1
  const currentPageEndItem = Math.min(currentPage * pageSize, loadedItems)
  const needsMoreData = currentPageEndItem < endItem

  // Handle page changes
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || disabled) return

    // Check if we need to load more data for this page
    const pageStartIndex = (page - 1) * pageSize
    const pageEndIndex = page * pageSize

    if (pageEndIndex > loadedItems && onLoadMore) {
      console.log(`🔄 Need to load more data for page ${page}`)
      onLoadMore()
    }

    onPageChange(page)
  }

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 7
    const halfVisible = Math.floor(maxVisible / 2)

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      let start = Math.max(1, currentPage - halfVisible)
      let end = Math.min(totalPages, start + maxVisible - 1)

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1)
      }

      if (start > 1) {
        pages.push(1)
        if (start > 2) pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || disabled) return

      if (event.key === 'ArrowLeft' && currentPage > 1) {
        event.preventDefault()
        handlePageChange(currentPage - 1)
      } else if (event.key === 'ArrowRight' && currentPage < totalPages) {
        event.preventDefault()
        handlePageChange(currentPage + 1)
      } else if (event.key === 'Home' && currentPage > 1) {
        event.preventDefault()
        handlePageChange(1)
      } else if (event.key === 'End' && currentPage < totalPages) {
        event.preventDefault()
        handlePageChange(totalPages)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, totalPages, disabled])

  if (totalItems === 0) return null

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Page size and info row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showPageSizeSelector && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-bricolage">Show:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(Number(value))}
                disabled={disabled}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600 font-bricolage">per page</span>
            </div>
          )}

          {showLoadedInfo && (
            <div className="text-sm text-gray-500 font-bricolage">
              Loaded {loadedItems} of {totalItems} items
              {needsMoreData && (
                <span className="text-orange-600 ml-2">
                  (Loading more needed for page {currentPage})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick page jump */}
        {totalPages > 5 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-bricolage">Go to:</span>
            <Select
              value={currentPage.toString()}
              onValueChange={(value) => handlePageChange(Number(value))}
              disabled={disabled}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <SelectItem key={page} value={page.toString()}>
                    {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Main pagination controls */}
      <div className="flex items-center justify-center gap-2">
        {/* First page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || disabled}
          className="font-bricolage"
        >
          First
        </Button>

        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          className="flex items-center gap-1 font-bricolage"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <Button
              key={index}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === 'number' ? handlePageChange(page) : undefined}
              disabled={disabled || typeof page !== 'number'}
              className={`font-bricolage ${typeof page === 'number' ? 'w-10 h-8 p-0' : 'w-10 h-8 p-0 cursor-default'
                }`}
            >
              {page === '...' ? <MoreHorizontal className="w-4 h-4" /> : page}
            </Button>
          ))}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          className="flex items-center gap-1 font-bricolage"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || disabled}
          className="font-bricolage"
        >
          Last
        </Button>
      </div>

      {/* Bottom info */}
      <div className="text-center">
        <p className="text-xs text-gray-500 font-bricolage">
          Showing {startItem}-{endItem} of {totalItems} results (Page {currentPage} of {totalPages})
          {totalPages > 1 && (
            <span className="ml-2 text-gray-400">
              • Use ← → keys to navigate
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
