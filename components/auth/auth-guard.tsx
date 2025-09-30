'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  allowedRoles?: string[]
}

export function AuthGuard({
  children,
  requireAuth = true,
  allowedRoles = []
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, isAdmin, isTenantAdmin, isOrgAdmin, accessToken, shouldRefreshToken, refreshAccessToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Listen for logout events for immediate redirect
  useEffect(() => {
    const handleLogout = () => {
      console.log('🚪 Logout event detected, redirecting to login')
      router.replace('/login')
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-logout', handleLogout)
      return () => window.removeEventListener('auth-logout', handleLogout)
    }
  }, [router])

  useEffect(() => {
    if (!isClient) return

    const checkAuth = async () => {
      console.log('🔐 AuthGuard checking auth:', {
        isAuthenticated,
        hasUser: !!user,
        requireAuth,
        pathname,
        hasAccessToken: !!accessToken
      })

      // If user is authenticated and on login page, redirect to dashboard immediately
      if (isAuthenticated && user && pathname === '/login') {
        console.log('✅ Authenticated user on login page, redirecting to dashboard')
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard'
        sessionStorage.removeItem('redirectAfterLogin')
        router.replace(redirectTo)
        return
      }

      // If we have a stored token but need to refresh, do it
      if (accessToken && shouldRefreshToken()) {
        console.log('🔄 Token needs refresh, refreshing...')
        const refreshed = await refreshAccessToken()
        if (!refreshed && requireAuth) {
          console.log('❌ Token refresh failed, redirecting to login')
          if (pathname !== '/login') {
            sessionStorage.setItem('redirectAfterLogin', pathname)
          }
          router.replace('/login')
          return
        }
      }

      if (requireAuth && !isAuthenticated) {
        console.log('❌ Auth required but not authenticated, redirecting to login')
        // Store the intended destination in sessionStorage for redirect after login
        if (pathname !== '/login') {
          sessionStorage.setItem('redirectAfterLogin', pathname)
        }
        router.replace('/login')  // Use replace to avoid back button issues
        return
      }

      if (allowedRoles.length > 0 && user) {
        const hasPermission = allowedRoles.some(role => {
          switch (role) {
            case 'super_admin':
              return user.role === 'super_admin'
            case 'tenant_admin':
              return isTenantAdmin()
            case 'org_admin':
              return isOrgAdmin()
            case 'admin':
              return isAdmin()
            default:
              return user.role === role
          }
        })

        if (!hasPermission) {
          console.log('❌ User lacks required permissions, redirecting to dashboard')
          router.replace('/dashboard')
          return
        }
      }

      console.log('✅ Auth check passed')
      setIsLoading(false)
    }

    // Run checkAuth immediately without delay
    checkAuth()
  }, [isAuthenticated, user, requireAuth, allowedRoles, router, pathname, isAdmin, isTenantAdmin, isOrgAdmin, isClient, accessToken, shouldRefreshToken, refreshAccessToken])

  // Fast-track for obvious cases to prevent unnecessary loading states
  useEffect(() => {
    if (!isClient) return

    // If user is clearly authenticated and not on login page, stop loading immediately
    if (isAuthenticated && user && pathname !== '/login' && !requireAuth) {
      setIsLoading(false)
    }

    // If on login page and not requiring auth, stop loading immediately  
    if (pathname === '/login' && !requireAuth) {
      setIsLoading(false)
    }
  }, [isAuthenticated, user, pathname, requireAuth, isClient])

  // Show loading spinner while checking auth to prevent flash
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return <>{children}</>
}
