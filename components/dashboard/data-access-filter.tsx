'use client'

import { useAuthStore } from '@/lib/stores/auth-store'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Building2, User, Globe, Settings, RefreshCw, Loader2 } from 'lucide-react'
import { useEffect } from 'react'

export function DataSourceTabs() {
  const { user, isAdmin, isTenantAdmin, isOrgAdmin } = useAuthStore()
  const { activeDataFilter, setDataFilter, getDefaultFilterForUser } = usePredictionsStore()

  // Initialize the filter based on user role on mount
  useEffect(() => {
    if (user) {
      const defaultFilter = getDefaultFilterForUser(user)
      console.log('🎯 Setting data filter for user role:', user.role, 'to:', defaultFilter)
      if (activeDataFilter !== defaultFilter) {
        setDataFilter(defaultFilter)
      }
    }
  }, [user?.role, setDataFilter, getDefaultFilterForUser])

  if (!user) return null

  // Normal user: Personal + System tabs
  if (user.role === 'user') {
    return (
      <Tabs value={activeDataFilter} onValueChange={setDataFilter} className="w-auto">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="personal" className="text-sm flex items-center gap-1">
            <User className="h-3 w-3" />
            Your Data
          </TabsTrigger>
          <TabsTrigger value="system" className="text-sm flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Platform
          </TabsTrigger>
        </TabsList>
      </Tabs>
    )
  }

  // Super admin: Full access to all data types
  if (isAdmin()) {
    return (
      <Tabs value={activeDataFilter} onValueChange={setDataFilter} className="w-auto">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="personal" className="text-sm flex items-center gap-1">
            <User className="h-3 w-3" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="organization" className="text-sm flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="system" className="text-sm flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="all" className="text-sm flex items-center gap-1">
            <Settings className="h-3 w-3" />
            All Data
          </TabsTrigger>
        </TabsList>
      </Tabs>
    )
  }

  // Tenant admin: Personal + System tabs
  if (isTenantAdmin()) {
    return (
      <Tabs value={activeDataFilter} onValueChange={setDataFilter} className="w-auto">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="personal" className="text-sm flex items-center gap-1">
            <User className="h-3 w-3" />
            Your Data
          </TabsTrigger>
          <TabsTrigger value="system" className="text-sm flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Platform
          </TabsTrigger>
        </TabsList>
      </Tabs>
    )
  }

  // Org admin/member: Organization + System tabs
  if (isOrgAdmin() || user.role === 'org_member') {
    const orgName = user.organization?.name || 'Organization'

    return (
      <Tabs value={activeDataFilter} onValueChange={setDataFilter} className="w-auto">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="organization" className="text-sm flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {orgName}
          </TabsTrigger>
          <TabsTrigger value="system" className="text-sm flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Platform
          </TabsTrigger>
        </TabsList>
      </Tabs>
    )
  }

  return null
}

export function RefreshButton() {
  const { isLoading, refetchPredictions } = usePredictionsStore()

  return (
    <Button
      onClick={() => refetchPredictions()}
      variant="outline"
      size="sm"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
    </Button>
  )
}

export function LastUpdatedInfo() {
  const { lastFetched } = usePredictionsStore()

  const formatLastUpdated = () => {
    if (!lastFetched) return 'Never'
    const now = new Date()
    const updated = new Date(lastFetched)
    const diffInMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <span className="text-xs text-gray-500">
      Updated: {formatLastUpdated()}
    </span>
  )
}

// Keep the old component for backward compatibility, but simplified
export function DataAccessFilter() {
  return (
    <div className="flex items-center gap-2">
      <DataSourceTabs />
      <RefreshButton />
    </div>
  )
}
