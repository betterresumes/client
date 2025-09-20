import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { API_CONFIG } from '../utils/constants'
import { ApiResponse } from '../types/common'

/**
 * API client instance with interceptors for authentication and error handling
 */
class ApiClient {
  private client: AxiosInstance
  private tokenRefreshPromise: Promise<string> | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const newToken = await this.refreshToken()
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return this.client(originalRequest)
          } catch (refreshError) {
            this.handleAuthError()
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(this.formatError(error))
      }
    )
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('auth_token', token)
  }

  private removeToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
  }

  private async refreshToken(): Promise<string> {
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise
    }

    this.tokenRefreshPromise = this.performTokenRefresh()

    try {
      const newToken = await this.tokenRefreshPromise
      return newToken
    } finally {
      this.tokenRefreshPromise = null
    }
  }

  private async performTokenRefresh(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    })

    const { access_token } = response.data
    this.setToken(access_token)
    return access_token
  }

  private handleAuthError(): void {
    this.removeToken()
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
  }

  private formatError(error: any): ApiResponse<never> {
    if (error.response) {
      return {
        success: false,
        error: {
          code: error.response.status,
          message: error.response.data?.message || error.response.statusText,
          details: error.response.data?.details,
        },
      }
    }

    if (error.request) {
      return {
        success: false,
        error: {
          code: 0,
          message: 'Network error - please check your connection',
        },
      }
    }

    return {
      success: false,
      error: {
        code: -1,
        message: error.message || 'An unexpected error occurred',
      },
    }
  }

  // Public methods for making requests
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return this.formatError(error)
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return this.formatError(error)
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data, config)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return this.formatError(error)
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.patch(url, data, config)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return this.formatError(error)
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return this.formatError(error)
    }
  }

  // Upload files with multipart/form-data
  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config?.headers,
        },
      })
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      return this.formatError(error)
    }
  }

  // Set auth token manually (for login)
  setAuthToken(token: string, refreshToken?: string): void {
    this.setToken(token)
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    }
  }

  // Clear auth tokens (for logout)
  clearAuth(): void {
    this.removeToken()
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient
