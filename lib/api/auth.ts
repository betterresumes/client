import { apiClient } from './client'
import {
  UserLogin,
  Token,
  UserCreate,
  UserResponse,
  JoinOrganizationRequest,
  JoinOrganizationResponse,
  ChangePasswordRequest,
  UpdateProfileRequest
} from '../types/auth'
import { ApiResponse, PaginatedResponse } from '../types/common'


export const authApi = {
  async login(credentials: UserLogin): Promise<ApiResponse<Token>> {
    return apiClient.post<Token>('/auth/login', credentials)
  },

  async register(userData: UserCreate): Promise<ApiResponse<UserResponse>> {
    return apiClient.post<UserResponse>('/auth/register', userData)
  },

  async logout(): Promise<ApiResponse<void>> {
    const result = await apiClient.post<void>('/auth/logout')
    apiClient.clearAuth()
    return result
  },

  async refreshToken(): Promise<ApiResponse<Token>> {
    return apiClient.post<Token>('/auth/refresh')
  },

  async joinOrganization(data: JoinOrganizationRequest): Promise<ApiResponse<JoinOrganizationResponse>> {
    return apiClient.post<JoinOrganizationResponse>('/auth/join', data)
  },

  async getProfile(): Promise<ApiResponse<UserResponse>> {
    return apiClient.get<UserResponse>('/users/me')
  },

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserResponse>> {
    return apiClient.put<UserResponse>('/users/me', data)
  },

  async getMe(): Promise<ApiResponse<UserResponse>> {
    return apiClient.get<UserResponse>('/users/me')
  },

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/change-password', data)
  },

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { email })
  },

  async resetPassword(data: { token: string; new_password: string }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/reset-password', data)
  },

  async getUsers(params?: {
    page?: number
    size?: number
    search?: string
    role?: string
    tenant_id?: string
    organization_id?: string
  }): Promise<ApiResponse<PaginatedResponse<UserResponse>>> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const url = queryString ? `/users?${queryString}` : '/users'

    return apiClient.get<PaginatedResponse<UserResponse>>(url)
  },

  async getUserById(userId: string): Promise<ApiResponse<UserResponse>> {
    return apiClient.get<UserResponse>(`/users/${userId}`)
  },

  async updateUser(userId: string, data: UpdateProfileRequest): Promise<ApiResponse<UserResponse>> {
    return apiClient.put<UserResponse>(`/users/${userId}`, data)
  },

  async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/users/${userId}`)
  },

  isAuthenticated(): boolean {
    return apiClient.isAuthenticated()
  },

  admin: {
    async createUser(userData: UserCreate): Promise<ApiResponse<UserResponse>> {
      return apiClient.post<UserResponse>('/auth/admin/create-user', userData)
    },

    async impersonateUser(userId: string): Promise<ApiResponse<Token>> {
      return apiClient.post<Token>(`/auth/admin/impersonate/${userId}`)
    },

    async forcePasswordReset(userId: string, newPassword: string): Promise<ApiResponse<void>> {
      return apiClient.post<void>(`/auth/admin/force-password-reset/${userId}?new_password=${encodeURIComponent(newPassword)}`)
    },

    async getUserLoginHistory(userId: string): Promise<ApiResponse<any>> {
      return apiClient.get<any>(`/auth/admin/audit/login-history/${userId}`)
    },

    async bulkActivateUsers(userIds: string[]): Promise<ApiResponse<any>> {
      return apiClient.post<any>('/auth/admin/bulk-activate', userIds)
    },
  },
}
