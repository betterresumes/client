import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { jobsApi } from '../api/jobs'
import type { JobParams } from '../types/job'
import type { JobStatus } from '../types/common'
import { useCallback, useEffect, useRef } from 'react'

/**
 * Job query keys for cache management
 */
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: any) => [...jobKeys.lists(), { filters }] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  status: (id: string) => [...jobKeys.all, 'status', id] as const,
  stats: () => [...jobKeys.all, 'stats'] as const,
} as const

/**
 * Get jobs list with filtering and pagination
 */
export function useJobs(params?: JobParams) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: async () => {
      const response = await jobsApi.listJobs(params)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load jobs')
      }
      return response.data
    },
    staleTime: 30 * 1000, // 30 seconds (jobs change frequently)
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

/**
 * Get single job status
 */
export function useJobStatus(jobId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: jobKeys.status(jobId),
    queryFn: async () => {
      const response = await jobsApi.getJobStatus(jobId)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load job status')
      }
      return response.data
    },
    enabled: enabled && !!jobId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: (query) => {
      // Stop polling if job is complete
      const data = query.state.data
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      return 5 * 1000 // Poll every 5 seconds for running jobs
    },
  })
}

/**
 * Get job details
 */
export function useJobDetails(jobId: string) {
  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: async () => {
      const response = await jobsApi.getJobDetails(jobId)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load job details')
      }
      return response.data
    },
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Cancel job mutation
 */
export function useCancelJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await jobsApi.cancelJob(jobId)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to cancel job')
      }
      return jobId
    },
    onSuccess: (jobId) => {
      // Invalidate job status and list
      queryClient.invalidateQueries({ queryKey: jobKeys.status(jobId) })
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
      toast.success('Job cancelled successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel job')
    },
  })
}

/**
 * Retry job mutation
 */
export function useRetryJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await jobsApi.retryJob(jobId)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to retry job')
      }
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate jobs list and update job details
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
      if (data.id) {
        queryClient.setQueryData(jobKeys.detail(data.id), data)
      }
      toast.success('Job retried successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to retry job')
    },
  })
}

/**
 * Delete job mutation
 */
export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await jobsApi.deleteJob(jobId)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete job')
      }
      return jobId
    },
    onSuccess: (jobId) => {
      // Remove from cache and invalidate list
      queryClient.removeQueries({ queryKey: jobKeys.detail(jobId) })
      queryClient.removeQueries({ queryKey: jobKeys.status(jobId) })
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
      toast.success('Job deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete job')
    },
  })
}

/**
 * Get job logs
 */
export function useJobLogs(jobId: string) {
  return useQuery({
    queryKey: [...jobKeys.detail(jobId), 'logs'],
    queryFn: async () => {
      const response = await jobsApi.getJobLogs(jobId)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load job logs')
      }
      return response.data
    },
    enabled: !!jobId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Download job result mutation
 */
export function useDownloadJobResult() {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const blob = await jobsApi.downloadJobResult(jobId)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `job-${jobId}-result.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return true
    },
    onSuccess: () => {
      toast.success('Job result downloaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to download job result')
    },
  })
}

/**
 * Get job statistics (admin only)
 */
export function useJobStatistics(params?: {
  start_date?: string
  end_date?: string
  status?: JobStatus
  user_id?: string
}) {
  return useQuery({
    queryKey: jobKeys.stats(),
    queryFn: async () => {
      const response = await jobsApi.getJobStatistics(params)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load job statistics')
      }
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Bulk cancel jobs mutation
 */
export function useBulkCancelJobs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobIds: string[]) => {
      const response = await jobsApi.bulk.cancelJobs(jobIds)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to cancel jobs')
      }
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate jobs list
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
      toast.success(`${data.cancelled?.length || 0} jobs cancelled successfully`)

      if (data.failed && data.failed.length > 0) {
        toast.warning(`${data.failed.length} jobs could not be cancelled`)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel jobs')
    },
  })
}

/**
 * Bulk delete jobs mutation (admin only)
 */
export function useBulkDeleteJobs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobIds: string[]) => {
      const response = await jobsApi.bulk.deleteJobs(jobIds)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to delete jobs')
      }
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate jobs list
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
      toast.success(`${data.deleted?.length || 0} jobs deleted successfully`)

      if (data.failed && data.failed.length > 0) {
        toast.warning(`${data.failed.length} jobs could not be deleted`)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete jobs')
    },
  })
}

/**
 * Real-time job monitoring hook
 */
export function useJobMonitoring(
  jobId: string,
  onStatusUpdate?: (status: any) => void,
  onComplete?: (status: any) => void,
  enabled: boolean = true
) {
  const cleanup = useRef<(() => void) | null>(null)

  const startMonitoring = useCallback(() => {
    if (!enabled || !jobId) return

    cleanup.current = jobsApi.polling.startJobMonitoring(
      jobId,
      (status) => {
        onStatusUpdate?.(status)
      },
      (status) => {
        onComplete?.(status)
        cleanup.current = null
      },
      (error) => {
        toast.error(`Job monitoring error: ${error.message}`)
        cleanup.current = null
      }
    )
  }, [jobId, enabled, onStatusUpdate, onComplete])

  const stopMonitoring = useCallback(() => {
    if (cleanup.current) {
      cleanup.current()
      cleanup.current = null
    }
  }, [])

  useEffect(() => {
    startMonitoring()
    return () => stopMonitoring()
  }, [startMonitoring, stopMonitoring])

  return { startMonitoring, stopMonitoring }
}

/**
 * Job polling hook with automatic start/stop
 */
export function useJobPolling(jobId: string, enabled: boolean = true) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (onProgress?: (status: any) => void) => {
      return jobsApi.polling.pollJobStatus(jobId, onProgress)
    },
    onSuccess: (finalStatus) => {
      // Update cache with final status
      queryClient.setQueryData(jobKeys.status(jobId), finalStatus)
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() })

      if (finalStatus.status === 'completed') {
        toast.success('Job completed successfully')
      } else if (finalStatus.status === 'failed') {
        toast.error('Job failed')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Job polling failed')
    },
  })
}
