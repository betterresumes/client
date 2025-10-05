# API Integration Architecture

## API Communication Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    API INTEGRATION LAYER                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🎯 Service Modules      🔧 API Client        🔐 Auth Layer  │
│ ┌─────────────────┐    ┌─────────────────┐   ┌──────────┐  │
│ │ • Auth Service  │    │ • Axios Core    │   │ • JWT    │  │
│ │ • User Service  │    │ • Interceptors  │   │ • Refresh│  │
│ │ • Data Service  │    │ • Error Handle  │   │ • Headers│  │
│ │ • Upload Svc    │    │ • Type Safety   │   │ • Logout │  │
│ └─────────────────┘    └─────────────────┘   └──────────┘  │
│                                                             │
│ 🌐 TanStack Query       📊 Response Cache   ⚡ Performance  │
│ ┌─────────────────┐    ┌─────────────────┐   ┌──────────┐  │
│ │ • Query Keys    │    │ • Smart Cache   │   │ • Retry  │  │
│ │ • Mutations     │    │ • Invalidation  │   │ • Timeout│  │
│ │ • Optimistic   │    │ • Background    │   │ • Parallel│  │
│ │ • Background   │    │   Sync          │   │ • Dedup  │  │
│ └─────────────────┘    └─────────────────┘   └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## API Service Organization

The application organizes API endpoints into logical service modules, each handling a specific business domain. This approach ensures maintainability and clear separation of concerns.

### Authentication Services
Handles all authentication-related operations including login, registration, token refresh, and logout. The service automatically manages JWT tokens and integrates with the global auth store.

### User Management Services  
Provides comprehensive user CRUD operations, role management, and profile updates. Includes specialized endpoints for different admin levels and permission-based data filtering.

### Risk Analysis Services
Core business logic for company risk analysis, prediction generation, and historical data retrieval. Supports both individual company analysis and bulk processing operations.

### File Upload Services
Manages file uploads with progress tracking, validation, and batch processing capabilities. Handles CSV/Excel processing and provides real-time job status monitoring.

## Request/Response Flow

### Automatic Authentication
Every API request automatically includes authentication headers when a valid token is available. The system handles token expiration transparently by attempting refresh and retrying failed requests.

### Error Handling Strategy
The API client implements comprehensive error handling that provides meaningful feedback to users while maintaining application stability. Different error types receive appropriate treatment based on their nature and severity.

### Data Transformation
All API responses undergo transformation to ensure consistent data formats throughout the application. Type safety is maintained through TypeScript interfaces that match backend response structures.
          originalRequest._retry = true
          
          const refreshSuccessful = await this.handleTokenRefresh()
          if (refreshSuccessful) {
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`
            return this.client(originalRequest)
          } else {
            // Redirect to login
            this.clearAuth()
            window.location.href = '/login'
          }
        }
        
        return Promise.reject(error)
      }
    )
  }
  
  setAuthToken(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
  }
  
  clearAuth() {
    this.accessToken = null
    this.refreshToken = null
  }
  
  private async handleTokenRefresh(): Promise<boolean> {
    if (!this.refreshToken) return false
    
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${this.refreshToken}` }
      })
      
      const { access_token, refresh_token } = response.data
      this.setAuthToken(access_token, refresh_token)
      
      // Update auth store
      const { useAuthStore } = await import('../stores/auth-store')
      useAuthStore.getState().setAuth(access_token, refresh_token, response.data.user)
      
      return true
    } catch (error) {
      return false
    }
  }
  
  // HTTP Methods
  async get<T>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.get(url, config)
  }
  
  async post<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config)
  }
  
  async put<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config)
  }
  
  async patch<T>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config)
  }
  
  async delete<T>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config)
  }
}

export const apiClient = new ApiClient()
```

## API Service Modules

### Authentication API (`lib/api/auth.ts`)

```typescript
import { apiClient } from './client'
import type { 
  LoginRequest, 
  RegisterRequest, 
  Token, 
  UserResponse,
  ChangePasswordRequest,
  UpdateProfileRequest,
  ApiResponse,
  PaginatedResponse 
} from '../types'

export const authApi = {
  // Authentication
  async login(credentials: LoginRequest): Promise<ApiResponse<Token>> {
    const response = await apiClient.post<ApiResponse<Token>>('/auth/login', credentials)
    return response.data
  },
  
  async register(userData: RegisterRequest): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.post<ApiResponse<UserResponse>>('/auth/register', userData)
    return response.data
  },
  
  async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/logout')
    return response.data
  },
  
  async refreshToken(): Promise<ApiResponse<Token>> {
    const response = await apiClient.post<ApiResponse<Token>>('/auth/refresh')
    return response.data
  },
  
  // Profile Management
  async getProfile(): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/auth/profile')
    return response.data
  },
  
  async updateProfile(updates: UpdateProfileRequest): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.patch<ApiResponse<UserResponse>>('/auth/profile', updates)
    return response.data
  },
  
  async changePassword(passwords: ChangePasswordRequest): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/change-password', passwords)
    return response.data
  },
  
  // User Management (Admin)
  async getUsers(params?: {
    page?: number
    size?: number
    search?: string
    role?: string
    organization_id?: string
  }): Promise<ApiResponse<PaginatedResponse<UserResponse>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<UserResponse>>>(
      '/auth/users', 
      { params }
    )
    return response.data
  },
  
  async createUser(userData: RegisterRequest): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.post<ApiResponse<UserResponse>>('/auth/users', userData)
    return response.data
  },
  
  async updateUser(userId: string, updates: UpdateProfileRequest): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.patch<ApiResponse<UserResponse>>(`/auth/users/${userId}`, updates)
    return response.data
  },
  
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/auth/users/${userId}`)
    return response.data
  }
}
```

