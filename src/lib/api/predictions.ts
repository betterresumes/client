import { apiClient } from './client'
import {
  Prediction,
  PredictionRequest,
  PredictionBatchRequest,
  PredictionParams,
  PredictionExportParams
} from '../types/prediction'
import { ApiResponse, PaginatedResponse } from '../types/common'

/**
 * Predictions API service functions
 */
export const predictionsApi = {
  // Get predictions with filtering and pagination
  async getPredictions(params?: PredictionParams): Promise<ApiResponse<PaginatedResponse<Prediction>>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const url = queryString ? `/predictions?${queryString}` : '/predictions'

    return apiClient.get<PaginatedResponse<Prediction>>(url)
  },

  // Get single prediction by ID
  async getPrediction(id: string): Promise<ApiResponse<Prediction>> {
    return apiClient.get<Prediction>(`/predictions/${id}`)
  },

  // Create new prediction for a single company
  async createPrediction(data: PredictionRequest): Promise<ApiResponse<Prediction>> {
    return apiClient.post<Prediction>('/predictions', data)
  },

  // Create batch predictions for multiple companies
  async createBatchPredictions(data: PredictionBatchRequest): Promise<ApiResponse<{
    jobId: string
    totalCompanies: number
    estimatedDuration: number
  }>> {
    return apiClient.post('/predictions/batch', data)
  },

  // Update existing prediction
  async updatePrediction(id: string, data: Partial<PredictionRequest>): Promise<ApiResponse<Prediction>> {
    return apiClient.put<Prediction>(`/predictions/${id}`, data)
  },

  // Delete prediction
  async deletePrediction(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/predictions/${id}`)
  },

  // Get prediction by company and model type
  async getPredictionByCompany(
    companyId: string,
    modelType: 'annual' | 'quarterly'
  ): Promise<ApiResponse<Prediction>> {
    return apiClient.get<Prediction>(`/predictions/company/${companyId}/${modelType}`)
  },

  // Get predictions statistics
  async getPredictionStats(): Promise<ApiResponse<{
    totalPredictions: number
    byRiskCategory: Record<string, number>
    byModelType: Record<string, number>
    recentPredictions: number
    averageDefaultProbability: number
    trendsOverTime: Array<{
      date: string
      count: number
      averageRisk: number
    }>
  }>> {
    return apiClient.get('/predictions/stats')
  },

  // Get risk distribution analytics
  async getRiskDistribution(params?: {
    organizationId?: string
    startDate?: string
    endDate?: string
    modelType?: 'annual' | 'quarterly'
  }): Promise<ApiResponse<{
    distribution: Array<{
      range: string
      count: number
      percentage: number
    }>
    categories: Record<string, number>
    insights: Array<{
      type: 'high_risk' | 'trend' | 'outlier'
      message: string
      companies?: string[]
    }>
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
    const url = queryString ? `/predictions/analytics/risk-distribution?${queryString}` : '/predictions/analytics/risk-distribution'

    return apiClient.get(url)
  },

  // Get historical trends
  async getHistoricalTrends(params?: {
    organizationId?: string
    companyId?: string
    period?: 'week' | 'month' | 'quarter' | 'year'
    modelType?: 'annual' | 'quarterly'
  }): Promise<ApiResponse<{
    trends: Array<{
      date: string
      defaultProbability: number
      riskCategory: string
      companyCount?: number
    }>
    summary: {
      totalPredictions: number
      averageRisk: number
      riskTrend: 'increasing' | 'decreasing' | 'stable'
      volatility: number
    }
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
    const url = queryString ? `/predictions/analytics/trends?${queryString}` : '/predictions/analytics/trends'

    return apiClient.get(url)
  },

  // Compare predictions across companies
  async comparePredictions(companyIds: string[], modelType?: 'annual' | 'quarterly'): Promise<ApiResponse<{
    comparisons: Array<{
      companyId: string
      companyName: string
      companySymbol: string
      prediction: Prediction
    }>
    insights: Array<{
      type: 'highest_risk' | 'lowest_risk' | 'similar_risk' | 'outlier'
      message: string
      companies: string[]
    }>
  }>> {
    return apiClient.post('/predictions/compare', {
      companyIds,
      modelType,
    })
  },

  // Export predictions data
  async exportPredictions(params?: PredictionExportParams): Promise<Blob> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }

    const response = await apiClient.get<Blob>(`/predictions/export?${searchParams.toString()}`, {
      responseType: 'blob',
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error('Failed to export predictions')
  },

  // Get model performance metrics
  async getModelPerformance(): Promise<ApiResponse<{
    annual: {
      accuracy: number
      precision: number
      recall: number
      f1Score: number
      aucScore: number
      lastUpdated: string
    }
    quarterly: {
      accuracy: number
      precision: number
      recall: number
      f1Score: number
      aucScore: number
      lastUpdated: string
    }
  }>> {
    return apiClient.get('/predictions/model-performance')
  },
}
