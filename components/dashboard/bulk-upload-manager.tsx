'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
  Download,
  Eye,
  RefreshCw,
  X,
  TrendingUp,
  BarChart3,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { useBulkUploadStore } from '@/lib/stores/bulk-upload-store'
import { JobResultsDialog } from '@/components/dashboard/job-results-dialog'
import { jobsApi } from '@/lib/api/jobs'

interface BulkUploadManagerProps {
  className?: string
}

export function BulkUploadManager({ className }: BulkUploadManagerProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedType, setSelectedType] = useState<'annual' | 'quarterly'>('annual')
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [selectedJobName, setSelectedJobName] = useState<string | null>(null)

  const {
    jobs,
    activeJob,
    isUploading,
    isPolling,
    error,
    uploadFile,
    startJobPolling,
    stopJobPolling,
    fetchAllJobs,
    clearError,
    getActiveJobs,
    getCompletedJobs,
    getFailedJobs,
    deleteJob
  } = useBulkUploadStore()

  const activeJobs = getActiveJobs()
  const completedJobs = getCompletedJobs()
  const failedJobs = getFailedJobs()

  // Load jobs on mount
  useEffect(() => {
    fetchAllJobs()

    // Cleanup polling on unmount
    return () => {
      stopJobPolling()
    }
  }, [fetchAllJobs, stopJobPolling])

  // Auto-refresh job list every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPolling) {
        fetchAllJobs()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isPolling, fetchAllJobs])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    // Validate file
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Please upload a valid CSV or Excel file')
      return
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error('File size must be less than 50MB')
      return
    }

    // Clear any previous errors
    clearError()

    // Show immediate loading feedback
    toast.info(`Uploading ${file.name}...`, {
      id: 'bulk-upload-progress',
      description: 'Starting background processing...'
    })

    // Start upload
    const jobId = await uploadFile(file, selectedType)

    // Dismiss loading toast
    toast.dismiss('bulk-upload-progress')

    if (jobId) {
      toast.success(`${selectedType === 'annual' ? 'Annual' : 'Quarterly'} bulk upload started successfully!`, {
        description: `Job ID: ${jobId.substring(0, 8)}... Processing in background.`
      })
    } else if (error) {
      toast.error(`Upload failed: ${error}`)
    }
  }

  const downloadTemplate = (type: 'annual' | 'quarterly') => {
    const headers = type === 'annual'
      ? [
        'company_symbol',
        'company_name',
        'sector',
        'market_cap',
        'reporting_year',
        'long_term_debt_to_total_capital',
        'total_debt_to_ebitda',
        'net_income_margin',
        'ebit_to_interest_expense',
        'return_on_assets'
      ]
      : [
        'company_symbol',
        'company_name',
        'sector',
        'market_cap',
        'reporting_year',
        'reporting_quarter',
        'long_term_debt_to_total_capital',
        'total_debt_to_ebitda',
        'sga_margin',
        'return_on_capital'
      ]

    const sampleRow = type === 'annual'
      ? [
        'AAPL',
        'Apple Inc.',
        'Technology',
        '3000000000',
        '2024',
        '18.75',
        '2.10',
        '25.30',
        '15.80',
        '12.50'
      ]
      : [
        'AAPL',
        'Apple Inc.',
        'Technology',
        '3000000000',
        '2024',
        'Q1',
        '18.75',
        '2.10',
        '15.25',
        '13.80'
      ]

    const csvContent = [headers, sampleRow]
      .map(row => row.map(field => `\"${field}\"`).join(','))
      .join('\\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_predictions_template.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success(`${type === 'annual' ? 'Annual' : 'Quarterly'} template downloaded successfully`)
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'processing':
      case 'queued':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-4 w-4" />
      case 'pending':
      case 'queued':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime()
    const endTime = end ? new Date(end).getTime() : Date.now()
    const duration = Math.floor((endTime - startTime) / 1000)

    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`
  }

  const handleViewResults = (jobId: string, jobName?: string) => {
    setSelectedJobId(jobId)
    setSelectedJobName(jobName || null)
    setResultsDialogOpen(true)
  }

  const handleDownloadExcel = async (jobId: string, jobName?: string) => {
    try {
      const blob = await jobsApi.predictions.downloadJobResultsExcel(jobId)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${jobName || 'job-results'}-${jobId.substring(0, 8)}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Excel file downloaded successfully!')
    } catch (err: any) {
      toast.error('Failed to download Excel file: ' + err.message)
    }
  }

  const handleDeleteJob = async (jobId: string, jobName?: string) => {
    if (window.confirm(`Are you sure you want to delete the job "${jobName || jobId}"?`)) {
      const success = await deleteJob(jobId)
      if (success) {
        toast.success('Job deleted successfully!')
        fetchAllJobs() // Refresh the jobs list
      } else {
        toast.error('Failed to delete job')
      }
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bulk Upload Manager
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Upload CSV/Excel files for batch prediction analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {jobs.length} total jobs
          </Badge>
          {activeJobs.length > 0 && (
            <Badge className="bg-blue-100 text-blue-800 font-mono text-xs">
              {activeJobs.length} active
            </Badge>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Prediction Type Selector */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              New Upload
            </h3>
            <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as 'annual' | 'quarterly')}>
              <TabsList>
                <TabsTrigger value="annual">Annual</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Template Download */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate(selectedType)}
              className="h-8 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Download {selectedType} Template
            </Button>
            <span className="text-xs text-gray-500">
              Download the template first to see required columns
            </span>
          </div>

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' :
              isUploading ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' :
                'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
                <div>
                  <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Starting Upload...
                  </h4>
                  <p className="text-blue-700 dark:text-blue-200">
                    Preparing your {selectedType} analysis job
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Drop your {selectedType} file here
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    or{' '}
                    <label className="cursor-pointer text-blue-600 hover:text-blue-700 underline">
                      browse to upload
                      <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file)
                        }}
                        disabled={isUploading}
                      />
                    </label>
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports CSV, XLSX, XLS files up to 50MB • Up to 10,000 records
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-900">Upload Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={clearError}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Active Job Progress */}
      {activeJob && (activeJob.status === 'processing' || activeJob.status === 'queued') && (
        <Card className="p-6 border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Processing: {activeJob.original_filename}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activeJob.job_type === 'annual' ? 'Annual' : 'Quarterly'} predictions • {activeJob.processed_rows} of {activeJob.total_rows} rows processed
                  </p>
                </div>
              </div>
              <Badge className={getJobStatusColor(activeJob.status)}>
                {getJobStatusIcon(activeJob.status)}
                <span className="ml-1">{activeJob.status.toUpperCase()}</span>
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {activeJob.progress_percentage.toFixed(1)}%</span>
                <span>{activeJob.processed_rows} / {activeJob.total_rows} rows</span>
              </div>
              <Progress value={activeJob.progress_percentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>✅ {activeJob.successful_rows} successful</span>
                {activeJob.failed_rows > 0 && (
                  <span>❌ {activeJob.failed_rows} failed</span>
                )}
                <span>⏱️ {formatDuration(activeJob.created_at)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Jobs List */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Jobs
            </h3>
            <Button variant="outline" size="sm" onClick={fetchAllJobs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All ({jobs.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeJobs.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({failedJobs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2">
              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No jobs yet
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload your first file to get started
                  </p>
                </div>
              ) : (
                jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onViewResults={handleViewResults}
                    onDownloadExcel={handleDownloadExcel}
                    onDeleteJob={handleDeleteJob}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-2">
              {activeJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onViewResults={handleViewResults}
                  onDownloadExcel={handleDownloadExcel}
                  onDeleteJob={handleDeleteJob}
                />
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-2">
              {completedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onViewResults={handleViewResults}
                  onDownloadExcel={handleDownloadExcel}
                  onDeleteJob={handleDeleteJob}
                />
              ))}
            </TabsContent>

            <TabsContent value="failed" className="space-y-2">
              {failedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onViewResults={handleViewResults}
                  onDownloadExcel={handleDownloadExcel}
                  onDeleteJob={handleDeleteJob}
                />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Job Results Dialog */}
      <JobResultsDialog
        jobId={selectedJobId}
        jobName={selectedJobName || undefined}
        isOpen={resultsDialogOpen}
        onClose={() => {
          setResultsDialogOpen(false)
          setSelectedJobId(null)
          setSelectedJobName(null)
        }}
      />
    </div>
  )
}

// Job Card Component
function JobCard({
  job,
  onViewResults,
  onDownloadExcel,
  onDeleteJob
}: {
  job: any
  onViewResults: (jobId: string, jobName?: string) => void
  onDownloadExcel: (jobId: string, jobName?: string) => void
  onDeleteJob: (jobId: string, jobName?: string) => void
}) {
  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'processing':
      case 'queued':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-4 w-4" />
      case 'pending':
      case 'queued':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              {job.original_filename}
            </span>
            <Badge variant="outline" className="text-xs">
              {job.job_type}
            </Badge>
            <Badge className={`text-xs ${getJobStatusColor(job.status)}`}>
              {getJobStatusIcon(job.status)}
              <span className="ml-1">{job.status.toUpperCase()}</span>
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Progress:</span>
              <div className="font-medium">{job.progress_percentage.toFixed(1)}%</div>
            </div>
            <div>
              <span className="text-gray-500">Processed:</span>
              <div className="font-medium">{job.processed_rows} / {job.total_rows}</div>
            </div>
            <div>
              <span className="text-gray-500">Success Rate:</span>
              <div className="font-medium">
                {job.processed_rows > 0 ? ((job.successful_rows / job.processed_rows) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>

          {job.status === 'processing' && (
            <div className="mt-3">
              <Progress value={job.progress_percentage} className="h-1.5" />
            </div>
          )}

          {job.error_message && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 rounded p-2">
              {job.error_message}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-4">
          {/* View Results Icon */}
          {job.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onViewResults(job.id, job.original_filename)}
              title="View Results"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}

          {/* Download Excel Icon */}
          {job.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onDownloadExcel(job.id, job.original_filename)}
              title="Download Excel"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {/* Delete Job Icon */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDeleteJob(job.id, job.original_filename)}
            title="Delete Job"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
