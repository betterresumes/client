'use client'

import { useState } from 'react'
import { Search, Bell, Settings, LogOut, User, ChevronDown, RefreshCw, TrendingUp } from 'lucide-react'
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
  const timeRemaining = getTokenTimeRemaining()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
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
            {(isRefreshing || isManualRefreshing) && (
              <div className="flex items-center space-x-2 text-sm text-blue-600 ml-4">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Refreshing session...</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="">
                <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2 outline-none focus:ring-blue-500">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name}`} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {user?.full_name ? getInitials(user.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.full_name || 'User'}
                    </span>
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
      </div>
    </header>
  )
}
