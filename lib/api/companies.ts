import { apiClient } from './client'
import {
  Company,
  CompanyCreate,
  CompanySearchParams,
  CompanyListResponse,
  CompanyStatsResponse
} from '../types/company'
import { ApiResponse, PaginatedResponse } from '../types/common'

/**
 * Companies API service functions based on OpenAPI spec
 * Base path: /api/v1/companies
 */
export const companiesApi = {
  // Get companies with filtering and pagination
  async getCompanies(params?: CompanySearchParams): Promise<ApiResponse<PaginatedResponse<any>>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const url = queryString ? `/companies/?${queryString}` : '/companies/'

    return apiClient.get<PaginatedResponse<any>>(url)
  },

  // Get single company by ID
  async getCompany(companyId: string): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/companies/${companyId}`)
  },

  // Get company by symbol  
  async getCompanyBySymbol(symbol: string): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/companies/search/${symbol}`)
  },

  // Create new company
  async createCompany(data: CompanyCreate): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/companies/', data)
  },

  // Company autocomplete (custom implementation)
  async getCompaniesAutocomplete(query?: string, limit = 20): Promise<ApiResponse<Array<{
    id: string
    symbol: string
    name: string
  }>>> {
    const params = new URLSearchParams({
      limit: String(limit),
      search: query || '',
    })

    const response = await apiClient.get<PaginatedResponse<any>>(`/companies/?${params.toString()}`)

    if (response.success && response.data) {
      // Transform the paginated response to autocomplete format
      const items = response.data.items?.map((company: any) => ({
        id: company.id,
        symbol: company.symbol || '',
        name: company.name,
      })) || []

      return {
        success: true,
        data: items,
      }
    }

    return response as any
  },

  // Export companies data (custom implementation)
  async exportCompanies(params?: CompanySearchParams & { format?: 'csv' | 'xlsx' }): Promise<Blob> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }

    const response = await apiClient.get<Blob>(`/companies/?${searchParams.toString()}`, {
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

    throw new Error('Failed to export companies')
  },

  // Get company statistics (custom implementation) 
  async getCompanyStats(): Promise<ApiResponse<CompanyStatsResponse>> {
    // This would need to be implemented on the backend or derived from existing data
    const response = await apiClient.get<PaginatedResponse<any>>('/companies/')

    if (response.success && response.data) {
      // Mock stats based on available data
      const stats: CompanyStatsResponse = {
        totalCompanies: response.data.total || 0,
        byRiskCategory: {},
        byIndustry: {},
        byCountry: {},
        recentlyAdded: 0,
      }

      return {
        success: true,
        data: stats,
      }
    }

    return response as any
  },

  // Validate company data (client-side validation)
  async validateCompany(data: Partial<Company>): Promise<ApiResponse<{
    valid: boolean
    errors: Array<{ field: string; message: string }>
  }>> {
    const errors: Array<{ field: string; message: string }> = []

    // Basic validation based on OpenAPI schema
    if (!data.name || data.name.length < 1 || data.name.length > 200) {
      errors.push({ field: 'name', message: 'Name must be between 1 and 200 characters' })
    }

    if (data.symbol && (data.symbol.length > 20)) {
      errors.push({ field: 'symbol', message: 'Symbol must be 20 characters or less' })
    }

    if (data.market_cap !== undefined && data.market_cap < 0) {
      errors.push({ field: 'market_cap', message: 'Market cap must be positive' })
    }

    return {
      success: true,
      data: {
        valid: errors.length === 0,
        errors,
      },
    }
  },
}
