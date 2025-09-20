import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserResponse } from '../types/auth'

interface AuthState {
  // Auth state
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  user: UserResponse | null

  // Actions
  setAuth: (accessToken: string, refreshToken: string, user: UserResponse) => void
  clearAuth: () => void
  updateUser: (user: Partial<UserResponse>) => void

  // Computed
  isAdmin: () => boolean
  isTenantAdmin: () => boolean
  isOrgAdmin: () => boolean
  canManageUsers: () => boolean
  canManageOrganizations: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,

      // Actions
      setAuth: (accessToken, refreshToken, user) => {
        set({
          isAuthenticated: true,
          accessToken,
          refreshToken,
          user,
        })
      },

      clearAuth: () => {
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          user: null,
        })
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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)
