import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, UserRole } from '../types/user'
import { authApi } from '../api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
  clearError: () => void
  refreshToken: () => Promise<boolean>
  checkAuth: () => Promise<boolean>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.login({ email, password })

          if (response.success && response.data) {
            const { access_token } = response.data

            // Get user profile after successful login
            const userResponse = await authApi.getMe()

            if (userResponse.success && userResponse.data) {
              // Convert auth user to our User type
              const user: User = {
                id: userResponse.data.id,
                email: userResponse.data.email,
                first_name: userResponse.data.full_name?.split(' ')[0] || '',
                last_name: userResponse.data.full_name?.split(' ').slice(1).join(' ') || '',
                role: userResponse.data.role as UserRole,
                status: 'active' as any, // Convert from is_active boolean
                company_id: userResponse.data.organization_id || '',
                is_verified: userResponse.data.is_active || false,
                created_at: userResponse.data.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_login: userResponse.data.last_login
              }

              set({
                token: access_token,
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null
              })

              return { success: true }
            } else {
              const errorMessage = typeof userResponse.error === 'string'
                ? userResponse.error
                : userResponse.error?.message || 'Failed to get user profile'

              set({
                isLoading: false,
                error: errorMessage
              })
              return { success: false, error: errorMessage }
            }
          } else {
            const errorMessage = typeof response.error === 'string'
              ? response.error
              : response.error?.message || 'Login failed'

            set({
              isLoading: false,
              error: errorMessage
            })
            return { success: false, error: errorMessage }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed'
          set({ isLoading: false, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      logout: () => {
        // Call API logout if needed
        authApi.logout().catch(console.error)

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },

      setUser: (user: User) => {
        set({ user })
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true })
      },

      clearError: () => {
        set({ error: null })
      },

      refreshToken: async () => {
        const { token } = get()
        if (!token) return false

        try {
          const response = await authApi.refreshToken()

          if (response.success && response.data) {
            set({
              token: response.data.access_token,
              isAuthenticated: true
            })
            return true
          } else {
            // Token refresh failed, logout user
            get().logout()
            return false
          }
        } catch (error) {
          console.error('Token refresh failed:', error)
          get().logout()
          return false
        }
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) return false

        try {
          const response = await authApi.getMe()

          if (response.success && response.data) {
            // Convert auth user to our User type
            const user: User = {
              id: response.data.id,
              email: response.data.email,
              first_name: response.data.full_name?.split(' ')[0] || '',
              last_name: response.data.full_name?.split(' ').slice(1).join(' ') || '',
              role: response.data.role as UserRole,
              status: 'active' as any,
              company_id: response.data.organization_id || '',
              is_verified: response.data.is_active || false,
              created_at: response.data.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_login: response.data.last_login
            }

            set({
              user,
              isAuthenticated: true
            })
            return true
          } else {
            get().logout()
            return false
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          get().logout()
          return false
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Helper hooks for common auth checks
export const useAuth = () => {
  const auth = useAuthStore()
  return {
    ...auth,
    isAdmin: auth.user?.role === UserRole.ADMIN || auth.user?.role === UserRole.SUPER_ADMIN,
    isSuperAdmin: auth.user?.role === UserRole.SUPER_ADMIN,
    hasRole: (role: UserRole) => auth.user?.role === role,
    hasAnyRole: (roles: UserRole[]) => auth.user ? roles.includes(auth.user.role) : false
  }
}
