import { apiClient } from './client';
import type { ApiResponse } from '../types/common';

// Dashboard API Response Types
export interface DashboardStats {
  scope: 'personal' | 'organization' | 'tenant' | 'system';
  user_name?: string;
  organization_name?: string;
  tenant_name?: string;
  total_companies: number;
  total_predictions: number;
  average_default_rate: number;
  high_risk_companies: number;
  sectors_covered: number;
  data_scope: string;
  organizations_breakdown?: OrganizationBreakdown[];
  tenants_breakdown?: TenantBreakdown[];
  platform_statistics?: PlatformStatistics;
}

export interface OrganizationBreakdown {
  org_name: string;
  companies: number;
  predictions: number;
  avg_default_rate: number;
  high_risk_companies: number;
  sectors_covered: number;
}

export interface TenantBreakdown {
  tenant_name: string;
  companies: number;
  predictions: number;
  organizations_count: number;
}

export interface PlatformStatistics {
  total_companies: number;
  total_users: number;
  total_organizations: number;
  total_tenants: number;
  total_predictions: number;
  annual_predictions: number;
  quarterly_predictions: number;
  average_default_rate: number;
  high_risk_companies: number;
  sectors_covered: number;
}

export interface DashboardRequest {
  include_platform_stats?: boolean;
  organization_filter?: string | null;
  custom_scope?: string | null;
}

export const dashboardApi = {
  // Get dashboard statistics based on user role with optional platform stats
  async getStats(params?: DashboardRequest): Promise<ApiResponse<DashboardStats>> {
    const requestData: DashboardRequest = {
      include_platform_stats: true, // Always include platform stats for comparison
      organization_filter: params?.organization_filter || null,
      custom_scope: params?.custom_scope || null,
      ...params
    };

    return apiClient.post<DashboardStats>('/predictions/dashboard', requestData);
  },

  // Get stats without platform data (for performance)
  async getStatsOnly(params?: DashboardRequest): Promise<ApiResponse<DashboardStats>> {
    const requestData: DashboardRequest = {
      include_platform_stats: false,
      organization_filter: params?.organization_filter || null,
      custom_scope: params?.custom_scope || null,
      ...params
    };

    return apiClient.post<DashboardStats>('/predictions/dashboard', requestData);
  },

  // Invalidate dashboard cache (called after predictions are created/updated)
  async invalidateStats(): Promise<void> {
    // This could be a cache-busting request or just a client-side cache clear
    // For now, we'll handle this client-side
    console.log('📊 Dashboard stats cache invalidated');
  }
};
