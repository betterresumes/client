import { apiClient } from './client'
import {
  AnnualPredictionRequest,
  QuarterlyPredictionRequest,
  PredictionParams,
  BulkUploadFileRequest,
  PredictionListResponse
} from '../types/prediction'
import { ApiResponse, PaginatedResponse } from '../types/common'

export const predictionsApi = {
  annual: {
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

    async createAnnualPrediction(data: AnnualPredictionRequest): Promise<ApiResponse<any>> {
      return apiClient.post<any>('/predictions/annual', data)
    },

    async updateAnnualPrediction(predictionId: string, data: AnnualPredictionRequest): Promise<ApiResponse<any>> {
      return apiClient.put<any>(`/predictions/annual/${predictionId}`, data)
    },

    async deleteAnnualPrediction(predictionId: string): Promise<ApiResponse<any>> {
      return apiClient.delete<any>(`/predictions/annual/${predictionId}`)
    },

    async bulkUploadAnnualAsync(file: File): Promise<ApiResponse<any>> {
      const formData = new FormData()
      formData.append('file', file)

      return apiClient.upload<any>('/predictions/annual/bulk-upload-async', formData)
    },

    async getSystemAnnualPredictions(params?: {
      page?: number
      size?: number
      company_symbol?: string
      reporting_year?: string
      sector?: string
      risk_level?: string
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
      const url = queryString ? `/predictions/annual/system?${queryString}` : '/predictions/annual/system'

      return apiClient.get<any>(url)
    },
  },

  quarterly: {
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

    async createQuarterlyPrediction(data: QuarterlyPredictionRequest): Promise<ApiResponse<any>> {
      return apiClient.post<any>('/predictions/quarterly', data)
    },

    async updateQuarterlyPrediction(predictionId: string, data: QuarterlyPredictionRequest): Promise<ApiResponse<any>> {
      return apiClient.put<any>(`/predictions/quarterly/${predictionId}`, data)
    },

    async deleteQuarterlyPrediction(predictionId: string): Promise<ApiResponse<any>> {
      return apiClient.delete<any>(`/predictions/quarterly/${predictionId}`)
    },

    async bulkUploadQuarterlyAsync(file: File): Promise<ApiResponse<any>> {
      const formData = new FormData()
      formData.append('file', file)

      return apiClient.upload<any>('/predictions/quarterly/bulk-upload-async', formData)
    },

    async getSystemQuarterlyPredictions(params?: {
      page?: number
      size?: number
      company_symbol?: string
      reporting_year?: string
      reporting_quarter?: string
      sector?: string
      risk_level?: string
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
      const url = queryString ? `/predictions/quarterly/system?${queryString}` : '/predictions/quarterly/system'

      return apiClient.get<any>(url)
    },
  },

  async bulkUploadPredictions(file: File, predictionType: string = 'annual'): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.upload<any>(`/predictions/bulk-upload?prediction_type=${predictionType}`, formData)
  },

  jobs: {
    async getJobStatus(jobId: string): Promise<ApiResponse<any>> {
      return apiClient.get<any>(`/predictions/jobs/${jobId}/status`)
    },

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

    async cancelJob(jobId: string): Promise<ApiResponse<any>> {
      return apiClient.post<any>(`/predictions/jobs/${jobId}/cancel`, {})
    },

    async deleteJob(jobId: string): Promise<ApiResponse<any>> {
      return apiClient.delete<any>(`/predictions/jobs/${jobId}`)
    },
  },

  async getPredictions(params?: PredictionParams): Promise<ApiResponse<PaginatedResponse<any>>> {
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
