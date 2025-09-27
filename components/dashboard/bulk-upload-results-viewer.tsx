'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import {
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { jobsApi } from '@/lib/api/jobs'
import * as XLSX from 'xlsx'

interface JobResult {
  company_symbol: string
  company_name: string
  default_probability: number
  risk_category: string
  status: string
  error?: string
}

interface JobResultsSummary {
  total_companies: number
  successful_predictions: number
  failed_predictions: number
  processing_time_seconds: number
}

interface JobResultsData {
  job_id: string
  results: JobResult[]
  summary: JobResultsSummary
  created_at: string
}

interface BulkUploadResultsViewerProps {
  jobId: string
  jobName: string
  trigger?: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BulkUploadResultsViewer({ 
  jobId, 
  jobName, 
  trigger,
  isOpen,
  onOpenChange 
}: BulkUploadResultsViewerProps) {
  const [results, setResults] = useState<JobResultsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const fetchResults = async () => {
    if (!jobId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Fetching results for job:', jobId)
      const response = await jobsApi.predictions.getBulkUploadJobResults(jobId)
      console.log('📄 Results response:', response)
      
      if (response.success && response.data) {
        setResults(response.data)
        console.log('✅ Results loaded successfully:', response.data.summary)
      } else {
        console.error('❌ Failed to fetch results:', response)
        setError('Failed to fetch job results - API may not be available')
      }
    } catch (err) {
      console.error('Error fetching job results:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch job results - API endpoint may not exist')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadResults = async (format: 'csv' | 'excel') => {
    if (!jobId || !results) return
    
    setIsDownloading(true)
    
    try {
      // For now, we'll create the CSV/Excel client-side
      // In the future, you can modify this to call a backend endpoint
      if (format === 'csv') {
        downloadAsCSV()
      } else {
        downloadAsExcel()
      }
    } catch (err) {
      console.error('Error downloading results:', err)
      toast.error('Failed to download results')
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadAsCSV = () => {
    if (!results) return

    const headers = [
      'Company Symbol',
      'Company Name',
      'Default Probability',
      'Risk Category',
      'Status',
      'Error'
    ]

    const csvData = [
      headers.join(','),
      ...results.results.map(result => [
        `"${result.company_symbol || ''}"`,
        `"${result.company_name || ''}"`,
        `"${(result.default_probability * 100).toFixed(2)}%"`,
        `"${result.risk_category || ''}"`,
        `"${result.status || ''}"`,
        `"${result.error || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `bulk_upload_results_${jobId.substring(0, 8)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('CSV file downloaded successfully')
  }

  const downloadAsExcel = async () => {
    if (!results) return

    try {
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      
      // Prepare data for the worksheet
      const worksheetData = [
        ['Company Symbol', 'Company Name', 'Default Probability (%)', 'Risk Category', 'Status', 'Error Details']
      ]
      
      results.results.forEach(result => {
        worksheetData.push([
          result.company_symbol || '',
          result.company_name || '',
          result.default_probability ? (result.default_probability * 100).toFixed(2) : '',
          result.risk_category || '',
          result.status || '',
          result.error || ''
        ])
      })

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Company Symbol
        { wch: 30 }, // Company Name  
        { wch: 20 }, // Default Probability
        { wch: 15 }, // Risk Category
        { wch: 12 }, // Status
        { wch: 40 }  // Error Details
      ]
      worksheet['!cols'] = columnWidths

      // Style the header row
      const range = XLSX.utils.decode_range(worksheet['!ref'] || '')
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!worksheet[cellAddress]) continue
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E2E8F0' } }
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Prediction Results')

      // Create summary worksheet
      const summaryData = [
        ['Bulk Upload Results Summary', ''],
        ['', ''],
        ['Job ID', jobId.substring(0, 12) + '...'],
        ['Total Companies', results.summary.total_companies],
        ['Successful Predictions', results.summary.successful_predictions],
        ['Failed Predictions', results.summary.failed_predictions],
        ['Success Rate (%)', ((results.summary.successful_predictions / results.summary.total_companies) * 100).toFixed(2)],
        ['Processing Time (seconds)', results.summary.processing_time_seconds],
        ['Generated On', new Date().toLocaleString()]
      ]

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData)
      summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 20 }]
      
      // Style summary sheet
      if (summaryWorksheet['A1']) {
        summaryWorksheet['A1'].s = {
          font: { bold: true, sz: 14 },
          fill: { fgColor: { rgb: 'DBEAFE' } }
        }
      }

      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary')

      // Generate and download file
      const fileName = `bulk_upload_results_${jobId.substring(0, 8)}.xlsx`
      XLSX.writeFile(workbook, fileName)

      toast.success('Excel file downloaded successfully')
    } catch (error) {
      console.error('Excel export error:', error)
      toast.error('Failed to download Excel file')
    }
  }

  const getRiskCategoryBadge = (category: string) => {
    const riskLevel = category.toLowerCase()
    
    if (riskLevel.includes('high')) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          High Risk
        </Badge>
      )
    } else if (riskLevel.includes('medium')) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
          <Minus className="h-3 w-3" />
          Medium Risk
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-800">
          <TrendingDown className="h-3 w-3" />
          Low Risk
        </Badge>
      )
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Loader2 className="h-4 w-4 text-gray-500" />
    }
  }

