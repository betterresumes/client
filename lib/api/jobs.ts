import { apiClient } from './client'
import {
  Job,
  JobProgress,
  JobStatsResponse,
  JobParams,
  JobLogsResponse,
  JobResultsResponse,
  BulkJobOperationResponse
} from '../types/job'
import { JobStatus } from '../types/common'
import { ApiResponse, PaginatedResponse } from '../types/common'

/**
 * Jobs API service functions based on OpenAPI spec
 * Base path: /api/v1/jobs
 */
export const jobsApi = {
  // Get job status by ID
  async getJobStatus(jobId: string): Promise<ApiResponse<JobProgress>> {
    return apiClient.get<JobProgress>(`/jobs/${jobId}`)
  },

  // Get job details
  async getJobDetails(jobId: string): Promise<ApiResponse<Job>> {
    return apiClient.get<Job>(`/jobs/${jobId}/details`)
  },

  // List user's jobs with filtering
  async listJobs(params?: JobParams): Promise<ApiResponse<PaginatedResponse<Job>>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const url = queryString ? `/jobs?${queryString}` : '/jobs'

    return apiClient.get<PaginatedResponse<Job>>(url)
  },

  // Cancel a running job
  async cancelJob(jobId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/jobs/${jobId}/cancel`)
  },

  // Retry a failed job
  async retryJob(jobId: string): Promise<ApiResponse<Job>> {
    return apiClient.post<Job>(`/jobs/${jobId}/retry`)
  },

  // Delete a job (admin only)
  async deleteJob(jobId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/jobs/${jobId}`)
  },

  // Get job logs/errors
  async getJobLogs(jobId: string): Promise<ApiResponse<{ logs: string[] }>> {
    return apiClient.get<{ logs: string[] }>(`/jobs/${jobId}/logs`)
  },

  // Download job result/output file
  async downloadJobResult(jobId: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/jobs/${jobId}/download`, {
      responseType: 'blob'
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error('Failed to download job result')
  },

  // Get job statistics (admin only)
  async getJobStatistics(params?: {
    start_date?: string
    end_date?: string
    status?: JobStatus
    user_id?: string
  }): Promise<ApiResponse<{
    total_jobs: number
    jobs_by_status: Record<JobStatus, number>
    average_processing_time: number
    success_rate: number
  }>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const url = queryString ? `/jobs/statistics?${queryString}` : '/jobs/statistics'

    return apiClient.get<{
      total_jobs: number
      jobs_by_status: Record<JobStatus, number>
      average_processing_time: number
      success_rate: number
    }>(url)
  },

  // Utilities for real-time job tracking
  polling: {
    // Poll job status until completion
    async pollJobStatus(
      jobId: string,
      onProgress?: (status: JobProgress) => void,
      intervalMs: number = 2000
    ): Promise<JobProgress> {
      return new Promise((resolve, reject) => {
        const poll = async () => {
          try {
            const response = await jobsApi.getJobStatus(jobId)

            if (!response.success || !response.data) {
              reject(new Error('Failed to get job status'))
              return
            }

            const status = response.data

            if (onProgress) {
              onProgress(status)
            }

            // Check if job is complete (JobStatus from common.ts)
            if (status.status === 'completed' || status.status === 'failed') {
              resolve(status)
            } else {
              // Continue polling
              setTimeout(poll, intervalMs)
            }
          } catch (error) {
            reject(error)
          }
        }

        poll()
      })
    },

    // Start real-time job monitoring
    startJobMonitoring(
      jobId: string,
      onStatusUpdate: (status: JobProgress) => void,
      onComplete: (status: JobProgress) => void,
      onError: (error: Error) => void,
      intervalMs: number = 2000
    ): () => void {
      let isActive = true

      const monitor = async () => {
        if (!isActive) return

        try {
          const response = await jobsApi.getJobStatus(jobId)

          if (!response.success || !response.data) {
            onError(new Error('Failed to get job status'))
            return
          }

          const status = response.data
          onStatusUpdate(status)

          if (status.status === 'completed' || status.status === 'failed') {
            onComplete(status)
            isActive = false
          } else if (isActive) {
            setTimeout(monitor, intervalMs)
          }
        } catch (error) {
          onError(error instanceof Error ? error : new Error('Unknown error'))
          isActive = false
        }
      }

      monitor()

      // Return cleanup function
      return () => {
        isActive = false
      }
    },
  },

  // Bulk operations
  bulk: {
    // Cancel multiple jobs
    async cancelJobs(jobIds: string[]): Promise<ApiResponse<BulkJobOperationResponse>> {
      return apiClient.post<BulkJobOperationResponse>('/jobs/bulk/cancel', { job_ids: jobIds })
    },

    // Delete multiple jobs (admin only)
    async deleteJobs(jobIds: string[]): Promise<ApiResponse<BulkJobOperationResponse>> {
      return apiClient.delete<BulkJobOperationResponse>('/jobs/bulk/delete', {
        data: { job_ids: jobIds }
      })
    },
  },
}