### Predictions API (`lib/api/predictions.ts`)

```typescript
import { apiClient } from './client'
import type { 
  Prediction, 
  CreatePredictionRequest,
  UpdatePredictionRequest,
  ApiResponse,
  PaginatedResponse 
} from '../types'

export const predictionsApi = {
  // Fetch predictions
  async getPredictions(params?: {
    type?: 'annual' | 'quarterly'
    page?: number
    size?: number
    search?: string
    risk_level?: string
    organization_id?: string
  }): Promise<ApiResponse<PaginatedResponse<Prediction>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Prediction>>>(
      '/predictions', 
      { params }
    )
    return response.data
  },
  
  async getPrediction(id: string): Promise<ApiResponse<Prediction>> {
    const response = await apiClient.get<ApiResponse<Prediction>>(`/predictions/${id}`)
    return response.data
  },
  
  // Create predictions
  async createPrediction(data: CreatePredictionRequest): Promise<ApiResponse<Prediction>> {
    const response = await apiClient.post<ApiResponse<Prediction>>('/predictions', data)
    return response.data
  },
  
  async createBatchPrediction(data: {
    file_id: string
    prediction_type: 'annual' | 'quarterly'
  }): Promise<ApiResponse<{ job_id: string }>> {
    const response = await apiClient.post<ApiResponse<{ job_id: string }>>(
      '/predictions/batch', 
      data
    )
    return response.data
  },
  
  // Update predictions
  async updatePrediction(
    id: string, 
    updates: UpdatePredictionRequest
  ): Promise<ApiResponse<Prediction>> {
    const response = await apiClient.patch<ApiResponse<Prediction>>(
      `/predictions/${id}`, 
      updates
    )
    return response.data
  },
  
  // Delete predictions
  async deletePrediction(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/predictions/${id}`)
    return response.data
  },
  
  async deleteBatchPredictions(ids: string[]): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/predictions/batch-delete', { ids })
    return response.data
  },
  
  // Analytics
  async getAnalytics(params?: {
    organization_id?: string
    date_range?: string
    risk_level?: string
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>('/predictions/analytics', { params })
    return response.data
  },
  
  // Export
  async exportPredictions(params: {
    type: 'annual' | 'quarterly'
    format: 'csv' | 'excel'
    filters?: any
  }): Promise<Blob> {
    const response = await apiClient.get('/predictions/export', {
      params,
      responseType: 'blob'
    })
    return response.data
  }
}
```

### File Upload API (`lib/api/upload.ts`)

```typescript
import { apiClient } from './client'
import type { ApiResponse } from '../types'

interface UploadResponse {
  file_id: string
  filename: string
  size: number
  url: string
}

interface BulkUploadJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  error_message?: string
  results_count?: number
  created_at: string
  completed_at?: string
}

