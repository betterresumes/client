import type { BaseEntity, PaginatedResponse } from './common'

export interface CompanyCreate {
  name: string
  symbol?: string
  exchange?: string
  sector?: string
  industry?: string
  market_cap?: number
  description?: string
}

export interface Company extends BaseEntity {
  name: string
  symbol?: string
  exchange?: string
  sector?: string
  industry?: string
  market_cap?: number
  description?: string
  organization_id?: string
  tenant_id?: string
  is_active: boolean
}

export interface CompanyCreateRequest extends CompanyCreate { }
export interface CompanyUpdateRequest extends Partial<CompanyCreate> { }

export interface CompanySearchParams {
  page?: number  
  limit?: number  
  sector?: string
  search?: string
  sort_by?: string
  sort_order?: string
}

export interface CompanyBulkUploadRequest {
  file: File
  organizationId?: string
  skipDuplicates?: boolean
  updateExisting?: boolean
}

export interface CompanyExportParams extends CompanySearchParams {
  format?: 'csv' | 'xlsx' | 'json'
  includeFinancialData?: boolean
}

export type CompanyListResponse = PaginatedResponse<Company>

export interface CompanyStatsResponse {
  totalCompanies: number
  byRiskCategory: Record<string, number>
  byIndustry: Record<string, number>
  byCountry: Record<string, number>
  recentlyAdded: number
}

export interface CompanyAutocompleteItem {
  id: string
  symbol: string
  name: string
}

export interface CompanyValidationResponse {
  valid: boolean
  errors: Array<{ field: string; message: string }>
}
