// Common types used across the application based on OpenAPI spec

export interface BaseEntity {
  id: string
  created_at: string  // format: date-time
  updated_at?: string  // format: date-time
}

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

// Pagination types from OpenAPI
export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// User roles from OpenAPI UserRole enum
export type UserRole = 'super_admin' | 'tenant_admin' | 'org_admin' | 'org_member' | 'user'

// Job status types
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Risk categories (inferred from system)
export type RiskCategory = 'low' | 'medium' | 'high' | 'critical'

// Model types from prediction endpoints
export type ModelType = 'annual' | 'quarterly'

// HTTP validation error from OpenAPI
export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail?: ValidationError[]
}
