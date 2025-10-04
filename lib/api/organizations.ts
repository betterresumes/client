import { apiClient } from './client';
import type {
  OrganizationResponse,
  OrganizationCreate,
  OrganizationUpdate,
  EnhancedOrganizationResponse,
  EnhancedOrganizationListResponse,
  OrganizationDetailedResponse,
  OrgAdminInfo,
  WhitelistCreate,
  WhitelistResponse,
  WhitelistListResponse
} from '../types/tenant';
import type { ApiResponse, PaginatedResponse } from '../types/common';
import type { UserListResponse } from '../types/auth';

export const organizationsApi = {
  create: async (data: OrganizationCreate): Promise<ApiResponse<OrganizationResponse>> => {
    return apiClient.post<OrganizationResponse>('/organizations', data);
  },

  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    tenant_id?: string;
  }): Promise<ApiResponse<EnhancedOrganizationListResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.tenant_id) searchParams.append('tenant_id', params.tenant_id);

    return apiClient.get<EnhancedOrganizationListResponse>(`/organizations/?${searchParams.toString()}`);
  },

  get: async (orgId: string): Promise<ApiResponse<EnhancedOrganizationResponse>> => {
    return apiClient.get<EnhancedOrganizationResponse>(`/organizations/${orgId}`);
  },

  update: async (orgId: string, data: OrganizationUpdate): Promise<ApiResponse<OrganizationResponse>> => {
    return apiClient.put<OrganizationResponse>(`/organizations/${orgId}`, data);
  },

  delete: async (orgId: string, force = false): Promise<ApiResponse<void>> => {
    const params = force ? '?force=true' : '';
    return apiClient.delete<void>(`/organizations/${orgId}${params}`);
  },

  regenerateJoinToken: async (orgId: string): Promise<ApiResponse<any>> => {
    return apiClient.post<any>(`/organizations/${orgId}/regenerate-token`);
  },

  getDetails: async (orgId: string): Promise<ApiResponse<OrganizationDetailedResponse>> => {
    return apiClient.get<OrganizationDetailedResponse>(`/organizations/${orgId}/details`);
  },

  getAdmins: async (orgId: string): Promise<ApiResponse<OrgAdminInfo[]>> => {
    return apiClient.get<OrgAdminInfo[]>(`/organizations/${orgId}/admins`);
  },

  getUsers: async (orgId: string, params?: {
    skip?: number;
    limit?: number;
    role?: string;
  }): Promise<ApiResponse<UserListResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.role) searchParams.append('role', params.role);

    return apiClient.get<UserListResponse>(`/organizations/${orgId}/users?${searchParams.toString()}`);
  },

  getGlobalDataAccess: async (orgId: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/organizations/${orgId}/global-data-access`);
  },

  updateGlobalDataAccess: async (orgId: string, allowAccess: boolean): Promise<ApiResponse<any>> => {
    return apiClient.patch<any>(`/organizations/${orgId}/global-data-access?allow_access=${allowAccess}`);
  },

  whitelist: {
    list: async (orgId: string, params?: {
      skip?: number;
      limit?: number;
    }): Promise<ApiResponse<WhitelistListResponse>> => {
      const searchParams = new URLSearchParams();
      if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());

      return apiClient.get<WhitelistListResponse>(`/organizations/${orgId}/whitelist?${searchParams.toString()}`);
    },

    add: async (orgId: string, data: WhitelistCreate): Promise<ApiResponse<WhitelistResponse>> => {
      return apiClient.post<WhitelistResponse>(`/organizations/${orgId}/whitelist`, data);
    },

    remove: async (orgId: string, email: string): Promise<ApiResponse<void>> => {
      return apiClient.delete<void>(`/organizations/${orgId}/whitelist/${email}`);
    }
  },

  join: async (data: { email: string; join_token: string }): Promise<ApiResponse<any>> => {
    return await apiClient.post<any>('/auth/join', data);
  },

  // User management methods
  addUserToOrg: async (orgId: string, data: { user_id: string; role?: string }): Promise<ApiResponse<any>> => {
    return apiClient.post<any>(`/organizations/${orgId}/users`, data);
  },

  updateUserRole: async (orgId: string, userId: string, role: string): Promise<ApiResponse<any>> => {
    return apiClient.patch<any>(`/organizations/${orgId}/users/${userId}/role`, { role });
  },

  removeUser: async (orgId: string, userId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/organizations/${orgId}/users/${userId}`);
  }
};
