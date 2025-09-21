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
  const { isAuthenticated, user, isAdmin, isTenantAdmin, isOrgAdmin } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const checkAuth = async () => {
      if (requireAuth && !isAuthenticated) {
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
          router.replace('/dashboard')
          return
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [isAuthenticated, user, requireAuth, allowedRoles, router, pathname, isAdmin, isTenantAdmin, isOrgAdmin, isClient])

  // Don't render any content until client is ready and auth is checked
  if (!isClient || isLoading) {
    return null
  }

  return <>{children}</>
}
