import { apiClient } from './client';
import type {
  TenantResponse,
  TenantCreate,
  TenantUpdate,
  ComprehensiveTenantResponse,
  ComprehensiveTenantListResponse,
  TenantStatsResponse
} from '../types/tenant';
import type { ApiResponse } from '../types/common';

export const tenantsApi = {
  list: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<ComprehensiveTenantListResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

    return apiClient.get<ComprehensiveTenantListResponse>(`/tenants?${searchParams.toString()}`);
  },

  create: async (data: TenantCreate): Promise<ApiResponse<TenantResponse>> => {
    return apiClient.post<TenantResponse>('/tenants', data);
  },

  get: async (tenantId: string): Promise<ApiResponse<ComprehensiveTenantResponse>> => {
    return apiClient.get<ComprehensiveTenantResponse>(`/tenants/${tenantId}`);
  },

  update: async (tenantId: string, data: TenantUpdate): Promise<ApiResponse<TenantResponse>> => {
    return apiClient.put<TenantResponse>(`/tenants/${tenantId}`, data);
  },

  delete: async (tenantId: string, force = false): Promise<ApiResponse<void>> => {
    const params = force ? '?force=true' : '';
    return apiClient.delete<void>(`/tenants/${tenantId}${params}`);
  },

  getStats: async (tenantId: string): Promise<ApiResponse<TenantStatsResponse>> => {
    return apiClient.get<TenantStatsResponse>(`/tenants/${tenantId}/stats`);
  }
};
