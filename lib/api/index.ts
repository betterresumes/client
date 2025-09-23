// Main API exports for easy importing throughout the app
export { apiClient } from './client'

// Authentication API
export { authApi } from './auth'
export type * from './auth'

// Companies API
export { companiesApi } from './companies'
export type * from './companies'

// Predictions API
export { predictionsApi } from './predictions'
export type * from './predictions'

// Jobs API
export { jobsApi } from './jobs'
export type * from './jobs'

// Tenants API
export { tenantsApi } from './tenants'

// Tenant Admin API
export { tenantAdminApi } from './tenant-admin'

// Organizations API (Extended)
export { organizationsApi } from './organizations'

// Re-export common types used across APIs
export type {
  ApiResponse,
  PaginatedResponse,
  ValidationError,
  JobStatus
} from '../types/common'

export type { UserRole } from '../types/auth'

// Re-export tenant and organization types
export type * from '../types/tenant'
