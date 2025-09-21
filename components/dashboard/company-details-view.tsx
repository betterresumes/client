'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
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
  Loader2
} from 'lucide-react'

export function CompanyDetailsView() {
  const { selectedCompany, selectedPredictionType, clearSelection } = useDashboardStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'annual' | 'quarterly'>('annual')
  const itemsPerPage = 5

  const {
    annualPredictions,
    quarterlyPredictions,
    isLoading,
    fetchPredictions
  } = usePredictionsStore()

  // Set active tab based on selectedPredictionType when navigating from table
  useEffect(() => {
    if (selectedPredictionType) {
      setActiveTab(selectedPredictionType)
    }
  }, [selectedPredictionType])

  // Fetch predictions on component mount if not already loaded
  useEffect(() => {
    if (annualPredictions.length === 0 && quarterlyPredictions.length === 0 && !isLoading) {
      fetchPredictions()
    }
  }, [annualPredictions.length, quarterlyPredictions.length, isLoading, fetchPredictions])

  // Ensure predictions are arrays
  const safePredictions = Array.isArray(annualPredictions) ? annualPredictions : []
  const safeQuarterlyPredictions = Array.isArray(quarterlyPredictions) ? quarterlyPredictions : []

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

  // Set first company as selected if none selected
  useEffect(() => {
    if (companies.length > 0 && !selectedCompany && companies[0]) {
      const firstCompany = companies[0]
      // Don't auto-select if coming from navigation, let user choose
      if (!selectedPredictionType) {
        // Only auto-select if not navigated from another view
        // setSelectedCompany(firstCompany.id)
      }
    }
  }, [companies, selectedCompany, selectedPredictionType])

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
  }, [selectedCompany, hasAnnualData, hasQuarterlyData, activeTab])  // Pagination logic
  const totalItems = companies.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCompanies = companies.slice(startIndex, endIndex)
  console.log(paginatedCompanies)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 3

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 2) {
        for (let i = 1; i <= 3; i++) {
          pages.push(i)
        }
      } else if (currentPage >= totalPages - 1) {
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
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

        {/* Tabs - Show when company is selected and has data */}
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

      {/* Loading State for entire component */}
      {isLoading && companies.length === 0 ? (
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
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>

              {isLoading ? (
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
                        onClick={() => {
                          useDashboardStore.getState().setSelectedCompany(company.id)
                        }}
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

                  {/* Pagination - Fixed at bottom */}
                  {totalPages > 1 && (
                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="font-bricolage"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>

                        <div className="flex items-center space-x-1">
                          {getPageNumbers().map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="w-8 h-8 p-0 font-bricolage"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="font-bricolage"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>

                      {/* Page info */}
                      <div className="text-center mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bricolage">
                          Page {currentPage} of {totalPages} • {totalItems} companies
                        </p>
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
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
