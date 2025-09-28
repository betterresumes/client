'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Download,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  FileSpreadsheet,
  Building,
  DollarSign,
  Clock,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { jobsApi } from '@/lib/api/jobs'
import { JobResultsComplete } from '@/lib/types/job'

interface JobResultsDialogProps {
  jobId: string | null
  jobName?: string
  isOpen: boolean
  onClose: () => void
}

export function JobResultsDialog({
  jobId,
  jobName,
  isOpen,
  onClose
}: JobResultsDialogProps) {
  const [results, setResults] = useState<JobResultsComplete | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch job results when dialog opens
  useEffect(() => {
    if (isOpen && jobId) {
      fetchJobResults()
    }
  }, [isOpen, jobId])

  const fetchJobResults = async () => {
    if (!jobId) return

    try {
      setLoading(true)
      setError(null)

      const response = await jobsApi.predictions.getJobResultsComplete(jobId, {
        include_predictions: true,
        include_companies: true,
        include_errors: true
      })

      if (response.success && response.data) {
        setResults(response.data)
      } else {
        setError('Failed to load job results')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load job results')
      toast.error('Failed to load job results')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = () => {
    if (!results) return

    try {
      setDownloading(true)

      // Debug: Log the actual data structure
      console.log('Job Summary:', results.job_summary)
      console.log('Sample Prediction:', results.created_data?.predictions?.[0])
      console.log('Sample Company:', (results.created_data?.predictions?.[0] as any)?.company)
      console.log('Sample Financial Metrics:', results.created_data?.predictions?.[0]?.financial_metrics)
      console.log('Sample Prediction Data:', (results.created_data?.predictions?.[0] as any)?.prediction)

      // Determine if this is annual or quarterly based on job_type or presence of quarterly data
      const isAnnual = results.job_summary.job_type === 'annual' ||
        !results.created_data?.predictions?.some((p: any) => p.reporting_quarter)

      // Create CSV headers based on file type - EXACTLY as specified
      const headers = isAnnual ? [
        'Company Symbol',
        'Company Name',
        'Sector',
        'Reporting Year',
        'Reporting Quarter',
        'Long Term Debt to Total Capital (%)',
        'Total Debt to EBITDA',
        'Net Income Margin (%)',
        'EBIT to Interest Expense',
        'Return on Assets (%)',
        'Default Rate (%)',
        'Risk Level',
        'Confidence (%)'
      ] : [
        'Company Symbol',
        'Company Name',
        'Sector',
        'Reporting Year',
        'Reporting Quarter',
        'Total Debt to EBITDA',
        'SGA Margin (%)',
        'Long Term Debt to Total Capital (%)',
        'Return on Capital (%)',
        'Logistic Probability (%)',
        'Risk Level',
        'Confidence (%)',
        'GBM Probability (%)',
        'Ensemble Probability (%)',
        'Default Rate (%)'
      ]

      const rows: string[][] = []

      // Process predictions data with STRICT column mapping
      if (results.created_data?.predictions) {
        results.created_data.predictions.forEach((prediction: any) => {
          const company = prediction.company || {}
          const financialMetrics = prediction.financial_metrics || {}
          const predictionData = prediction.prediction || {}

          // Helper function to safely format numbers
          const formatNumber = (value: any, decimals: number = 2) => {
            if (value === null || value === undefined || isNaN(value)) return 'N/A'
            return Number(value).toFixed(decimals)
          }

          const formatPercent = (value: any, decimals: number = 2) => {
            if (value === null || value === undefined || isNaN(value)) return 'N/A'
            return (Number(value) * 100).toFixed(decimals)
          }

          // Helper function for values that are already in percentage format
          const formatPercentDirect = (value: any, decimals: number = 2) => {
            if (value === null || value === undefined || isNaN(value)) return 'N/A'
            return Number(value).toFixed(decimals)
          }

          if (isAnnual) {
            // ANNUAL: Exactly 13 columns in this exact order matching headers
            const row = [
              company.symbol || 'N/A',                                         // Company Symbol
              company.name || 'N/A',                                          // Company Name
              company.sector || 'N/A',                                        // Sector
              (prediction.reporting_year || 'N/A').toString(),               // Reporting Year
              (prediction.reporting_quarter || 'N/A').toString(),            // Reporting Quarter
              formatPercentDirect(financialMetrics.long_term_debt_to_total_capital), // Long Term Debt to Total Capital (%)
              formatNumber(financialMetrics.total_debt_to_ebitda),          // Total Debt to EBITDA
              formatPercentDirect(financialMetrics.net_income_margin),      // Net Income Margin (%)
              formatNumber(financialMetrics.ebit_to_interest_expense),      // EBIT to Interest Expense
              formatPercentDirect(financialMetrics.return_on_assets),       // Return on Assets (%)
              formatPercent(predictionData.probability),                    // Default Rate (%)
              predictionData.risk_level || 'N/A',                          // Risk Level
              formatPercent(predictionData.confidence, 1)                   // Confidence (%)
            ]
            rows.push(row)
          } else {
            // QUARTERLY: Exactly 15 columns in this exact order matching headers
            const row = [
              company.symbol || 'N/A',                                         // Company Symbol
              company.name || 'N/A',                                          // Company Name
              company.sector || 'N/A',                                        // Sector
              (prediction.reporting_year || 'N/A').toString(),               // Reporting Year
              (prediction.reporting_quarter || 'N/A').toString(),            // Reporting Quarter
              formatNumber(financialMetrics.total_debt_to_ebitda),          // Total Debt to EBITDA
              formatPercentDirect(financialMetrics.sga_margin),             // SGA Margin (%)
              formatPercentDirect(financialMetrics.long_term_debt_to_total_capital), // Long Term Debt to Total Capital (%)
              formatPercentDirect(financialMetrics.return_on_capital),      // Return on Capital (%)
              formatPercent(predictionData.logistic_probability),           // Logistic Probability (%)
              predictionData.risk_level || 'N/A',                          // Risk Level
              formatPercent(predictionData.confidence, 1),                  // Confidence (%)
              formatPercent(predictionData.gbm_probability),                // GBM Probability (%)
              formatPercent(predictionData.ensemble_probability),           // Ensemble Probability (%)
              formatPercent(predictionData.logistic_probability)            // Default Rate (%) = Logistic Probability (%)
            ]
            rows.push(row)
          }
        })
      }

      // Validate column counts match headers
      const expectedColumns = isAnnual ? 13 : 15
      console.log(`Expected columns: ${expectedColumns}`)
      console.log(`Headers count: ${headers.length}`)
      console.log(`First row count: ${rows[0]?.length || 0}`)

      if (headers.length !== expectedColumns) {
        throw new Error(`Header count mismatch: expected ${expectedColumns}, got ${headers.length}`)
      }

      if (rows.length > 0 && rows[0].length !== expectedColumns) {
        throw new Error(`Row column count mismatch: expected ${expectedColumns}, got ${rows[0].length}`)
      }

      // Create CSV content with explicit structure
      const csvContent = [
        headers.join(','),
        ...rows.map(row => {
          if (row.length !== expectedColumns) {
            console.warn(`Row has ${row.length} columns, expected ${expectedColumns}:`, row)
          }
          return row.map((field: string) => `"${field}"`).join(',')
        })
      ].join('\n')

      console.log('Generated CSV preview:', csvContent.split('\n').slice(0, 3))
      console.log('File type:', isAnnual ? 'ANNUAL' : 'QUARTERLY')
      console.log('Expected columns:', expectedColumns)
      console.log('Actual headers:', headers)
      console.log('Sample row:', rows[0])

      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const jobType = isAnnual ? 'annual' : 'quarterly'
      link.download = `${jobType}-predictions-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Analysis data exported successfully!')
    } catch (err: any) {
      toast.error('Failed to export data')
    } finally {
      setDownloading(false)
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`
  }

  const LoadingState = () => (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )

  const ErrorState = () => (
    <div className="text-center py-12">
      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Results</h3>
      <p className="text-gray-500 mb-4">{error}</p>
      <Button onClick={fetchJobResults} variant="outline">
        Try Again
      </Button>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Job Results</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {jobName || `Job ${jobId?.substring(0, 8)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {results && (
              <Button
                onClick={handleDownloadExcel}
                disabled={downloading}
                className="bg-green-600 hover:bg-green-700"
              >
                {downloading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          {loading && <LoadingState />}
          {error && !loading && <ErrorState />}

          {results && !loading && (
            <div className="p-6 space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <Card className="bg-white shadow-md border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Processed</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {results.job_summary.total_rows}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-md border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Successful</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {results.job_summary.successful_rows}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-md border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Failed</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {results.job_summary.failed_rows}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-md border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Success Rate</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {results.job_summary.success_rate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Predictions Table */}
              {results.created_data?.predictions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Analysis Results ({results.created_data.predictions_count || results.created_data.predictions?.length || 0} predictions)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      {(() => {
                        const isAnnual = results.job_summary.job_type === 'annual'
                        const displayPredictions = results.created_data.predictions.slice(0, 100)

                        return (
                          <>
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="text-left p-3 font-medium">Company Symbol</th>
                                  <th className="text-left p-3 font-medium">Company Name</th>
                                  <th className="text-left p-3 font-medium">Sector</th>
                                  <th className="text-left p-3 font-medium">Year</th>
                                  {!isAnnual && <th className="text-left p-3 font-medium">Quarter</th>}
                                  <th className="text-right p-3 font-medium">Default Rate</th>
                                  <th className="text-center p-3 font-medium">Risk Level</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayPredictions.map((prediction: any) => {
                                  const company = prediction.company
                                  const predictionData = prediction.prediction || {}

                                  return (
                                    <tr key={prediction.id} className="border-b hover:bg-gray-50">
                                      <td className="p-3 font-semibold">{company?.symbol || 'N/A'}</td>
                                      <td className="p-3">{company?.name || 'N/A'}</td>
                                      <td className="p-3 text-sm">{company?.sector || 'N/A'}</td>
                                      <td className="p-3">{prediction.reporting_year || 'N/A'}</td>
                                      {!isAnnual && (
                                        <td className="p-3">{prediction.reporting_quarter || 'N/A'}</td>
                                      )}
                                      <td className="p-3 text-right font-mono font-semibold">
                                        {isAnnual
                                          ? (predictionData.probability * 100).toFixed(2)
                                          : (predictionData.logistic_probability * 100).toFixed(2)
                                        }%
                                      </td>
                                      <td className="p-3 text-center">
                                        <Badge className={getRiskColor(predictionData.risk_level)}>
                                          {predictionData.risk_level}
                                        </Badge>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                            <div className="mt-4 text-center">
                              {results.created_data.predictions.length > 100 ? (
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-500">
                                    Showing first 100 of {results.created_data.predictions.length} predictions from {results.job_summary.total_rows} processed rows
                                  </p>
                                  <p className="text-sm text-blue-600 font-medium">
                                    Download the complete file to view all results
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  Showing all {results.created_data.predictions.length} predictions from {results.job_summary.total_rows} processed rows
                                  {results.created_data.predictions.length < results.job_summary.total_rows && (
                                    <span className="text-xs block mt-1">
                                      Some rows may have been deduplicated or filtered based on data quality
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show errors if any */}
              {results.errors && results.errors.has_errors && results.errors.error_count > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Processing Errors ({results.errors.error_count})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {results.errors.error_details?.errors.slice(0, 100).map((error, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-red-800">Row {error.row}</p>
                              <p className="text-red-700 text-sm">{error.error}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {results.errors.error_count > 100 && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-500">
                          Showing first 100 of {results.errors.error_count} errors
                        </p>
                        <p className="text-sm text-blue-600 font-medium">
                          Download the complete file to view all error details
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
