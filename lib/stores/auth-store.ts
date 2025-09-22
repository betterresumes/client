import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserResponse } from '../types/auth'
import { apiClient } from '../api/client'
import { API_CONFIG } from '../config/constants'
import axios from 'axios'

interface AuthState {
  // Auth state
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  user: UserResponse | null
  tokenExpiresAt: number | null
  isRefreshing: boolean

  // Actions
  setAuth: (accessToken: string, refreshToken: string, user: UserResponse, expiresIn?: number) => void
  clearAuth: () => void
  updateUser: (user: Partial<UserResponse>) => void
  refreshAccessToken: () => Promise<boolean>

  // Computed
  isAdmin: () => boolean
  isTenantAdmin: () => boolean
  isOrgAdmin: () => boolean
  canManageUsers: () => boolean
  canManageOrganizations: () => boolean
  isTokenExpired: () => boolean
  shouldRefreshToken: () => boolean
  getTokenTimeRemaining: () => number
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      tokenExpiresAt: null,
      isRefreshing: false,

      // Actions
      setAuth: (accessToken, refreshToken, user, expiresIn = 3600) => {
        // Set tokens in API client
        apiClient.setAuthToken(accessToken, refreshToken)

        const expiresAt = Date.now() + (expiresIn * 1000) // Convert seconds to milliseconds

        set({
          isAuthenticated: true,
          accessToken,
          refreshToken,
          user,
          tokenExpiresAt: expiresAt,
          isRefreshing: false,
        })

        // Clear and refresh prediction data after successful login
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            console.log('🔄 Auth set - refreshing prediction data')
            window.dispatchEvent(new CustomEvent('auth-login-success'))
          }, 100)
        }
      },

      refreshAccessToken: async () => {
        const state = get()

        if (state.isRefreshing) {
          // If already refreshing, wait for it to complete
          return new Promise((resolve) => {
            const checkRefresh = () => {
              const currentState = get()
              if (!currentState.isRefreshing) {
                resolve(currentState.isAuthenticated)
              } else {
                setTimeout(checkRefresh, 100)
              }
            }
            checkRefresh()
          })
        }

        if (!state.refreshToken) {
          get().clearAuth()
          return false
        }

        set({ isRefreshing: true })

        try {
          // Use the actual /auth/refresh endpoint
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {}, {
            headers: {
              'Authorization': `Bearer ${state.refreshToken}`
            }
          })

          const { access_token, expires_in = 3600 } = response.data
          const expiresAt = Date.now() + (expires_in * 1000)

          // Update tokens
          apiClient.setAuthToken(access_token, state.refreshToken)

          set({
            accessToken: access_token,
            tokenExpiresAt: expiresAt,
            isRefreshing: false,
          })

          // Notify that token was refreshed
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              console.log('🔄 Token refreshed - notifying listeners')
              window.dispatchEvent(new CustomEvent('auth-token-refreshed'))
            }, 50)
          }

          return true
        } catch (error) {
          console.error('Token refresh failed:', error)
          get().clearAuth()
          return false
        }
      },

      clearAuth: () => {
        // Clear tokens from API client
        apiClient.clearAuth()

        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          user: null,
          tokenExpiresAt: null,
          isRefreshing: false,
        })

        // Clear prediction data when logging out
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            console.log('🧹 Auth cleared - clearing prediction data')
            window.dispatchEvent(new CustomEvent('auth-logout'))
          }, 50)
        }
      },

      updateUser: (userData) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData }
          })
        }
      },

      // Computed helpers
      isAdmin: () => {
        const user = get().user
        return user?.role === 'super_admin'
      },

      isTenantAdmin: () => {
        const user = get().user
        return user?.role === 'super_admin' || user?.role === 'tenant_admin'
      },

      isOrgAdmin: () => {
        const user = get().user
        return ['super_admin', 'tenant_admin', 'org_admin'].includes(user?.role || '')
      },

      canManageUsers: () => {
        const user = get().user
        return ['super_admin', 'tenant_admin', 'org_admin'].includes(user?.role || '')
      },

      canManageOrganizations: () => {
        const user = get().user
        return user?.role === 'super_admin' || user?.role === 'tenant_admin'
      },

      isTokenExpired: () => {
        const state = get()
        if (!state.tokenExpiresAt) return false
        return Date.now() >= state.tokenExpiresAt
      },

      shouldRefreshToken: () => {
        const state = get()
        if (!state.tokenExpiresAt || !state.refreshToken) return false
        // Refresh if token expires in less than 2 minutes (120 seconds)
        const bufferTime = 2 * 60 * 1000 // 2 minutes in milliseconds
        return Date.now() >= (state.tokenExpiresAt - bufferTime)
      },

      getTokenTimeRemaining: () => {
        const state = get()
        if (!state.tokenExpiresAt) return 0
        const remaining = state.tokenExpiresAt - Date.now()
        return Math.max(0, remaining)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        tokenExpiresAt: state.tokenExpiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        // When store is rehydrated from localStorage, set tokens in API client
        if (state?.isAuthenticated && state?.accessToken) {
          apiClient.setAuthToken(state.accessToken, state.refreshToken || '')
        }
      },
    }
  )
)