  const successRate = results 
    ? (results.summary.successful_predictions / results.summary.total_companies) * 100 
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Bulk Upload Results
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {jobName} • Job ID: {jobId.substring(0, 8)}...
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadResults('csv')}
                disabled={!results || isDownloading}
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadResults('excel')}
                disabled={!results || isDownloading}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Excel
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!results && !isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <Button onClick={fetchResults} variant="outline">
                Load Results
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                <p className="text-sm text-gray-600">Loading results...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
                <Button variant="outline" onClick={fetchResults}>
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {results && (
            <div className="flex-1 overflow-hidden flex flex-col space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 flex-shrink-0">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.summary.total_companies}
                    </div>
                    <p className="text-xs text-gray-600">Total Companies</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {results.summary.successful_predictions}
                    </div>
                    <p className="text-xs text-gray-600">Successful</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {results.summary.failed_predictions}
                    </div>
                    <p className="text-xs text-gray-600">Failed</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {successRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-600">Success Rate</p>
                    <Progress value={successRate} className="h-1 mt-1" />
                  </CardContent>
                </Card>
              </div>

              {/* Results Table */}
              <Card className="flex-1 overflow-hidden">
                <CardHeader className="flex-shrink-0 pb-3">
                  <CardTitle className="text-lg">Prediction Results</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="overflow-auto h-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Status</TableHead>
                          <TableHead className="w-24">Symbol</TableHead>
                          <TableHead>Company Name</TableHead>
                          <TableHead className="w-32">Default Probability</TableHead>
                          <TableHead className="w-32">Risk Category</TableHead>
                          <TableHead className="w-48">Error Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.results.map((result, index) => (
                          <TableRow key={`${result.company_symbol}-${index}`}>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                {getStatusIcon(result.status)}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {result.company_symbol}
                            </TableCell>
                            <TableCell className="font-medium">
                              {result.company_name}
                            </TableCell>
                            <TableCell>
                              {result.default_probability !== undefined ? (
                                <div className="text-center">
                                  <div className="font-semibold">
                                    {(result.default_probability * 100).toFixed(2)}%
                                  </div>
                                  <Progress 
                                    value={result.default_probability * 100} 
                                    className="h-1 mt-1"
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {result.risk_category ? (
                                getRiskCategoryBadge(result.risk_category)
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {result.error ? (
                                <div className="text-xs text-red-600 max-w-48 truncate" title={result.error}>
                                  {result.error}
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
