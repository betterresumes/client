import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { jobsApi } from '../api/jobs'
import { queryKeys } from '../config/query-client'
import { useNotifications } from '../stores/ui'
import { POLLING } from '../utils/constants'
import type { Job, JobParams } from '../types/job'

/**
 * Query hooks for jobs data
 */

// Get jobs list with pagination
export const useJobs = (params?: JobParams) => {
  return useQuery({
    queryKey: queryKeys.jobsList(params),
    queryFn: () => jobsApi.getJobs(params),
    enabled: true,
  })
}

// Get single job with details
export const useJob = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.job(id),
    queryFn: () => jobsApi.getJob(id),
    enabled: enabled && !!id,
  })
}

// Get job progress with real-time updates
export const useJobProgress = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.jobProgress(id),
    queryFn: () => jobsApi.getJobProgress(id),
    enabled: enabled && !!id,
    refetchInterval: (query) => {
      // Stop polling when job is completed or failed
      const data = query.state.data
      if (!data?.success || !data.data) return false
      const status = data.data.status
      return status === 'pending' || status === 'processing' ? POLLING.JOB_STATUS : false
    },
    refetchIntervalInBackground: false,
  })
}

// Get job results
export const useJobResults = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.jobResults(id),
    queryFn: () => jobsApi.getJobResults(id),
    enabled: enabled && !!id,
  })
}

// Get job logs
export const useJobLogs = (id: string, params?: {
  level?: 'debug' | 'info' | 'warning' | 'error'
  limit?: number
  offset?: number
}, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.jobLogs(id, params),
    queryFn: () => jobsApi.getJobLogs(id, params),
    enabled: enabled && !!id,
  })
}

// Get active jobs
export const useActiveJobs = () => {
  return useQuery({
    queryKey: queryKeys.activeJobs(),
    queryFn: () => jobsApi.getActiveJobs(),
    refetchInterval: POLLING.JOB_STATUS, // Poll every 2 seconds for active jobs
    refetchIntervalInBackground: false,
  })
}

// Get recent jobs
export const useRecentJobs = (limit = 10) => {
  return useQuery({
    queryKey: queryKeys.recentJobs(limit),
    queryFn: () => jobsApi.getRecentJobs(limit),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Get job statistics
export const useJobStats = () => {
  return useQuery({
    queryKey: queryKeys.jobStats(),
    queryFn: () => jobsApi.getJobStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Mutation hooks for job actions
 */

// Cancel job
export const useCancelJob = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: (id: string) => jobsApi.cancelJob(id),
    onSuccess: (response, id) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
        queryClient.invalidateQueries({ queryKey: queryKeys.job(id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.jobProgress(id) })
        showSuccess('Job cancelled successfully')
      } else {
        showError('Failed to cancel job', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Failed to cancel job', error?.message)
    },
  })
}

// Retry job
export const useRetryJob = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: (id: string) => jobsApi.retryJob(id),
    onSuccess: (response, id) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
        queryClient.invalidateQueries({ queryKey: queryKeys.job(id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.jobProgress(id) })
        showSuccess('Job retry initiated successfully')
      } else {
        showError('Failed to retry job', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Failed to retry job', error?.message)
    },
  })
}

// Delete job
export const useDeleteJob = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: (id: string) => jobsApi.deleteJob(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
        showSuccess('Job deleted successfully')
      } else {
        showError('Failed to delete job', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Failed to delete job', error?.message)
    },
  })
}

// Bulk cancel jobs
export const useBulkCancelJobs = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: (jobIds: string[]) => jobsApi.cancelJobs(jobIds),
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
        const { cancelled, failed } = response.data
        showSuccess(
          'Bulk cancel completed',
          `${cancelled.length} jobs cancelled. ${failed.length} failed.`
        )
      } else {
        showError('Bulk cancel failed', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Bulk cancel failed', error?.message)
    },
  })
}

// Bulk delete jobs
export const useBulkDeleteJobs = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: (jobIds: string[]) => jobsApi.deleteJobs(jobIds),
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
        const { deleted, failed } = response.data
        showSuccess(
          'Bulk delete completed',
          `${deleted.length} jobs deleted. ${failed.length} failed.`
        )
      } else {
        showError('Bulk delete failed', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Bulk delete failed', error?.message)
    },
  })
}

// Download job results
export const useDownloadJobResults = () => {
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: ({ id, format = 'csv' }: { id: string; format?: string }) =>
      jobsApi.downloadJobResults(id, format),
    onSuccess: (blob, { id }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `job_results_${id}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showSuccess('Results downloaded successfully')
    },
    onError: (error: any) => {
      showError('Download failed', error?.message)
    },
  })
}

/**
 * Custom hooks for job monitoring and real-time updates
 */

// Hook for real-time job updates using Server-Sent Events
export const useJobUpdates = (jobId: string, enabled = true) => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled || !jobId) return

    const unsubscribe = jobsApi.subscribeToJobUpdates(
      jobId,
      (job: Job) => {
        // Update the job in cache
        queryClient.setQueryData(queryKeys.job(jobId), {
          success: true,
          data: job,
        })

        // Also update job progress if it exists
        queryClient.setQueryData(queryKeys.jobProgress(jobId), {
          success: true,
          data: {
            status: job.status,
            progress: job.progress,
            processedItems: job.processedRecords,
            totalItems: job.totalRecords,
          },
        })

        // Show notification when job completes
        if (job.status === 'completed') {
          showSuccess('Job completed successfully', `${job.fileName} processing finished`)
        } else if (job.status === 'failed') {
          showError('Job failed', job.errorMessage || 'Unknown error occurred')
        }
      },
      (error: Error) => {
        console.error('Job subscription error:', error)
      }
    )

    unsubscribeRef.current = unsubscribe

    return () => {
      unsubscribe()
    }
  }, [jobId, enabled, queryClient, showSuccess, showError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])
}

// Hook for monitoring multiple jobs
export const useJobsMonitor = () => {
  const activeJobs = useActiveJobs()
  const recentJobs = useRecentJobs()
  const jobStats = useJobStats()

  return {
    activeJobs,
    recentJobs,
    jobStats,
    isLoading: activeJobs.isLoading || recentJobs.isLoading || jobStats.isLoading,
    isError: activeJobs.isError || recentJobs.isError || jobStats.isError,
    refetch: () => {
      activeJobs.refetch()
      recentJobs.refetch()
      jobStats.refetch()
    },
  }
}

// Hook for job details with all related data
export const useJobDetails = (id: string, enabled = true) => {
  const job = useJob(id, enabled)
  const progress = useJobProgress(id, enabled)
  const results = useJobResults(id, enabled && job.data?.success && job.data.data?.status === 'completed')
  const logs = useJobLogs(id, undefined, enabled)

  // Auto-enable real-time updates for active jobs
  useJobUpdates(
    id,
    enabled && job.data?.success && ['pending', 'processing'].includes(job.data.data?.status || '')
  )

  return {
    job,
    progress,
    results,
    logs,
    isLoading: job.isLoading,
    isError: job.isError,
    refetch: () => {
      job.refetch()
      progress.refetch()
      results.refetch()
      logs.refetch()
    },
  }
}
