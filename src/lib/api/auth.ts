import { apiClient } from './client'
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../types/auth'
import { ApiResponse } from '../types/common'

/**
 * Authentication API service functions
 */
export const authApi = {
  // User authentication
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/login', credentials)
  },

  async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>('/auth/register', userData)
  },

  async logout(): Promise<ApiResponse<void>> {
    const result = await apiClient.post<void>('/auth/logout')
    apiClient.clearAuth()
    return result
  },

  async refreshToken(): Promise<ApiResponse<{ access_token: string }>> {
    return apiClient.post<{ access_token: string }>('/auth/refresh')
  },

  // Password management
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/change-password', data)
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/forgot-password', data)
  },

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/reset-password', data)
  },

  // Profile management
  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/me')
  },

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put<User>('/auth/me', userData)
  },

  // Email verification
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/verify-email', { token })
  },

  async resendVerificationEmail(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/resend-verification')
  },

  // Session management
  async validateSession(): Promise<ApiResponse<{ valid: boolean; user?: User }>> {
    return apiClient.get<{ valid: boolean; user?: User }>('/auth/validate')
  },

  // Check if token is valid without making a request
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated()
  },
}
