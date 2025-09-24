import { apiClient } from './client'
import {
  Company,
  CompanyCreate,
  CompanySearchParams,
  CompanyStatsResponse
} from '../types/company'
import { ApiResponse, PaginatedResponse } from '../types/common'

export const companiesApi = {
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

  async getCompany(companyId: string): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/companies/${companyId}`)
  },

  async getCompanyBySymbol(symbol: string): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/companies/search/${symbol}`)
  },

  async createCompany(data: CompanyCreate): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/companies/', data)
  },

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

  async getCompanyStats(): Promise<ApiResponse<CompanyStatsResponse>> {
    const response = await apiClient.get<PaginatedResponse<any>>('/companies/')

    if (response.success && response.data) {
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

  async validateCompany(data: Partial<Company>): Promise<ApiResponse<{
    valid: boolean
    errors: Array<{ field: string; message: string }>
  }>> {
    const errors: Array<{ field: string; message: string }> = []

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
