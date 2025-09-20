import type { UserRole, RiskCategory } from '../types'

/**
 * Permission checking utilities based on user roles and hierarchy
 */

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  org_member: 1,
  org_admin: 2,
  tenant_admin: 3,
  super_admin: 4,
}

/**
 * Check if user has required role level or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if user can access tenant management
 */
export function canManageTenants(userRole: UserRole): boolean {
  return hasRole(userRole, 'super_admin')
}

/**
 * Check if user can access organization management
 */
export function canManageOrganizations(userRole: UserRole): boolean {
  return hasRole(userRole, 'tenant_admin')
}

/**
 * Check if user can manage users within organization
 */
export function canManageUsers(userRole: UserRole): boolean {
  return hasRole(userRole, 'org_admin')
}

/**
 * Check if user can create custom companies
 */
export function canCreateCompanies(userRole: UserRole): boolean {
  return hasRole(userRole, 'org_member')
}

/**
 * Check if user can access bulk analysis
 */
export function canUseBulkAnalysis(userRole: UserRole): boolean {
  return hasRole(userRole, 'org_member')
}

/**
 * Check if user can view organization data
 */
export function canViewOrgData(userRole: UserRole): boolean {
  return hasRole(userRole, 'org_member')
}

/**
 * Check if user can access global/S&P 500 data
 */
export function canViewGlobalData(userRole: UserRole): boolean {
  // Users without org can always see global data
  // Org members can see if org allows it (handled by backend)
  return true
}

/**
 * Get allowed navigation items based on user role
 */
export function getAllowedNavItems(userRole: UserRole): string[] {
  const baseItems = ['dashboard', 'analytics', 'companies', 'analysis', 'insights']

  if (canManageUsers(userRole)) {
    baseItems.push('users')
  }

  if (canManageOrganizations(userRole)) {
    baseItems.push('organizations')
  }

  if (canManageTenants(userRole)) {
    baseItems.push('tenants')
  }

  return baseItems
}

/**
 * Risk category utilities
 */
export function getRiskCategoryColor(category: RiskCategory): string {
  switch (category) {
    case 'low':
      return 'text-green-600 bg-green-50'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50'
    case 'high':
      return 'text-orange-600 bg-orange-50'
    case 'critical':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export function getRiskCategoryFromProbability(probability: number): RiskCategory {
  if (probability <= 0.03) return 'low'
  if (probability <= 0.07) return 'medium'
  if (probability <= 0.15) return 'high'
  return 'critical'
}

/**
 * Role display utilities
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin'
    case 'tenant_admin':
      return 'Tenant Admin'
    case 'org_admin':
      return 'Organization Admin'
    case 'org_member':
      return 'Organization Member'
    case 'user':
      return 'User'
    default:
      return 'Unknown'
  }
}

export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-800'
    case 'tenant_admin':
      return 'bg-blue-100 text-blue-800'
    case 'org_admin':
      return 'bg-green-100 text-green-800'
    case 'org_member':
      return 'bg-gray-100 text-gray-800'
    case 'user':
      return 'bg-slate-100 text-slate-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
