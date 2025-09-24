import { apiClient } from './client'

export interface DashboardStats {
  scope: string
  data_scope: string
  user_name?: string
  organization_name?: string
  total_companies: number
  total_predictions: number
  annual_predictions?: number
  quarterly_predictions?: number
  average_default_rate: number
  high_risk_companies: number
  sectors_covered: number
  organizations_breakdown?: OrganizationBreakdown[]
  tenants_breakdown?: TenantBreakdown[]
  user_dashboard?: UserDashboardData
  platform_statistics?: PlatformStatistics
}

export interface UserDashboardData {
  scope: string
  user_name?: string
  organization_name?: string
  total_companies: number
  total_predictions: number
  annual_predictions: number
  quarterly_predictions: number
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

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.post('/predictions/dashboard', {
      include_platform_stats: true
    })

    const data = response.data as any

    let userDashboard = data.user_dashboard || data;

    if (!userDashboard || typeof userDashboard !== 'object') {
      userDashboard = data
    }

    const dashboardStats: DashboardStats = {
      scope: data.scope || userDashboard.scope || 'personal',
      data_scope: data.data_scope || userDashboard.data_scope || 'Personal Statistics',
      user_name: data.user_name || userDashboard.user_name,
      organization_name: data.organization_name || userDashboard.organization_name,
      total_companies: userDashboard.total_companies || 0,
      total_predictions: userDashboard.total_predictions || 0,
      annual_predictions: userDashboard.annual_predictions || 0,
      quarterly_predictions: userDashboard.quarterly_predictions || 0,
      average_default_rate: userDashboard.average_default_rate || 0,
      high_risk_companies: userDashboard.high_risk_companies || 0,
      sectors_covered: userDashboard.sectors_covered || 0,
      organizations_breakdown: data.organizations_breakdown || userDashboard.organizations_breakdown,
      tenants_breakdown: data.tenants_breakdown || userDashboard.tenants_breakdown,
      user_dashboard: data.user_dashboard,
      platform_statistics: data.platform_statistics
    }

    return dashboardStats
  }
}
