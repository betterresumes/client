import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth-store'
import type {
  LoginRequest,
  RegisterRequest,
  UserProfile,
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserCreate,
  UserResponse
} from '../types/auth'

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  users: () => [...authKeys.all, 'users'] as const,
  user: (id: string) => [...authKeys.users(), id] as const,
} as const


export function useLogin() {
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await authApi.login(credentials)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Login failed')
      }
      return response.data
    },
    onSuccess: (data) => {
      if (data.user) {
        setAuth(data.access_token, data.refresh_token || '', data.user)
      } else {
        setAuth(data.access_token, data.refresh_token || '', null as any)
      }
      toast.success('Login successful')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed')
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await authApi.register(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Registration failed')
      }
      return response.data
    },
    onSuccess: () => {
      toast.success('Registration successful! Please login.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed')
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const { clearAuth } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      const response = await authApi.logout()
      if (!response.success) {
        throw new Error(response.error?.message || 'Logout failed')
      }
      return response.data
    },
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
      toast.success('Logged out successfully')
    },
    onError: (error: Error) => {
      clearAuth()
      queryClient.clear()
      toast.error(error.message || 'Logout failed')
    },
  })
}

export function useProfile() {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: async () => {
      const response = await authApi.getMe()
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load profile')
      }
      return response.data
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, 
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        return false
      }
      return failureCount < 3
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await authApi.updateProfile(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update profile')
      }
      return response.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.profile(), data)
      toast.success('Profile updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile')
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const response = await authApi.changePassword(data)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to change password')
      }
      return response.data
    },
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change password')
    },
  })
}

export function useUsers(params?: {
  page?: number
  size?: number
  search?: string
  role?: string
  tenant_id?: string
  organization_id?: string
}) {
  return useQuery({
    queryKey: [...authKeys.users(), params],
    queryFn: async () => {
      const response = await authApi.getUsers(params)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load users')
      }
      return response.data
    },
    staleTime: 2 * 60 * 1000, 
  })
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: authKeys.user(userId),
    queryFn: async () => {
      const response = await authApi.getUserById(userId)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load user')
      }
      return response.data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, 
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateProfileRequest }) => {
      const response = await authApi.updateUser(userId, data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update user')
      }
      return { userId, data: response.data }
    },
    onSuccess: ({ userId, data }) => {
      queryClient.setQueryData(authKeys.user(userId), data)
      queryClient.invalidateQueries({ queryKey: authKeys.users() })
      toast.success('User updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user')
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authApi.deleteUser(userId)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete user')
      }
      return userId
    },
    onSuccess: (userId) => {
      queryClient.removeQueries({ queryKey: authKeys.user(userId) })
      queryClient.invalidateQueries({ queryKey: authKeys.users() })
      toast.success('User deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user')
    },
  })
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: UserCreate) => {
      const response = await authApi.admin.createUser(userData)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create user')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.users() })
      toast.success('User created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user')
    },
  })
}

export function useAdminImpersonateUser() {
  const authStore = useAuthStore()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authApi.admin.impersonateUser(userId)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to impersonate user')
      }
      return response.data
    },
    onSuccess: (tokenData) => {
      authStore.setAuth(tokenData.access_token, tokenData.refresh_token || '', {} as UserResponse)
      toast.success('User impersonation activated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to impersonate user')
    },
  })
}

export function useAdminForcePasswordReset() {
  return useMutation({
    mutationFn: async (params: { userId: string; newPassword: string }) => {
      const response = await authApi.admin.forcePasswordReset(params.userId, params.newPassword)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to reset password')
      }
      return response
    },
    onSuccess: () => {
      toast.success('Password reset successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset password')
    },
  })
}

export function useUserLoginHistory(userId: string) {
  return useQuery({
    queryKey: [...authKeys.user(userId), 'login-history'],
    queryFn: async () => {
      const response = await authApi.admin.getUserLoginHistory(userId)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch login history')
      }
      return response.data
    },
    enabled: !!userId,
    staleTime: 30 * 1000, 
    refetchOnWindowFocus: false,
  })
}

export function useAdminBulkActivateUsers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      const response = await authApi.admin.bulkActivateUsers(userIds)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to bulk activate users')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.users() })
      toast.success('Users activated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to bulk activate users')
    },
  })
}
