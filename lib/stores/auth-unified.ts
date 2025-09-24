// DEPRECATED: This auth store is deprecated. Use auth-store.ts instead.
// This file provides backward compatibility for components still using the old auth store.

import { useAuthStore as useAuthStoreNew } from './auth-store'
import type { UserResponse } from '../types/auth'

// Export the new store with the old interface for backward compatibility
export const useAuthStore = useAuthStoreNew

// Helper hooks for common auth checks (kept for backward compatibility)
export const useAuth = () => {
  const auth = useAuthStoreNew()
  return {
    ...auth,
    // Map new auth store structure to old structure for backward compatibility
    user: auth.user,
    token: auth.accessToken,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoadingProfile,
    error: null, // The new store doesn't have a persistent error state

    // Computed auth helper methods
    isAdmin: auth.isAdmin(),
    isSuperAdmin: auth.user?.role === 'super_admin',
    isTenantAdmin: auth.isTenantAdmin(),
    isOrgAdmin: auth.isOrgAdmin(),
    canManageUsers: auth.canManageUsers(),
    canManageOrganizations: auth.canManageOrganizations(),

    // Backward compatibility methods
    login: async (email: string, password: string) => {
      // This would need to be implemented using the login flow from login-form
      console.warn('login method from useAuth is deprecated. Use the login form component instead.')
      return false
    },
    logout: () => {
      auth.clearAuth()
    },
    checkAuth: async () => {
      if (!auth.isAuthenticated || !auth.accessToken) {
        return false
      }

      // Refresh profile if needed
      if (auth.shouldRefreshProfile()) {
        const userData = await auth.refreshUserProfile()
        return !!userData
      }

      return true
    },
    setUser: (userData: UserResponse) => {
      auth.updateUser(userData)
    },
    clearError: () => {
      // No-op for backward compatibility
    }
  }
}
