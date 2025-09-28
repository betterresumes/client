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

      // Create CSV content from results data
      const headers = [
        'Company Symbol',
        'Company Name',
        'Sector',
        'Reporting Period',
        'Probability (%)',
        'Risk Level',
        'Confidence (%)',
        'Predicted At',
        'Total Debt to EBITDA',
        'SGA Margin (%)',
        'Long Term Debt to Total Capital (%)',
        'Return on Capital (%)',
        'Logistic Model Probability (%)',
        'GBM Model Probability (%)'
      ]

      const rows: string[][] = []

      // Add company and prediction data
      if (results.created_data?.predictions) {
        results.created_data.predictions.forEach((prediction: any) => {
          const company = prediction.company
          const period = prediction.reporting_quarter
            ? `${prediction.reporting_quarter} ${prediction.reporting_year}`
            : `Annual ${prediction.reporting_year}`

          // Get all financial metrics
          const financialMetrics = prediction.financial_metrics || {}
          const predictionData = prediction.prediction || {}

          rows.push([
            company?.symbol || 'N/A',
            company?.name || 'N/A',
            company?.sector || 'N/A',
            period,
            ((predictionData.ensemble_probability || predictionData.probability) * 100).toFixed(2),
            predictionData.risk_level || 'N/A',
            (predictionData.confidence * 100).toFixed(1),
            new Date(predictionData.predicted_at).toLocaleDateString(),
            // Add all financial metrics
            financialMetrics.total_debt_to_ebitda?.toFixed(2) || 'N/A',
            financialMetrics.sga_margin?.toFixed(2) || 'N/A',
            financialMetrics.long_term_debt_to_total_capital?.toFixed(2) || 'N/A',
            financialMetrics.return_on_capital?.toFixed(2) || 'N/A',
            // Add prediction model details
            (predictionData.logistic_probability * 100).toFixed(4) || 'N/A',
            (predictionData.gbm_probability * 100).toFixed(4) || 'N/A'
          ])
        })
      }

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map((field: string) => `"${field}"`).join(','))
      ].join('\n')

      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analysis-results-${jobId?.substring(0, 8) || 'export'}.csv`
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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
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
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left p-3 font-medium">Company</th>
                            <th className="text-left p-3 font-medium">Sector</th>
                            <th className="text-left p-3 font-medium">Period</th>
                            <th className="text-right p-3 font-medium">Probability</th>
                            <th className="text-center p-3 font-medium">Risk Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.created_data.predictions.map((prediction: any) => {
                            const company = prediction.company
                            const predictionData = prediction.prediction || {}
                            return (
                              <tr key={prediction.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">
                                  <div>
                                    <div className="font-semibold">{company?.symbol || 'N/A'}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-32">{company?.name || 'N/A'}</div>
                                  </div>
                                </td>
                                <td className="p-3 text-sm">{company?.sector || 'N/A'}</td>
                                <td className="p-3">
                                  {prediction.reporting_quarter ?
                                    `${prediction.reporting_quarter} ${prediction.reporting_year}` :
                                    `Annual ${prediction.reporting_year}`
                                  }
                                </td>
                                <td className="p-3 text-right font-mono font-semibold">
                                  {((predictionData.ensemble_probability || predictionData.probability) * 100).toFixed(2)}%
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
                      {results.created_data.predictions.length > 0 && (
                        <p className="text-sm text-gray-500 mt-3 text-center">
                          Showing all {results.created_data.predictions.length} predictions from {results.job_summary.total_rows} processed rows
                          {results.created_data.predictions.length < results.job_summary.total_rows && (
                            <span className="text-xs block mt-1">
                              Some rows may have been deduplicated or filtered based on data quality
                            </span>
                          )}
                        </p>
                      )}
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
                      {results.errors.error_details?.errors.map((error, index) => (
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
