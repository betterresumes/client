export interface BaseEntity {
  id: string
  created_at: string  
  updated_at?: string 
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

export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export type UserRole = 'super_admin' | 'tenant_admin' | 'org_admin' | 'org_member' | 'user'

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type RiskCategory = 'low' | 'medium' | 'high' | 'critical'

export type ModelType = 'annual' | 'quarterly'

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail?: ValidationError[]
}
