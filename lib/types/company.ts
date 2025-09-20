import type { BaseEntity, PaginatedResponse } from './common'

// Company types from OpenAPI CompanyCreate schema
export interface CompanyCreate {
  name: string  // maxLength: 200, minLength: 1
  symbol?: string  // maxLength: 20
  exchange?: string  // maxLength: 50
  sector?: string  // maxLength: 100
  industry?: string  // maxLength: 100
  market_cap?: number  // minimum: 0.0
  description?: string
}

// API request/response types
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

// Request types for API calls
export interface CompanyCreateRequest extends CompanyCreate { }
export interface CompanyUpdateRequest extends Partial<CompanyCreate> { }

// Search and filtering params
export interface CompanySearchParams {
  page?: number  // minimum: 1, default: 1
  limit?: number  // maximum: 100, minimum: 1, default: 10
  sector?: string
  search?: string
  sort_by?: string  // default: "name"
  sort_order?: string  // default: "asc"
}

// Bulk upload request
export interface CompanyBulkUploadRequest {
  file: File
  organizationId?: string
  skipDuplicates?: boolean
  updateExisting?: boolean
}

// Export params
export interface CompanyExportParams extends CompanySearchParams {
  format?: 'csv' | 'xlsx' | 'json'
  includeFinancialData?: boolean
}

// Response types
export type CompanyListResponse = PaginatedResponse<Company>

// Stats response
export interface CompanyStatsResponse {
  totalCompanies: number
  byRiskCategory: Record<string, number>
  byIndustry: Record<string, number>
  byCountry: Record<string, number>
  recentlyAdded: number
}

// Autocomplete response
export interface CompanyAutocompleteItem {
  id: string
  symbol: string
  name: string
}

// Validation response
export interface CompanyValidationResponse {
  valid: boolean
  errors: Array<{ field: string; message: string }>
}
