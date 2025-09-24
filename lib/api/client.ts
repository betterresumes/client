import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { API_CONFIG } from '../config/constants'
import { ApiResponse } from '../types/common'

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
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
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
      const { useAuthStore } = await import('../stores/auth-store')
      const store = useAuthStore.getState()

      const refreshed = await store.refreshAccessToken()
      if (refreshed) {
        this.accessToken = store.accessToken
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  private handleAuthError(): void {
    this.clearAuth()

    import('../stores/auth-store').then(({ useAuthStore }) => {
      const store = useAuthStore.getState()
      store.clearAuth()
    })

    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  setAuthToken(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
  }

  clearAuth(): void {
    this.accessToken = null
    this.refreshToken = null
  }

  private formatError(error: any): ApiResponse<never> {
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      })

      return {
        success: false,
        error: {
          code: error.response.status,
          message: error.response.data?.detail ||
            error.response.data?.message ||
            error.response.statusText,
          details: error.response.data?.details || error.response.data,
        },
      }
    }

    if (error.request) {
      console.error('Network Error:', error.request)
      return {
        success: false,
        error: {
          code: 0,
          message: 'Network error - please check your connection',
        },
      }
    }

    console.error('Unexpected Error:', error)
    return {
      success: false,
      error: {
        code: -1,
        message: error.message || 'An unexpected error occurred',
      },
    }
  }

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

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  getBaseUrl(): string {
    return API_CONFIG.BASE_URL
  }
}

export const apiClient = new ApiClient()
export default apiClient