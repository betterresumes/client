// Common types used across the application
export type UserRole = 'super_admin' | 'tenant_admin' | 'org_admin' | 'org_member' | 'user'

export type RiskCategory = 'low' | 'medium' | 'high' | 'critical'

export type ModelType = 'annual' | 'quarterly'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: number
    message: string
    details?: any
  }
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
