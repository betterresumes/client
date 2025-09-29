'use client'

import { useAuthStore } from '@/lib/stores/auth-store'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { useDashboardStatsStore } from '@/lib/stores/dashboard-stats-store'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, User, Globe, RefreshCw, Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'

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
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Data Source:</span>
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
      </div>
    )
  }

  // Super admin: ONLY Platform tab (no personal/organizations access)
  if (isAdmin()) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Data Source:</span>
        <Tabs value={activeDataFilter} onValueChange={setDataFilter} className="w-auto">
          <TabsList className="bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="system" className="text-sm flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Platform
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    )
  }

  // Tenant admin: Organizations + Platform tabs (no personal - they manage organizations)
  if (isTenantAdmin()) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Data Source:</span>
        <Tabs value={activeDataFilter} onValueChange={setDataFilter} className="w-auto">
          <TabsList className="bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="organization" className="text-sm flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="system" className="text-sm flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Platform
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    )
  }

  // Org admin/member: Organization + Platform tabs ONLY (no personal data access)
  if (isOrgAdmin() || user.role === 'org_member') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Data Source:</span>
        <Tabs value={activeDataFilter} onValueChange={setDataFilter} className="w-auto">
          <TabsList className="bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="organization" className="text-sm flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Your Org
            </TabsTrigger>
            <TabsTrigger value="system" className="text-sm flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Platform
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    )
  }

  return null
}

export function OrganizationSelector() {
  const { user, isTenantAdmin } = useAuthStore()
  const { activeDataFilter, annualPredictions, quarterlyPredictions } = usePredictionsStore()

  // Get unique organizations from cached data for tenant admin
  const availableOrganizations = useMemo(() => {
    if (!isTenantAdmin()) return []

    const allPredictions = [...annualPredictions, ...quarterlyPredictions]
    const orgData = allPredictions
      .filter(p => p.organization_access === 'organization' && p.organization_name)
      .reduce((acc, pred) => {
        if (pred.organization_id && pred.organization_name && !acc[pred.organization_id]) {
          acc[pred.organization_id] = pred.organization_name
        }
        return acc
      }, {} as Record<string, string>)

    return Object.entries(orgData).map(([id, name]) => ({ id, name }))
  }, [isTenantAdmin, annualPredictions, quarterlyPredictions])

  // Only show for tenant admin when viewing organization data
  if (!isTenantAdmin() || activeDataFilter !== 'organization') {
    return null
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Organization:</span>
        <Select defaultValue="all-orgs">
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-orgs">All Organizations</SelectItem>
            {availableOrganizations.map(org => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
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
  const { activeDataFilter } = usePredictionsStore()
  const { stats, fetchStats } = useDashboardStatsStore()

  // Fetch dashboard stats when data filter changes
  useEffect(() => {
    fetchStats()
  }, [activeDataFilter, fetchStats])

  const formatLastDataUpdated = () => {
    if (!stats) {
      return 'Loading...'
    }

    let timestamp: string | undefined

    // Based on activeDataFilter, choose the appropriate timestamp
    switch (activeDataFilter) {
      case 'personal':
        // Use user_last_updated for personal data
        timestamp = stats.user_dashboard?.last_updated_times?.user_last_updated ||
          stats.last_updated_times?.user_last_updated
        break
      case 'organization':
        // Use user_last_updated for organization data (same as personal for now)
        timestamp = stats.user_dashboard?.last_updated_times?.user_last_updated ||
          stats.last_updated_times?.user_last_updated
        break
      case 'system':
        // Use system_last_updated for platform/system data
        timestamp = stats.platform_statistics?.last_updated_times?.system_last_updated ||
          stats.last_updated_times?.system_last_updated
        break
      default:
        // Default to user timestamp
        timestamp = stats.user_dashboard?.last_updated_times?.user_last_updated ||
          stats.last_updated_times?.user_last_updated
    }

    if (!timestamp) {
      return 'No timestamp available'
    }

    const updated = new Date(timestamp)

    // Format as full date and time for better visibility with UTC indicator
    const formattedTime = updated.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    return `${formattedTime} UTC`
  }

  return (
    <span className="text-xs text-gray-500 mt-2">
      Data Updated: {formatLastDataUpdated()}
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
