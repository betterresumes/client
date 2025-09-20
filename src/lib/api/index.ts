// API services exports
export { apiClient } from './client'
export { authApi } from './auth'
export { companiesApi } from './companies'
export { predictionsApi } from './predictions'
export { jobsApi } from './jobs'

// Re-export types for convenience
export type { ApiResponse, PaginatedResponse } from '../types/common'
export type { LoginRequest, LoginResponse, User } from '../types/auth'
export type { Company, CompanyCreateRequest, CompanyUpdateRequest } from '../types/company'
export type { Prediction, PredictionRequest, FinancialRatios } from '../types/prediction'
export type { Job, JobParams } from '../types/job'
