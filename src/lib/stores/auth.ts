import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthTokens } from '../types/auth'
import { authApi } from '../api/auth'
import { apiClient } from '../api/client'

interface AuthState {
  // State
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  register: (userData: { email: string; password: string; fullName: string; username?: string }) => Promise<boolean>
  updateProfile: (userData: Partial<User>) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (token: string, newPassword: string) => Promise<boolean>
  validateSession: () => Promise<boolean>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.login({ email, password })

          if (response.success && response.data) {
            const { user, tokens } = response.data

            // Set auth token in API client
            apiClient.setAuthToken(tokens.accessToken, tokens.refreshToken)

            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })

            return true
          } else {
            set({
              isLoading: false,
              error: response.error?.message || 'Login failed',
            })
            return false
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          })
          return false
        }
      },

      logout: async () => {
        set({ isLoading: true })

        try {
          await authApi.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.register(userData)

          if (response.success) {
            set({
              isLoading: false,
              error: null,
            })
            return true
          } else {
            set({
              isLoading: false,
              error: response.error?.message || 'Registration failed',
            })
            return false
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          })
          return false
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.updateProfile(userData)

          if (response.success && response.data) {
            set({
              user: response.data,
              isLoading: false,
              error: null,
            })
            return true
          } else {
            set({
              isLoading: false,
              error: response.error?.message || 'Profile update failed',
            })
            return false
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Profile update failed',
          })
          return false
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.changePassword({
            currentPassword,
            newPassword,
          })

          if (response.success) {
            set({
              isLoading: false,
              error: null,
            })
            return true
          } else {
            set({
              isLoading: false,
              error: response.error?.message || 'Password change failed',
            })
            return false
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Password change failed',
          })
          return false
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.forgotPassword({ email })

          if (response.success) {
            set({
              isLoading: false,
              error: null,
            })
            return true
          } else {
            set({
              isLoading: false,
              error: response.error?.message || 'Password reset request failed',
            })
            return false
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Password reset request failed',
          })
          return false
        }
      },

      resetPassword: async (token, newPassword) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.resetPassword({ token, newPassword })

          if (response.success) {
            set({
              isLoading: false,
              error: null,
            })
            return true
          } else {
            set({
              isLoading: false,
              error: response.error?.message || 'Password reset failed',
            })
            return false
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Password reset failed',
          })
          return false
        }
      },

      validateSession: async () => {
        set({ isLoading: true })

        try {
          const response = await authApi.validateSession()

          if (response.success && response.data?.valid) {
            if (response.data.user) {
              set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              })
            }
            return true
          } else {
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
            return false
          }
        } catch (error) {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
          return false
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
