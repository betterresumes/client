import { apiClient } from './client'
import {
  Company,
  CompanyCreateRequest,
  CompanyUpdateRequest,
  CompanyBulkUploadRequest,
  CompanySearchParams
} from '../types/company'
import { ApiResponse, PaginatedResponse } from '../types/common'

/**
 * Companies API service functions
 */
export const companiesApi = {
  // Get companies with filtering and pagination
  async getCompanies(params?: CompanySearchParams): Promise<ApiResponse<PaginatedResponse<Company>>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const url = queryString ? `/companies?${queryString}` : '/companies'

    return apiClient.get<PaginatedResponse<Company>>(url)
  },

  // Get single company by ID
  async getCompany(id: string): Promise<ApiResponse<Company>> {
    return apiClient.get<Company>(`/companies/${id}`)
  },

  // Get company by symbol
  async getCompanyBySymbol(symbol: string): Promise<ApiResponse<Company>> {
    return apiClient.get<Company>(`/companies/symbol/${symbol}`)
  },

  // Create new company
  async createCompany(data: CompanyCreateRequest): Promise<ApiResponse<Company>> {
    return apiClient.post<Company>('/companies', data)
  },

  // Update existing company
  async updateCompany(id: string, data: CompanyUpdateRequest): Promise<ApiResponse<Company>> {
    return apiClient.put<Company>(`/companies/${id}`, data)
  },

  // Delete company
  async deleteCompany(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/companies/${id}`)
  },

  // Bulk upload companies from file
  async bulkUploadCompanies(file: File, data: CompanyBulkUploadRequest): Promise<ApiResponse<{
    totalRows: number
    successCount: number
    errorCount: number
    errors: Array<{ row: number; error: string }>
  }>> {
    const formData = new FormData()
    formData.append('file', file)

    // Add other data as JSON string
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value))
      }
    })

    return apiClient.upload('/companies/bulk-upload', formData)
  },

  // Download template for bulk upload
  async downloadTemplate(): Promise<Blob> {
    const response = await apiClient.get<Blob>('/companies/template', {
      responseType: 'blob',
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error('Failed to download template')
  },

  // Get company statistics
  async getCompanyStats(): Promise<ApiResponse<{
    totalCompanies: number
    byRiskCategory: Record<string, number>
    byIndustry: Record<string, number>
    byCountry: Record<string, number>
    recentlyAdded: number
  }>> {
    return apiClient.get('/companies/stats')
  },

  // Get companies for dropdown/autocomplete
  async getCompaniesAutocomplete(query?: string, limit = 20): Promise<ApiResponse<Array<{
    id: string
    symbol: string
    name: string
  }>>> {
    const params = new URLSearchParams({
      limit: String(limit),
      fields: 'id,symbol,name',
    })

    if (query) {
      params.append('search', query)
    }

    return apiClient.get(`/companies/autocomplete?${params.toString()}`)
  },

  // Validate company data before saving
  async validateCompany(data: Partial<Company>): Promise<ApiResponse<{
    valid: boolean
    errors: Array<{ field: string; message: string }>
  }>> {
    return apiClient.post('/companies/validate', data)
  },

  // Export companies data
  async exportCompanies(params?: CompanySearchParams & { format?: 'csv' | 'xlsx' }): Promise<Blob> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }

    const response = await apiClient.get<Blob>(`/companies/export?${searchParams.toString()}`, {
      responseType: 'blob',
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error('Failed to export companies')
  },
}
