import { apiClient } from './client'

// Dashboard Statistics Interfaces
export interface DashboardStats {
  scope: string // 'personal', 'organization', 'tenant', 'system'
  data_scope: string // Human readable description
  user_name?: string
  organization_name?: string
  total_companies: number
  total_predictions: number
  annual_predictions?: number  // NEW: Annual predictions count
  quarterly_predictions?: number  // NEW: Quarterly predictions count
  average_default_rate: number
  high_risk_companies: number
  sectors_covered: number
  organizations_breakdown?: OrganizationBreakdown[]
  tenants_breakdown?: TenantBreakdown[]
  // Keep both user dashboard data and platform statistics separate
  user_dashboard?: UserDashboardData
  platform_statistics?: PlatformStatistics
}

// User dashboard specific data structure
export interface UserDashboardData {
  scope: string
  user_name?: string
  organization_name?: string
  total_companies: number
  total_predictions: number
  annual_predictions: number  // NEW: Annual predictions count
  quarterly_predictions: number  // NEW: Quarterly predictions count
  average_default_rate: number
  high_risk_companies: number
  sectors_covered: number
  data_scope: string
}

export interface OrganizationBreakdown {
  organization_id: string
  organization_name: string
  companies: number
  predictions: number
  average_default_rate: number
  high_risk_companies: number
}

export interface TenantBreakdown {
  tenant_id: string
  tenant_name: string
  organizations: number
  companies: number
  predictions: number
  average_default_rate: number
  high_risk_companies: number
}

export interface PlatformStatistics {
  total_companies: number
  total_predictions: number
  average_default_rate: number
  high_risk_companies: number
  sectors_covered: number
  total_users: number
  total_organizations: number
  total_tenants: number
  annual_predictions: number
  quarterly_predictions: number
}

// Dashboard API Client
export const dashboardApi = {
  /**
   * Get dashboard statistics for the current user
   * Uses the POST /predictions/dashboard endpoint
   * Includes platform statistics for comparison when available
   */
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.post('/predictions/dashboard', {
      include_platform_stats: true
    })

    // The API returns both user_dashboard and platform_statistics
    // We need to structure it for our frontend use
    const data = response.data as any
    console.log('📊 Dashboard API Response:', data)

    // Handle different possible response structures
    let userDashboard = data.user_dashboard || data;

    // If user_dashboard doesn't exist, try to use the root data
    if (!userDashboard || typeof userDashboard !== 'object') {
      console.warn('⚠️ user_dashboard not found in response, using root data:', data)
      userDashboard = data
    }

    // Extract user dashboard data and preserve platform stats separately
    const dashboardStats: DashboardStats = {
      // Main dashboard data comes from user_dashboard
      scope: data.scope || userDashboard.scope || 'personal',
      data_scope: data.data_scope || userDashboard.data_scope || 'Personal Statistics',
      user_name: data.user_name || userDashboard.user_name,
      organization_name: data.organization_name || userDashboard.organization_name,
      total_companies: userDashboard.total_companies || 0,
      total_predictions: userDashboard.total_predictions || 0,
      annual_predictions: userDashboard.annual_predictions || 0,  // NEW
      quarterly_predictions: userDashboard.quarterly_predictions || 0,  // NEW
      average_default_rate: userDashboard.average_default_rate || 0,
      high_risk_companies: userDashboard.high_risk_companies || 0,
      sectors_covered: userDashboard.sectors_covered || 0,
      organizations_breakdown: data.organizations_breakdown || userDashboard.organizations_breakdown,
      tenants_breakdown: data.tenants_breakdown || userDashboard.tenants_breakdown,
      // Preserve both user dashboard and platform statistics
      user_dashboard: data.user_dashboard,
      platform_statistics: data.platform_statistics
    }

    console.log('📊 Processed Dashboard Stats:', dashboardStats)
    console.log('📊 Platform Stats Available:', !!dashboardStats.platform_statistics)

    return dashboardStats
  }
}
