import { apiClient } from './client'
import {
  Job,
  JobProgress,
  JobParams,
  BulkJobOperationResponse
} from '../types/job'
import { JobStatus } from '../types/common'
import { ApiResponse, PaginatedResponse } from '../types/common'


export const jobsApi = {
  async getJobStatus(jobId: string): Promise<ApiResponse<JobProgress>> {
    return apiClient.get<JobProgress>(`/jobs/${jobId}`)
  },

  async getJobDetails(jobId: string): Promise<ApiResponse<Job>> {
    return apiClient.get<Job>(`/jobs/${jobId}/details`)
  },

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

  async cancelJob(jobId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/jobs/${jobId}/cancel`)
  },

  async retryJob(jobId: string): Promise<ApiResponse<Job>> {
    return apiClient.post<Job>(`/jobs/${jobId}/retry`)
  },

  async deleteJob(jobId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/jobs/${jobId}`)
  },

  async getJobLogs(jobId: string): Promise<ApiResponse<{ logs: string[] }>> {
    return apiClient.get<{ logs: string[] }>(`/jobs/${jobId}/logs`)
  },

  async downloadJobResult(jobId: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/jobs/${jobId}/download`, {
      responseType: 'blob'
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error('Failed to download job result')
  },

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

  polling: {
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

            if (status.status === 'completed' || status.status === 'failed') {
              resolve(status)
            } else {
              setTimeout(poll, intervalMs)
            }
          } catch (error) {
            reject(error)
          }
        }

        poll()
      })
    },

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

      return () => {
        isActive = false
      }
    },
  },

  bulk: {
    async cancelJobs(jobIds: string[]): Promise<ApiResponse<BulkJobOperationResponse>> {
      return apiClient.post<BulkJobOperationResponse>('/jobs/bulk/cancel', { job_ids: jobIds })
    },

    async deleteJobs(jobIds: string[]): Promise<ApiResponse<BulkJobOperationResponse>> {
      return apiClient.delete<BulkJobOperationResponse>('/jobs/bulk/delete', {
        data: { job_ids: jobIds }
      })
    },
  },

  predictions: {
    async getBulkUploadJobStatus(jobId: string): Promise<ApiResponse<{
      job_id: string
      status: 'pending' | 'processing' | 'completed' | 'failed'
      progress?: number
      message?: string
      created_at: string
      updated_at: string
      filename?: string
      total_records?: number
      processed_records?: number
      successful_predictions?: number
      failed_predictions?: number
      errors?: string[]
    }>> {
      return apiClient.get<any>(`/predictions/jobs/${jobId}/status`)
    },

    async getBulkUploadJobResults(jobId: string): Promise<ApiResponse<{
      job_id: string
      results: Array<{
        company_symbol: string
        company_name: string
        default_probability: number
        risk_category: string
        status: string
        error?: string
      }>
      summary: {
        total_companies: number
        successful_predictions: number
        failed_predictions: number
        processing_time_seconds: number
      }
      created_at: string
    }>> {
      return apiClient.get<any>(`/predictions/jobs/${jobId}/results`)
    },

    async listBulkUploadJobs(params?: {
      status?: string
      limit?: number
      offset?: number
    }): Promise<ApiResponse<{
      jobs: Array<{
        job_id: string
        status: string
        filename?: string
        created_at: string
        progress?: number
        total_records?: number
        processed_records?: number
      }>
      total: number
      limit: number
      offset: number
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
      const url = queryString ? `/predictions/jobs?${queryString}` : '/predictions/jobs'

      return apiClient.get<any>(url)
    },

    async deleteBulkUploadJob(jobId: string): Promise<ApiResponse<{ message: string }>> {
      return apiClient.delete<{ message: string }>(`/predictions/jobs/${jobId}`)
    }
  },
}
