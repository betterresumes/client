'use client'

import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Activity,
  RefreshCw
} from 'lucide-react'
import { useJobStore, Job } from '@/lib/stores/job-store'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface JobStatusDisplayProps {
  jobId: string
  showResults?: boolean
}

export function JobStatusDisplay({
  jobId,
  showResults = true
}: JobStatusDisplayProps) {
  const { jobs, updateJobFromAPI, deleteJob } = useJobStore()
  const job = jobs.find(j => j.id === jobId)

  // Update job status and results with proper intervals
  useEffect(() => {
    if (!job) return

    // Disable automatic polling - we use smart polling from the upload function
    // This prevents conflicts with the smart polling intervals

    // Only do immediate update if job is very old (fallback)
    const jobAge = Date.now() - new Date(job.startTime).getTime()
    if (jobAge > 300000 && (job.status === 'pending' || job.status === 'processing')) { // 5 minutes old
      updateJobFromAPI(jobId)
    }
  }, [jobId, job?.status, updateJobFromAPI])

  if (!job) return null

  const getStatusIcon = () => {
    switch (job.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (job.status) {
      case 'pending': return 'Pending'
      case 'processing': return `Processing (${job.progress}%)`
      case 'completed': return 'Completed'
      case 'failed': return 'Failed'
      default: return null // Don't show Unknown status
    }
  }

  // Don't display jobs with unknown status at all
  const statusText = getStatusText()
  if (!statusText) return null

  const getStatusBadge = () => {
    switch (job.status) {
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</span>
      case 'processing':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Processing ({job.progress}%)</span>
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</span>
      case 'failed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</span>
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Unknown</span>
    }
  }

  const downloadResults = () => {
    if (!job.jobResult || !job.jobResult.results || job.jobResult.results.length === 0) {
      toast.error('No results available for download')
      return
    }

    try {
      const csvContent = [
        // Headers
        'Company Symbol,Company Name,Default Probability,Risk Category,Status,Error',
        // Data rows
        ...job.jobResult.results.map((result: any) => {
          return [
            result.company_symbol || '',
            result.company_name || '',
            result.default_probability || '',
            result.risk_category || '',
            result.status || '',
            result.error || ''
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        })
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `analysis_results_${jobId}.csv`
      link.click()

      toast.success('Results downloaded successfully')
    } catch (error) {
      console.error('Error downloading results:', error)
      toast.error('Failed to results')
    }
  }

  return (
    <Card className="p-3 border border-gray-200 bg-white hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 w-1/3">
      {/* Compact row layout */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Icon + File name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {getStatusIcon()}
          <div className="min-w-0 flex-1">
            <span className="font-medium text-sm text-gray-900 truncate block">
              {job.fileName}
            </span>
            <span className="text-xs text-gray-500 truncate block">
              Job: {job.id.substring(0, 8)}...
              {job.estimatedTimeMinutes && (
                <> • Est: {job.estimatedTimeMinutes}min</>
              )}
              {job.totalRows && (
                <> • {job.totalRows} predictions</>
              )}
            </span>
          </div>
        </div>

        {/* Center: Status Badge */}
        <div className="flex-shrink-0">
          {getStatusBadge()}
        </div>

        {/* Right: Progress + Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Progress bar for active jobs */}
          {(job.status === 'processing' || job.status === 'pending') && (
            <div className="w-16 bg-gray-200 rounded-full h-1">
              <div
                className="bg-gray-400 h-1 rounded-full transition-all duration-300"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          )}

          {/* Refresh button for active jobs */}
          {(job.status === 'processing' || job.status === 'pending') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateJobFromAPI(jobId)}
              className="text-xs px-1 py-1 h-6 w-6 text-gray-400 hover:text-gray-600"
              title="Refresh status"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}

          {/* Download button for completed jobs */}
          {job.status === 'completed' && job.jobResult?.results && (
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadResults}
              className="text-xs px-2 py-1 h-6 text-gray-600 hover:text-gray-800"
            >
              CSV
            </Button>
          )}

          {/* Delete button for failed jobs or manual cleanup */}
          {(job.status === 'failed' || job.status === 'completed') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteJob(jobId)}
              className="text-xs px-1 py-1 h-6 w-6 text-gray-400 hover:text-gray-600"
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* Summary line - only show if there's meaningful info */}
      {job.status === 'completed' && job.jobResult?.summary && (
        <div className="mt-2 text-xs text-gray-500">
          {(() => {
            const total = job.jobResult.summary.total_companies
            const successful = job.jobResult.summary.successful_predictions
            const successRate = total && successful && total > 0 ? Math.round((successful / total) * 100) : 0
            return `${successful}/${total} predictions (${successRate}% success)`
          })()}
        </div>
      )}
    </Card>
  )
}

// Container component to display recent jobs
export function JobStatusContainer() {
  const { getRecentJobs } = useJobStore()
  const recentJobs = getRecentJobs()

  if (recentJobs.length === 0) return null

  return (
    <div className="space-y-2">
      {recentJobs.map((job) => (
        <JobStatusDisplay
          key={job.id}
          jobId={job.id}
          showResults={true}
        />
      ))}
    </div>
  )
}
