'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Loader2, Search, Shield, User } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

import { authApi } from '@/lib/api/auth'
import { useAssignExistingUserAsTenantAdmin } from '@/lib/hooks/use-tenant-admin'

interface AssignTenantAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: any
  onSuccess?: () => void
}

export function AssignTenantAdminDialog({
  open,
  onOpenChange,
  tenant,
  onSuccess
}: AssignTenantAdminDialogProps) {
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const assignTenantAdminMutation = useAssignExistingUserAsTenantAdmin()

  // Load available users for tenant admin assignment
  useEffect(() => {
    if (open && tenant?.id) {
      loadAvailableUsers()
    }
  }, [open, tenant?.id])

  const loadAvailableUsers = async () => {
    try {
      setSearchLoading(true)

      // Load all users in the tenant (excluding current tenant admins and super admins)
      const allUsersResponse = await authApi.getUsers({
        size: 100,
        tenant_id: tenant.id
      })
      const allUsersData = allUsersResponse.success ? (allUsersResponse.data?.items || []) : []

      // Filter out users who are already tenant admins or super admins
      const availableUsersData = allUsersData.filter((user: any) =>
        user.role !== 'tenant_admin' &&
        user.role !== 'super_admin' &&
        user.is_active
      )

      setAvailableUsers(availableUsersData)
    } catch (error) {
      console.error('Error loading available users:', error)
      toast.error('Failed to load users')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAssignTenantAdmin = async (userEmail: string) => {
    if (!userEmail || !tenant?.id) return

    try {
      setLoading(true)

      await assignTenantAdminMutation.mutateAsync({
        user_email: userEmail,
        tenant_id: tenant.id
      })

      const assignedUser = availableUsers.find(user => user.email === userEmail)
      toast.success(`${assignedUser?.full_name || assignedUser?.email} assigned as tenant admin successfully! 👑`)

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Error assigning tenant admin:', error)
      toast.error(error.message || 'Failed to assign tenant admin')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = availableUsers.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.split(' ')
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0]
    }
    return email ? email[0].toUpperCase() : 'U'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assign Tenant Admin
          </DialogTitle>
          <DialogDescription>
            Assign a user as an administrator for tenant "{tenant?.name || 'tenant'}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Users */}
          <div className="space-y-2">
            <Label>Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {searchLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No available users found</p>
                <p className="text-xs">All eligible users may already be tenant admins</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                        {getInitials(user.full_name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {user.full_name || 'No name'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {user.role?.replace('_', ' ') || 'User'}
                        </Badge>
                        {user.organization?.name && (
                          <Badge variant="secondary" className="text-xs">
                            {user.organization.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssignTenantAdmin(user.email)}
                    disabled={loading}
                    className="ml-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Assign'
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Current Tenant Admins Info */}
          {tenant?.tenant_admins && tenant.tenant_admins.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-sm text-gray-600">Current Tenant Admins ({tenant.total_tenant_admins || 0})</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {tenant.tenant_admins.slice(0, 3).map((admin: any) => (
                  <div key={admin.id} className="flex items-center space-x-2 text-xs">
                    <Shield className="h-3 w-3 text-blue-500" />
                    <span>{admin.full_name || admin.email}</span>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      Tenant Admin
                    </Badge>
                  </div>
                ))}
                {tenant.tenant_admins.length > 3 && (
                  <p className="text-xs text-gray-500">
                    + {tenant.tenant_admins.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
