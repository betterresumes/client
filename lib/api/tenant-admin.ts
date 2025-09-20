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
  // 🎯 SOLUTION 1: Create tenant and assign admin user in ONE atomic operation
  createTenantWithAdmin: async (data: TenantWithAdminCreate): Promise<ApiResponse<TenantWithAdminResponse>> => {
    return apiClient.post<TenantWithAdminResponse>('/tenant-admin/create-tenant-with-admin', data);
  },

  // 🎯 SOLUTION 2: Assign existing user as tenant admin
  assignExistingUser: async (data: ExistingUserTenantAssignment): Promise<ApiResponse<ExistingUserTenantResponse>> => {
    return apiClient.post<ExistingUserTenantResponse>('/tenant-admin/assign-existing-user', data);
  },

  // Get information about tenant admin users
  getTenantAdminInfo: async (tenantId: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/tenant-admin/tenant/${tenantId}/admin-info`);
  },

  // Remove tenant admin role from user (demote to regular user)
  removeTenantAdmin: async (userId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/tenant-admin/remove-tenant-admin/${userId}`);
  },

  // Assign any user to any organization with specified role (Super Admin Only)
  assignUserToOrganization: async (data: AssignUserToOrgRequest): Promise<ApiResponse<AssignUserToOrgResponse>> => {
    return apiClient.post<AssignUserToOrgResponse>('/tenant-admin/assign-user-to-organization', data);
  }
};
