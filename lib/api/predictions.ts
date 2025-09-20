import { apiClient } from './client'
import {
  AnnualPredictionRequest,
  QuarterlyPredictionRequest,
  PredictionParams,
  BulkUploadFileRequest,
  PredictionListResponse
} from '../types/prediction'
import { ApiResponse, PaginatedResponse } from '../types/common'

/**
 * Predictions API service functions based on OpenAPI spec
 * Base path: /api/v1/predictions
 */
export const predictionsApi = {
  // Annual predictions endpoints
  annual: {
    // Get annual predictions with filtering
    async getAnnualPredictions(params?: {
      page?: number
      size?: number
      company_symbol?: string
      reporting_year?: string
    }): Promise<ApiResponse<any>> {
      const searchParams = new URLSearchParams()

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value))
          }
        })
      }

      const queryString = searchParams.toString()
      const url = queryString ? `/predictions/annual?${queryString}` : '/predictions/annual'

      return apiClient.get<any>(url)
    },

    // Create annual prediction
    async createAnnualPrediction(data: AnnualPredictionRequest): Promise<ApiResponse<any>> {
      return apiClient.post<any>('/predictions/annual', data)
    },

    // Update annual prediction
    async updateAnnualPrediction(predictionId: string, data: AnnualPredictionRequest): Promise<ApiResponse<any>> {
      return apiClient.put<any>(`/predictions/annual/${predictionId}`, data)
    },

    // Delete annual prediction
    async deleteAnnualPrediction(predictionId: string): Promise<ApiResponse<any>> {
      return apiClient.delete<any>(`/predictions/annual/${predictionId}`)
    },

    // Bulk upload annual predictions (async)
    async bulkUploadAnnualAsync(file: File): Promise<ApiResponse<any>> {
      const formData = new FormData()
      formData.append('file', file)

      return apiClient.upload<any>('/predictions/annual/bulk-upload-async', formData)
    },
  },

  // Quarterly predictions endpoints
  quarterly: {
    // Get quarterly predictions with filtering
    async getQuarterlyPredictions(params?: {
      page?: number
      size?: number
      company_symbol?: string
      reporting_year?: string
      reporting_quarter?: string
    }): Promise<ApiResponse<any>> {
      const searchParams = new URLSearchParams()

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value))
          }
        })
      }

      const queryString = searchParams.toString()
      const url = queryString ? `/predictions/quarterly?${queryString}` : '/predictions/quarterly'

      return apiClient.get<any>(url)
    },

    // Create quarterly prediction
    async createQuarterlyPrediction(data: QuarterlyPredictionRequest): Promise<ApiResponse<any>> {
      return apiClient.post<any>('/predictions/quarterly', data)
    },

    // Update quarterly prediction
    async updateQuarterlyPrediction(predictionId: string, data: QuarterlyPredictionRequest): Promise<ApiResponse<any>> {
      return apiClient.put<any>(`/predictions/quarterly/${predictionId}`, data)
    },

    // Delete quarterly prediction
    async deleteQuarterlyPrediction(predictionId: string): Promise<ApiResponse<any>> {
      return apiClient.delete<any>(`/predictions/quarterly/${predictionId}`)
    },

    // Bulk upload quarterly predictions (async)
    async bulkUploadQuarterlyAsync(file: File): Promise<ApiResponse<any>> {
      const formData = new FormData()
      formData.append('file', file)

      return apiClient.upload<any>('/predictions/quarterly/bulk-upload-async', formData)
    },
  },

  // Bulk upload (sync) - unified endpoint
  async bulkUploadPredictions(file: File, predictionType: string = 'annual'): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.upload<any>(`/predictions/bulk-upload?prediction_type=${predictionType}`, formData)
  },

  // Job management endpoints
  jobs: {
    // Get bulk upload job status
    async getJobStatus(jobId: string): Promise<ApiResponse<any>> {
      return apiClient.get<any>(`/predictions/jobs/${jobId}/status`)
    },

    // List bulk upload jobs
    async listJobs(params?: {
      status?: string
      limit?: number
      offset?: number
    }): Promise<ApiResponse<any>> {
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
  },

  // Unified methods for easier use
  async getPredictions(params?: PredictionParams): Promise<ApiResponse<PaginatedResponse<any>>> {
    // Determine which endpoint to use based on model type or use annual as default
    const modelType = params?.model_type || 'annual'

    if (modelType === 'quarterly') {
      return this.quarterly.getQuarterlyPredictions({
        page: params?.page,
        size: params?.size,
        company_symbol: params?.company_symbol,
        reporting_year: params?.reporting_year,
        reporting_quarter: params?.reporting_quarter,
      })
    } else {
      return this.annual.getAnnualPredictions({
        page: params?.page,
        size: params?.size,
        company_symbol: params?.company_symbol,
        reporting_year: params?.reporting_year,
      })
    }
  },

  async createPrediction(data: AnnualPredictionRequest | QuarterlyPredictionRequest, modelType: 'annual' | 'quarterly'): Promise<ApiResponse<any>> {
    if (modelType === 'quarterly') {
      return this.quarterly.createQuarterlyPrediction(data as QuarterlyPredictionRequest)
    } else {
      return this.annual.createAnnualPrediction(data as AnnualPredictionRequest)
    }
  },

  async updatePrediction(id: string, data: AnnualPredictionRequest | QuarterlyPredictionRequest, modelType: 'annual' | 'quarterly'): Promise<ApiResponse<any>> {
    if (modelType === 'quarterly') {
      return this.quarterly.updateQuarterlyPrediction(id, data as QuarterlyPredictionRequest)
    } else {
      return this.annual.updateAnnualPrediction(id, data as AnnualPredictionRequest)
    }
  },

  async deletePrediction(id: string, modelType: 'annual' | 'quarterly'): Promise<ApiResponse<any>> {
    if (modelType === 'quarterly') {
      return this.quarterly.deleteQuarterlyPrediction(id)
    } else {
      return this.annual.deleteAnnualPrediction(id)
    }
  },

  // Export predictions (custom implementation)
  async exportPredictions(params?: PredictionParams & { format?: 'csv' | 'xlsx' }): Promise<Blob> {
    const modelType = params?.model_type || 'annual'
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'model_type' && key !== 'format') {
          searchParams.append(key, String(value))
        }
      })
    }

    const endpoint = modelType === 'quarterly' ? '/predictions/quarterly' : '/predictions/annual'
    const url = searchParams.toString() ? `${endpoint}?${searchParams.toString()}` : endpoint

    const response = await apiClient.get<Blob>(url, {
      responseType: 'blob',
      headers: {
        'Accept': params?.format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      }
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error('Failed to export predictions')
  },
}
