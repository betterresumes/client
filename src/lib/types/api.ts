// API request and response types
import type { ApiResponse, PaginatedResponse } from './common'
import type { User, Organization, Tenant, AuthResponse } from './auth'
import type { Company } from './company'
import type { PredictionResult } from './prediction'
import type { BulkJob } from './job'

// Generic API types
export interface ApiError {
  message: string
  code?: string
  details?: Record<string, any>
}

export interface ApiRequestConfig {
  headers?: Record<string, string>
  params?: Record<string, any>
  timeout?: number
}

// Specific API response types
export type AuthApiResponse = ApiResponse<AuthResponse>
export type UserApiResponse = ApiResponse<User>
export type UsersApiResponse = PaginatedResponse<User>
export type OrganizationApiResponse = ApiResponse<Organization>
export type OrganizationsApiResponse = PaginatedResponse<Organization>
export type TenantApiResponse = ApiResponse<Tenant>
export type TenantsApiResponse = PaginatedResponse<Tenant>
export type CompanyApiResponse = ApiResponse<Company>
export type CompaniesApiResponse = PaginatedResponse<Company>
export type PredictionApiResponse = ApiResponse<PredictionResult>
export type PredictionsApiResponse = PaginatedResponse<PredictionResult>
export type JobApiResponse = ApiResponse<BulkJob>
export type JobsApiResponse = PaginatedResponse<BulkJob>

// Query parameters
export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface CompanyQueryParams extends PaginationParams {
  search?: string
  sector?: string
  riskCategory?: string
  isCustom?: boolean
}

export interface PredictionQueryParams extends PaginationParams {
  companyId?: string
  modelType?: 'annual' | 'quarterly'
  riskCategory?: string
  dateFrom?: string
  dateTo?: string
}

export interface JobQueryParams extends PaginationParams {
  status?: string
  modelType?: 'annual' | 'quarterly'
  dateFrom?: string
  dateTo?: string
}
