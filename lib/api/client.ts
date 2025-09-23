import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { API_CONFIG } from '../config/constants'
import { ApiResponse } from '../types/common'

/**
 * API client instance with interceptors for authentication and error handling
 * Base URL: http://localhost:8000/api/v1
 */
class ApiClient {
  private client: AxiosInstance
  private accessToken: string | null = null
  private refreshToken: string | null = null

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
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`
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
            // Try to refresh token using auth store
            const refreshed = await this.refreshTokenViaStore()
            if (refreshed) {
              originalRequest.headers.Authorization = `Bearer ${this.accessToken}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            this.handleAuthError()
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(this.formatError(error))
      }
    )
  }

  private async refreshTokenViaStore(): Promise<boolean> {
    try {
      // Import auth store dynamically to avoid circular dependencies
      const { useAuthStore } = await import('../stores/auth-store')
      const store = useAuthStore.getState()

      const refreshed = await store.refreshAccessToken()
      if (refreshed) {
        this.accessToken = store.accessToken
        return true
      }
      return false
    } catch (error) {
      console.error('Token refresh via store failed:', error)
      return false
    }
  }

  private handleAuthError(): void {
    this.clearAuth()

    // Import and clear auth store
    import('../stores/auth-store').then(({ useAuthStore }) => {
      const store = useAuthStore.getState()
      store.clearAuth()
    })

    // Force redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  // Public methods for token management
  setAuthToken(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    console.log('🔑 API Client - Auth token set, client ready for authenticated requests')
  }

  clearAuth(): void {
    this.accessToken = null
    this.refreshToken = null
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

      // Temporary debugging for predictions APIs
      if (url.includes('/predictions/')) {
        console.log(`🌐 API Response for ${url}:`, {
          status: response.status,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'not object',
          sampleData: response.data
        })
      }

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

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  // Get base URL for SSE connections
  getBaseUrl(): string {
    return API_CONFIG.BASE_URL
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient
