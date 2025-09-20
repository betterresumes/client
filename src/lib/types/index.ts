// Re-export all types for easy importing
export * from './common'
export * from './auth'
export * from './company'
export * from './prediction'
export * from './job'
export * from './api'

// Type guards
export function isUserRole(role: string): role is import('./common').UserRole {
  return ['super_admin', 'tenant_admin', 'org_admin', 'org_member', 'user'].includes(role)
}

export function isRiskCategory(category: string): category is import('./common').RiskCategory {
  return ['low', 'medium', 'high', 'critical'].includes(category)
}

export function isJobStatus(status: string): status is import('./common').JobStatus {
  return ['pending', 'processing', 'completed', 'failed'].includes(status)
}
