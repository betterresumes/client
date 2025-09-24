'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfile } from '@/lib/hooks/use-auth'
import {
  User,
  Building,
  Building2,
  Users,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  Globe,
  Mail,
  Calendar,
  Activity
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export function UserDetailsPanel() {
  const { data: userDetails, isLoading, error } = useProfile()
  const [isExpanded, setIsExpanded] = useState(false)

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600">Failed to load user details</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </div>
      </Card>
    )
  }

  if (isLoading || !userDetails) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Card>
    )
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      case 'tenant_admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'org_admin':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'org_member':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300'
    }
  }

  const formatRoleDisplay = (role: string) => {
    return role.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* User Basic Info */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {userDetails.full_name || userDetails.username || 'Unknown User'}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="h-3 w-3 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {userDetails.email}
                </span>
              </div>
            </div>
          </div>
          <Badge className={getRoleBadgeColor(userDetails.role)}>
            {formatRoleDisplay(userDetails.role)}
          </Badge>
        </div>

        <Separator />

        {/* Basic User Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              Joined: {new Date(userDetails.created_at).toLocaleDateString()}
            </span>
          </div>
          {userDetails.last_login && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Last Login: {new Date(userDetails.last_login).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-gray-400" />
            <span className={`text-sm ${userDetails.is_active ? 'text-green-600' : 'text-red-600'}`}>
              {userDetails.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              ID: {userDetails.id.slice(0, 8)}...
            </span>
          </div>
        </div>

        {/* Role-based Details - TODO: Fix data structure */}
        {false && ( // Temporarily disabled
          <>
            <Separator />
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <span className="font-medium">Detailed Information</span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                {/* Tenant Admin Details */}
                {userDetails && (userDetails as any).tenant_details && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <h4 className="font-medium text-gray-900 dark:text-white">Tenant Information</h4>
                    </div>
                    <div className="ml-6 space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {(userDetails as any).tenant_details.name}
                      </div>
                      <div>
                        <span className="font-medium">Slug:</span> {(userDetails as any).tenant_details.slug}
                      </div>
                      {(userDetails as any).tenant_details.domain && (
                        <div>
                          <span className="font-medium">Domain:</span> {(userDetails as any).tenant_details.domain}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        <Badge variant={(userDetails as any).tenant_details.is_active ? 'default' : 'destructive'}>
                          {(userDetails as any).tenant_details.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>{' '}
                        {new Date((userDetails as any).tenant_details.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Organizations under this tenant */}
                    {(userDetails as any).tenant_details.organizations.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Building2 className="h-4 w-4 text-green-500" />
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            Organizations ({(userDetails as any).tenant_details.organizations.length})
                          </h5>
                        </div>
                        <div className="ml-6 space-y-2">
                          {(userDetails as any).tenant_details.organizations.map((org: any) => (
                            <div key={org.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div>
                                <div className="font-medium text-sm">{org.name}</div>
                                <div className="text-xs text-gray-500">
                                  {org.member_count} members • {org.slug}
                                </div>
                              </div>
                              <Badge variant={org.is_active ? 'default' : 'destructive'} className="text-xs">
                                {org.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Organization Member/Admin Details */}
                {userDetails && (userDetails as any).organization_details && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-green-500" />
                      <h4 className="font-medium text-gray-900 dark:text-white">Organization Information</h4>
                    </div>
                    <div className="ml-6 space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Organization:</span> {(userDetails as any).organization_details.name}
                      </div>
                      <div>
                        <span className="font-medium">Tenant:</span> {(userDetails as any).organization_details.tenant_name}
                      </div>
                      <div>
                        <Badge className={getRoleBadgeColor((userDetails as any).organization_details.user_role_in_org)}>
                          {formatRoleDisplay((userDetails as any).organization_details.user_role_in_org)}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Members:</span> {(userDetails as any).organization_details.member_count}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        <Badge variant={(userDetails as any).organization_details.is_active ? 'default' : 'destructive'}>
                          {(userDetails as any).organization_details.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>{' '}
                        {new Date((userDetails as any).organization_details.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Permissions */}
                {userDetails && (userDetails as any).permissions && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-orange-500" />
                      <h4 className="font-medium text-gray-900 dark:text-white">Permissions</h4>
                    </div>
                    <div className="ml-6 space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${(userDetails as any).permissions.can_view_analytics ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span>View Analytics</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${(userDetails as any).permissions.can_manage_users ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span>Manage Users</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${(userDetails as any).permissions.can_manage_organizations ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span>Manage Organizations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${(userDetails as any).permissions.can_manage_tenants ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span>Manage Tenants</span>
                      </div>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </div>
    </Card>
  )
}
