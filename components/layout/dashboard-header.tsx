'use client'

import { useState } from 'react'
import { Search, Bell, Settings, LogOut, User, ChevronDown, RefreshCw } from 'lucide-react'
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
  const { user, clearAuth, isRefreshing, getTokenTimeRemaining } = useAuthStore()
  const { refresh, isRefreshing: isManualRefreshing } = useManualTokenRefresh()

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  const handleManualRefresh = async () => {
    const success = await refresh()
    if (!success) {
      // If manual refresh fails, redirect to login
      router.push('/login')
    }
  }

  // Get time remaining for token expiration (for debugging/admin view)
  const timeRemaining = getTokenTimeRemaining()
  const minutesRemaining = Math.floor(timeRemaining / (1000 * 60))

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'tenant_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'org_admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'org_member':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatRole = (role: string) => {
    return role.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side - Token refresh indicator */}
        <div className="flex items-center space-x-3">
          {(isRefreshing || isManualRefreshing) && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Refreshing session...</span>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">

          {/* Manual refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isManualRefreshing}
            className="text-gray-600 hover:text-gray-900"
            title="Refresh session"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing || isManualRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name}`} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user?.full_name ? getInitials(user.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.full_name || 'User'}
                  </span>
                  <Badge className={`text-xs ${getRoleBadgeColor(user?.role || 'user')}`}>
                    {formatRole(user?.role || 'user')}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
