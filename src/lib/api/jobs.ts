import { apiClient } from './client'
import { Job, JobParams } from '../types/job'
import { ApiResponse, PaginatedResponse } from '../types/common'
import { API_CONFIG } from '../utils/constants'

/**
 * Jobs API service functions for background task management
 */
export const jobsApi = {
  // Get jobs with filtering and pagination
  async getJobs(params?: JobParams): Promise<ApiResponse<PaginatedResponse<Job>>> {
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

  // Get single job by ID
  async getJob(id: string): Promise<ApiResponse<Job>> {
    return apiClient.get<Job>(`/jobs/${id}`)
  },

  // Cancel a running job
  async cancelJob(id: string): Promise<ApiResponse<Job>> {
    return apiClient.post<Job>(`/jobs/${id}/cancel`)
  },

  // Retry a failed job
  async retryJob(id: string): Promise<ApiResponse<Job>> {
    return apiClient.post<Job>(`/jobs/${id}/retry`)
  },

  // Delete a job record
  async deleteJob(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/jobs/${id}`)
  },

  // Get job progress and status
  async getJobProgress(id: string): Promise<ApiResponse<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    currentStep?: string
    totalSteps?: number
    estimatedTimeRemaining?: number
    processedItems?: number
    totalItems?: number
    errors?: Array<{ message: string; details?: any }>
  }>> {
    return apiClient.get(`/jobs/${id}/progress`)
  },

  // Get job results/output
  async getJobResults(id: string): Promise<ApiResponse<{
    results: any
    summary?: {
      totalProcessed: number
      successCount: number
      errorCount: number
      warnings?: string[]
    }
    downloadUrl?: string
  }>> {
    return apiClient.get(`/jobs/${id}/results`)
  },

  // Get job logs
  async getJobLogs(id: string, params?: {
    level?: 'debug' | 'info' | 'warning' | 'error'
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{
    logs: Array<{
      timestamp: string
      level: string
      message: string
      details?: any
    }>
    totalCount: number
  }>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const url = queryString ? `/jobs/${id}/logs?${queryString}` : `/jobs/${id}/logs`

    return apiClient.get(url)
  },

  // Get active jobs for current user
  async getActiveJobs(): Promise<ApiResponse<Job[]>> {
    return apiClient.get('/jobs/active')
  },

  // Get recent jobs for current user
  async getRecentJobs(limit = 10): Promise<ApiResponse<Job[]>> {
    return apiClient.get(`/jobs/recent?limit=${limit}`)
  },

  // Get job statistics
  async getJobStats(): Promise<ApiResponse<{
    totalJobs: number
    activeJobs: number
    completedJobs: number
    failedJobs: number
    averageExecutionTime: number
    jobsByType: Record<string, number>
    jobsByStatus: Record<string, number>
    recentActivity: Array<{
      date: string
      completed: number
      failed: number
    }>
  }>> {
    return apiClient.get('/jobs/stats')
  },

  // Bulk cancel jobs
  async cancelJobs(jobIds: string[]): Promise<ApiResponse<{
    cancelled: string[]
    failed: Array<{ id: string; error: string }>
  }>> {
    return apiClient.post('/jobs/bulk-cancel', { jobIds })
  },

  // Bulk delete jobs
  async deleteJobs(jobIds: string[]): Promise<ApiResponse<{
    deleted: string[]
    failed: Array<{ id: string; error: string }>
  }>> {
    return apiClient.post('/jobs/bulk-delete', { jobIds })
  },

  // Download job results as file
  async downloadJobResults(id: string, format = 'csv'): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/jobs/${id}/download?format=${format}`, {
      responseType: 'blob',
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error('Failed to download job results')
  },

  // Subscribe to job updates (Server-Sent Events)
  subscribeToJobUpdates(jobId: string, onUpdate: (job: Job) => void, onError?: (error: Error) => void): () => void {
    if (typeof window === 'undefined') {
      return () => { }
    }

    const eventSource = new EventSource(`${API_CONFIG.BASE_URL}/jobs/${jobId}/subscribe`)

    eventSource.onmessage = (event) => {
      try {
        const job = JSON.parse(event.data)
        onUpdate(job)
      } catch (error) {
        console.error('Failed to parse job update:', error)
        onError?.(error as Error)
      }
    }

    eventSource.onerror = (event) => {
      console.error('Job subscription error:', event)
      onError?.(new Error('Connection error'))
    }

    return () => eventSource.close()
  },
}