export const uploadApi = {
  // File upload
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post<ApiResponse<UploadResponse>>(
      '/upload/file',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress?.(progress)
          }
        },
      }
    )
    return response.data
  },
  
  // Job management
  async createBulkJob(data: {
    file_id: string
    prediction_type: 'annual' | 'quarterly'
    organization_id?: string
  }): Promise<ApiResponse<{ job_id: string }>> {
    const response = await apiClient.post<ApiResponse<{ job_id: string }>>(
      '/upload/jobs',
      data
    )
    return response.data
  },
  
  async getJobStatus(jobId: string): Promise<ApiResponse<BulkUploadJob>> {
    const response = await apiClient.get<ApiResponse<BulkUploadJob>>(`/upload/jobs/${jobId}`)
    return response.data
  },
  
  async getJobs(params?: {
    status?: string
    page?: number
    size?: number
  }): Promise<ApiResponse<PaginatedResponse<BulkUploadJob>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<BulkUploadJob>>>(
      '/upload/jobs',
      { params }
    )
    return response.data
  },
  
  async cancelJob(jobId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/upload/jobs/${jobId}/cancel`)
    return response.data
  },
  
  async getJobResults(jobId: string): Promise<ApiResponse<Prediction[]>> {
    const response = await apiClient.get<ApiResponse<Prediction[]>>(`/upload/jobs/${jobId}/results`)
    return response.data
  },
  
  // File validation
  async validateFile(file: File): Promise<ApiResponse<{
    valid: boolean
    errors: string[]
    preview: any[]
  }>> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post<ApiResponse<any>>(
      '/upload/validate',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }
}
```

### Admin API (`lib/api/admin.ts`)

```typescript
import { apiClient } from './client'
import type { 
  TenantResponse,
  OrganizationResponse,
  UserResponse,
  ApiResponse,
  PaginatedResponse 
} from '../types'

export const adminApi = {
  // Tenant Management
  async getTenants(params?: {
    page?: number
    size?: number
    search?: string
  }): Promise<ApiResponse<PaginatedResponse<TenantResponse>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<TenantResponse>>>(
      '/admin/tenants',
      { params }
    )
    return response.data
  },
  
  async createTenant(data: {
    name: string
    description?: string
    admin_email: string
    admin_password: string
    admin_full_name: string
  }): Promise<ApiResponse<TenantResponse>> {
    const response = await apiClient.post<ApiResponse<TenantResponse>>('/admin/tenants', data)
    return response.data
  },
  
  async updateTenant(
    tenantId: string, 
    updates: Partial<TenantResponse>
  ): Promise<ApiResponse<TenantResponse>> {
    const response = await apiClient.patch<ApiResponse<TenantResponse>>(
      `/admin/tenants/${tenantId}`,
      updates
    )
    return response.data
  },
  
  async deleteTenant(tenantId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/tenants/${tenantId}`)
    return response.data
  },
  
  // Organization Management
  async getOrganizations(params?: {
    tenant_id?: string
    page?: number
    size?: number
    search?: string
  }): Promise<ApiResponse<PaginatedResponse<OrganizationResponse>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<OrganizationResponse>>>(
      '/admin/organizations',
      { params }
    )
    return response.data
  },
  
  async createOrganization(data: {
    name: string
    description?: string
    tenant_id: string
    admin_email?: string
    sector?: string
  }): Promise<ApiResponse<OrganizationResponse>> {
    const response = await apiClient.post<ApiResponse<OrganizationResponse>>(
      '/admin/organizations',
      data
    )
    return response.data
  },
  
  // User Invitations
  async inviteUser(data: {
    email: string
    role: string
    organization_id: string
    full_name?: string
  }): Promise<ApiResponse<{ invite_code: string }>> {
    const response = await apiClient.post<ApiResponse<{ invite_code: string }>>(
      '/admin/invitations',
      data
    )
    return response.data
  },
  
  async joinOrganizationByInvite(inviteCode: string): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.post<ApiResponse<UserResponse>>(
      `/admin/invitations/${inviteCode}/accept`
    )
    return response.data
  },
  
  // System Statistics
  async getSystemStats(): Promise<ApiResponse<{
    total_users: number
    total_tenants: number
    total_organizations: number
    total_predictions: number
    active_jobs: number
  }>> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/stats')
    return response.data
  }
}
```

## Error Handling Strategy

### API Error Types

```typescript
interface ApiError {
  message: string
  code?: string
  field?: string
  details?: any
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  errors?: ApiError[]
}
```

### Global Error Handler

```typescript
export function handleApiError(error: any): string {
  if (error.response?.data?.error) {
    return error.response.data.error.message || 'An error occurred'
  }
  
  if (error.response?.data?.errors?.length > 0) {
    return error.response.data.errors[0].message
  }
  
  if (error.response?.status === 401) {
    return 'Authentication required'
  }
  
  if (error.response?.status === 403) {
    return 'Access denied'
  }
  
  if (error.response?.status >= 500) {
    return 'Server error. Please try again later.'
  }
  
  return error.message || 'Unknown error occurred'
}
```

## React Query Integration

### Query Configuration

```typescript
// Custom hooks using React Query
export function usePredictions(params?: PredictionFilters) {
  return useQuery({
    queryKey: ['predictions', params],
    queryFn: () => predictionsApi.getPredictions(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.response?.status === 401) return false
      return failureCount < 3
    }
  })
}

export function useCreatePrediction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: predictionsApi.createPrediction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] })
      toast.success('Prediction created successfully')
    },
    onError: (error) => {
      toast.error(handleApiError(error))
    }
  })
}
```

### Optimistic Updates

```typescript
export function useUpdatePrediction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePredictionRequest }) =>
      predictionsApi.updatePrediction(id, updates),
      
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['predictions'] })
      
      // Snapshot previous value
      const previousPredictions = queryClient.getQueryData(['predictions'])
      
      // Optimistically update
      queryClient.setQueryData(['predictions'], (old: any) => ({
        ...old,
        data: {
          ...old.data,
          items: old.data.items.map((p: Prediction) =>
            p.id === id ? { ...p, ...updates } : p
          )
        }
      }))
      
      return { previousPredictions }
    },
    
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousPredictions) {
        queryClient.setQueryData(['predictions'], context.previousPredictions)
      }
      toast.error(handleApiError(error))
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] })
    }
  })
}
```

## API Configuration

### Environment Variables

```typescript
// lib/config/constants.ts
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const

// Environment-specific configuration
const config = {
  development: {
    API_URL: 'http://localhost:8000/api',
    DEBUG: true,
  },
  production: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
    DEBUG: false,
  }
}
```

This API integration architecture provides a robust, type-safe, and scalable foundation for communicating with the backend services while handling authentication, errors, and real-time updates efficiently.
