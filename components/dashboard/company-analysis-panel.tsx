'use client'

import { useState, useEffect } from 'react'
import { Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CompanyAnalysisPanelProps {
  company: {
    id: string
    name: string
    subtitle: string
    sector: string
    defaultRate: string
    riskCategory: string
  }
  annualPredictions: any[]
  quarterlyPredictions: any[]
  activeTab: 'annual' | 'quarterly'
  isLoading?: boolean
}

export function CompanyAnalysisPanel({
  company,
  annualPredictions = [],
  quarterlyPredictions = [],
  activeTab,
  isLoading = false
}: CompanyAnalysisPanelProps) {
  const [selectedAnnualIndex, setSelectedAnnualIndex] = useState(0)
  const [selectedQuarterlyIndex, setSelectedQuarterlyIndex] = useState(0)

  // When details page asks to focus a specific prediction, update the index
  useEffect(() => {
    const onSelectAnnual = (e: any) => {
      const idx = e?.detail?.index
      if (typeof idx === 'number' && idx >= 0 && idx < annualPredictions.length) {
        setSelectedAnnualIndex(idx)
      }
    }
    const onSelectQuarterly = (e: any) => {
      const idx = e?.detail?.index
      if (typeof idx === 'number' && idx >= 0 && idx < quarterlyPredictions.length) {
        setSelectedQuarterlyIndex(idx)
      }
    }

    window.addEventListener('company-details-select-annual-index', onSelectAnnual as EventListener)
    window.addEventListener('company-details-select-quarterly-index', onSelectQuarterly as EventListener)
    return () => {
      window.removeEventListener('company-details-select-annual-index', onSelectAnnual as EventListener)
      window.removeEventListener('company-details-select-quarterly-index', onSelectQuarterly as EventListener)
    }
  }, [annualPredictions.length, quarterlyPredictions.length])

  // Helper function to get risk category colors
  const getRiskColors = (category: string) => {
    switch (category) {
      case 'LOW':
        return { text: 'text-green-600', badge: 'bg-green-100 text-green-800' }
      case 'MEDIUM':
        return { text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' }
      case 'HIGH':
        return { text: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' }
      case 'CRITICAL':
        return { text: 'text-red-600', badge: 'bg-red-100 text-red-800' }
      default:
        return { text: 'text-gray-600', badge: 'bg-red-100 text-red-800' }
    }
  }

  // Helper function to get risk label
  const getRiskLabel = (category: string) => {
    switch (category) {
      case 'LOW':
        return 'Low Risk'
      case 'MEDIUM':
        return 'Medium Risk'
      case 'HIGH':
        return 'High Risk'
      case 'CRITICAL':
        return 'Critical Risk'
      default:
        return 'High Risk'
    }
  }

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <Card className="p-6 font-bricolage h-[600px] flex flex-col">
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
  )

  // Determine which data is available
  const hasAnnualData = annualPredictions.length > 0
  const hasQuarterlyData = quarterlyPredictions.length > 0

  // Reset selection indices when company changes
  useEffect(() => {
    setSelectedAnnualIndex(0)
    setSelectedQuarterlyIndex(0)
  }, [company.id])

  // Get current predictions
  const currentAnnualPrediction = annualPredictions[selectedAnnualIndex]
  const currentQuarterlyPrediction = quarterlyPredictions[selectedQuarterlyIndex]

  if (!company) {
    return null
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <Card className="p-6 font-bricolage h-[600px] flex flex-col overflow-y-auto">
      {/* Company Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-4xl font-semibold font-bricolage">
              {company.name}
            </h3>
            <Badge variant="outline" className="text-blue-600 font-bricolage">
              {company.sector}
            </Badge>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-bricolage">
            {company.subtitle}
          </p>
        </div>

        <div className="text-right">
          <div
            className={`text-3xl font-bold font-bricolage ${activeTab === 'annual' && currentAnnualPrediction
              ? getRiskColors(currentAnnualPrediction.risk_level).text
              : activeTab === 'quarterly' && currentQuarterlyPrediction
                ? getRiskColors(currentQuarterlyPrediction.risk_level).text
                : 'text-gray-900 dark:text-white'
              }`}
          >
            {activeTab === 'annual' && currentAnnualPrediction
              ? ((currentAnnualPrediction?.probability * 100 || 0)).toFixed(2)
              : activeTab === 'quarterly' && currentQuarterlyPrediction
                ? ((currentQuarterlyPrediction?.ensemble_probability * 100 || 0)
                ).toFixed(2)
                : company.defaultRate.replace('%', '')}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-bricolage">
            Default Rate
          </div>
        </div>
      </div>

      {/* Content - only show if there's any data */}
      {(hasAnnualData || hasQuarterlyData) && (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {/* Annual Predictions */}
          {activeTab === "annual" && hasAnnualData && currentAnnualPrediction && (
            <div className="space-y-3">
              {/* Prediction Selector - only show if multiple predictions */}
              {annualPredictions.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-bricolage">Current Prediction:</span>
                  <Select
                    value={selectedAnnualIndex.toString()}
                    onValueChange={(value) => setSelectedAnnualIndex(parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {annualPredictions.map((prediction, index) => {
                        // Format the display text properly
                        const year = prediction.reporting_year || '2024'
                        const quarter = prediction.reporting_quarter || 'Annual'

                        return (
                          <SelectItem key={index} value={index.toString()}>
                            {year} {quarter}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Default Rate Display */}

              {/* Risk Assessment */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 font-bricolage">Risk Assessment</span>
                  <Badge className={`font-bricolage ${getRiskColors(currentAnnualPrediction.risk_level).badge}`}>
                    {getRiskLabel(currentAnnualPrediction.risk_level)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-bricolage">Low Risk</span>
                  <span className="text-gray-600 font-bricolage">High Risk</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 relative">
                  <div className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full"></div>
                  <div
                    className="absolute top-0 w-3 h-3 bg-gray-900 rounded-full transform -translate-x-1/2 -translate-y-0.5"
                    style={{
                      left: `${Math.min(Math.max(((currentAnnualPrediction?.ensemble_probability || currentAnnualPrediction?.probability || 0)) * 4, 5), 95)}%`
                    }}
                  />
                </div>
              </div>

              {/* Financial Ratios - Annual (5 ratios) */}
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-2 font-bricolage">
                  Financial Ratios
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 font-bricolage">EBIT/Interest Expense</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white font-bricolage">
                        {currentAnnualPrediction.ebit_to_interest_expense?.toFixed(2) || '15.80'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 font-bricolage">Total Debt/EBITDA</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white font-bricolage">
                        {currentAnnualPrediction.total_debt_to_ebitda?.toFixed(2) || '2.10'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 font-bricolage">Return on Assets</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white font-bricolage">
                        {(currentAnnualPrediction.return_on_assets || 1.2).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 font-bricolage">Net Income Margin</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white font-bricolage">
                        {(currentAnnualPrediction.net_income_margin || 1.8).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2 col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 font-bricolage">Long-term Debt/Total Capital</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white font-bricolage">
                        {(currentAnnualPrediction.long_term_debt_to_total_capital || 2.6).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ML Model Insights */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-bricolage">
                  ML Model Insights
                </h4>

                <div className="bg-blue-50 rounded-lg p-3 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium font-bricolage">Model Confidence</span>
                    <span className="text-xl font-bold text-gray-900 font-bricolage">95.5%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium font-bricolage">Primary Risk Factors</span>
                  <Badge className="bg-red-500 text-white font-bricolage px-3 py-1">
                    Standard Assessment
                  </Badge>
                </div>

                <div className="text-sm text-gray-500 font-bricolage">
                  Last model update: 9/15/2025
                </div>
              </div>
            </div>
          )}

          {/* Quarterly Predictions */}
          {activeTab === "quarterly" && hasQuarterlyData && currentQuarterlyPrediction && (
            <div className="space-y-3">
              {/* Prediction Selector - only show if multiple predictions */}
              {quarterlyPredictions.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-bricolage">Current Prediction:</span>
                  <Select
                    value={selectedQuarterlyIndex.toString()}
                    onValueChange={(value) => setSelectedQuarterlyIndex(parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quarterlyPredictions.map((prediction, index) => {
                        // Format the display text properly
                        const year = prediction.reporting_year || '2024'
                        const quarter = prediction.reporting_quarter ||
                          prediction.period ||
                          prediction.quarter ||
                          `Q${index + 1}`

                        return (
                          <SelectItem key={index} value={index.toString()}>
                            {year} {quarter}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Default Rate Display */}

              {/* Risk Assessment */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 font-bricolage">Risk Assessment</span>
                  <Badge className={`font-bricolage ${getRiskColors(currentQuarterlyPrediction.risk_level).badge}`}>
                    {getRiskLabel(currentQuarterlyPrediction.risk_level)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-bricolage">Low Risk</span>
                  <span className="text-gray-600 font-bricolage">High Risk</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 relative">
                  <div className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full"></div>
                  <div
                    className="absolute top-0 w-3 h-3 bg-gray-900 rounded-full transform -translate-x-1/2 -translate-y-0.5"
                    style={{
                      left: `${Math.min(Math.max(((currentQuarterlyPrediction?.ensemble_probability || currentQuarterlyPrediction?.probability || 0) * 100) * 4, 5), 95)}%`
                    }}
                  />
                </div>
              </div>

              {/* Financial Ratios - Quarterly (4 ratios) */}
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-2 font-bricolage">
                  Financial Ratios
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 font-bricolage">Total Debt/EBITDA</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white font-bricolage">
                        {currentQuarterlyPrediction.total_debt_to_ebitda?.toFixed(2) || '2.10'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 font-bricolage">SG&A Magarin</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white font-bricolage">
                        {(currentQuarterlyPrediction.sga_margin || 1.2).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 font-bricolage">Return on Capital</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white font-bricolage">
                        {(currentQuarterlyPrediction.return_on_capital || 1.8).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 font-bricolage">Long-term Debt/Total Capital</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white font-bricolage">
                        {(currentQuarterlyPrediction.long_term_debt_to_total_capital || 2.6).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ML Model Insights */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-bricolage">
                  ML Model Insights
                </h4>

                <div className="bg-blue-50 rounded-lg p-3 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium font-bricolage">Model Confidence</span>
                    <span className="text-xl font-bold text-gray-900 font-bricolage">95.5%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium font-bricolage">Primary Risk Factors</span>
                  <Badge className="bg-red-500 text-white font-bricolage px-3 py-1">
                    Standard Assessment
                  </Badge>
                </div>

                <div className="text-sm text-gray-500 font-bricolage">
                  Last model update: 9/15/2025
                </div>
              </div>
            </div>
          )}

          {/* No data message for selected tab */}
          {activeTab === "annual" && !hasAnnualData && (
            <div className="text-center py-12 text-gray-500">
              <p className="font-bricolage">No annual predictions available for {company.name}</p>
            </div>
          )}

          {activeTab === "quarterly" && !hasQuarterlyData && (
            <div className="text-center py-12 text-gray-500">
              <p className="font-bricolage">No quarterly predictions available for {company.name}</p>
            </div>
          )}
        </div>
      )}

      {/* Show message if no data at all */}
      {!hasAnnualData && !hasQuarterlyData && (
        <div className="text-center py-12 text-gray-500">
          <p className="font-bricolage">No prediction data available for {company.name}</p>
        </div>
      )}
    </Card>
  )
}
