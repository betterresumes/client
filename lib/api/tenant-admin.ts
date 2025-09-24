import { apiClient } from './client';
import type {
  TenantWithAdminCreate,
  TenantWithAdminResponse,
  ExistingUserTenantAssignment,
  ExistingUserTenantResponse,
  AssignUserToOrgRequest,
  AssignUserToOrgResponse
} from '../types/tenant';
import type { ApiResponse } from '../types/common';

export const tenantAdminApi = {
  createTenantWithAdmin: async (data: TenantWithAdminCreate): Promise<ApiResponse<TenantWithAdminResponse>> => {
    return apiClient.post<TenantWithAdminResponse>('/tenant-admin/create-tenant-with-admin', data);
  },

  assignExistingUser: async (data: ExistingUserTenantAssignment): Promise<ApiResponse<ExistingUserTenantResponse>> => {
    return apiClient.post<ExistingUserTenantResponse>('/tenant-admin/assign-existing-user', data);
  },

  getTenantAdminInfo: async (tenantId: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/tenant-admin/tenant/${tenantId}/admin-info`);
  },

  removeTenantAdmin: async (userId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/tenant-admin/remove-tenant-admin/${userId}`);
  },

  assignUserToOrganization: async (data: AssignUserToOrgRequest): Promise<ApiResponse<AssignUserToOrgResponse>> => {
    return apiClient.post<AssignUserToOrgResponse>('/tenant-admin/assign-user-to-organization', data);
  }
};
