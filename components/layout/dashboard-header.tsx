'use client'

import { Settings, LogOut, User, ChevronDown, RefreshCw, TrendingUp, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

import { useAuthStore } from '@/lib/stores/auth-store'
import { useManualTokenRefresh } from '@/lib/hooks/use-token-refresh'

export function DashboardHeader() {
  const router = useRouter()
  const { user, clearAuth, isAdmin, isTenantAdmin, isOrgAdmin } = useAuthStore()
  const { refresh, isRefreshing: isManualRefreshing } = useManualTokenRefresh()

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }
  const getInitials = (firstName: string, lastName: string) => {
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase()
  }

  const getUserDisplayName = () => {
    if (!user) return 'User'

    // Priority: 1. full_name, 2. username, 3. email
    if (user.full_name?.trim()) return user.full_name.trim()
    if (user.username) return user.username
    return user.email || 'User'
  }

  const getOrganizationDisplayName = () => {
    // Show appropriate name based on user role
    // Tenant admin should see tenant name
    if (user?.role === 'tenant_admin' && user?.tenant?.name) {
      return user.tenant.name
    }

    // Organization admin and members should see organization name
    if ((user?.role === 'org_admin' || user?.role === 'org_member') && user?.organization?.name) {
      return user.organization.name
    }

    // Fallback: show organization name if available, then tenant name
    if (user?.organization?.name) {
      return user.organization.name
    }
    if (user?.tenant?.name) {
      return user.tenant.name
    }

    return null
  }

  const getUserInitials = () => {
    if (!user) return 'U'

    // Try to get initials from username first
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase()
    }

    // Try to get initials from full_name
    if (user.full_name) {
      const nameParts = user.full_name.trim().split(' ')
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      } else if (nameParts.length === 1) {
        return nameParts[0].substring(0, 2).toUpperCase()
      }
    }

    // Fallback to first letter of email
    return user.email?.[0]?.toUpperCase() || 'U'
  }

  const getRoleDisplayText = () => {
    if (!user) return ''

    switch (user.role) {
      case 'super_admin':
        return 'Super Admin'
      case 'tenant_admin':
        return 'Tenant Admin'
      case 'org_admin':
        return 'Org Admin'
      case 'org_member':
        return 'Org Member'
      case 'user':
        return 'User'
      default:
        return user.role
    }
  }

  const shouldShowOrgInfo = () => {
    const orgName = getOrganizationDisplayName()
    return orgName && !isAdmin()
  }

  return (
    <header className="bg-white my-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bricolage font-bold text-gray-900 dark:text-white">
                Credit Risk Assessment Platform
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Machine Learning-powered default rate analysis for S&P 500 and custom companies
              </p>
            </div>
            {isManualRefreshing && (
              <div className="flex items-center space-x-2 text-sm text-blue-600 ml-4">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Refreshing session...</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* User Organization/Tenant Info next to profile */}
            {shouldShowOrgInfo() && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-md">
                <Building2 className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">{getOrganizationDisplayName()}</span>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild className="">
                <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2 outline-none focus:ring-blue-500">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserDisplayName()}`} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getUserDisplayName()}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <div className="py-1">
                      <Badge variant="secondary" className="text-xs font-bold">
                        {getRoleDisplayText()}
                      </Badge>
                      {
                        user?.role !== 'super_admin' && user?.role !== 'user' && (
                          <Badge variant="secondary" className="text-xs mt-1 font-semibold">
                            {getOrganizationDisplayName() && (
                              <> {getOrganizationDisplayName()}</>
                            )}
                          </Badge>
                        )
                      }
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}