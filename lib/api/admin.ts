import { apiClient } from './client';
import type { ApiResponse } from '../types/common';
import type { UserCreate, UserResponse, UserListResponse } from '../types/auth';

export const adminApi = {
  // Admin user management
  createUser: async (data: UserCreate): Promise<ApiResponse<UserResponse>> => {
    return apiClient.post<UserResponse>('/auth/admin/create-user', data);
  },

  getUsers: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    role?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<UserListResponse>> => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append('page', params.page.toString());
    if (params?.size !== undefined) searchParams.append('size', params.size.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

    return apiClient.get<UserListResponse>(`/users?${searchParams.toString()}`);
  },

  updateUserRole: async (userId: string, role: string): Promise<ApiResponse<any>> => {
    return apiClient.patch<any>(`/users/${userId}/role`, { role });
  },

  updateUser: async (userId: string, data: Partial<UserResponse>): Promise<ApiResponse<UserResponse>> => {
    return apiClient.put<UserResponse>(`/users/${userId}`, data);
  },

  deleteUser: async (userId: string, force = false): Promise<ApiResponse<void>> => {
    const params = force ? '?force=true' : '';
    return apiClient.delete<void>(`/users/${userId}${params}`);
  },

  activateUser: async (userId: string): Promise<ApiResponse<UserResponse>> => {
    return apiClient.patch<UserResponse>(`/users/${userId}/activate`);
  },

  deactivateUser: async (userId: string): Promise<ApiResponse<UserResponse>> => {
    return apiClient.patch<UserResponse>(`/users/${userId}/deactivate`);
  }
};
