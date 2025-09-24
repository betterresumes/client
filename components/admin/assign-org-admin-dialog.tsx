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

import { organizationsApi } from '@/lib/api/organizations'
import { authApi } from '@/lib/api/auth'

interface AssignOrgAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: any
  onSuccess?: () => void
}

export function AssignOrgAdminDialog({
  open,
  onOpenChange,
  organization,
  onSuccess
}: AssignOrgAdminDialogProps) {
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [orgUsers, setOrgUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Load organization users and available users
  useEffect(() => {
    if (open && organization?.id) {
      loadData()
    }
  }, [open, organization?.id])

  const loadData = async () => {
    try {
      setSearchLoading(true)

      // Load organization users
      const orgUsersResponse = await organizationsApi.getUsers(organization.id, { limit: 100 })
      const orgUsersData = orgUsersResponse.success ? (orgUsersResponse.data?.users || []) : []
      setOrgUsers(orgUsersData)

      // Load all tenant users (for tenant admin to assign)
      const allUsersResponse = await authApi.getUsers({
        size: 100,
        tenant_id: organization.tenant_id
      })
      const allUsersData = allUsersResponse.success ? (allUsersResponse.data?.items || []) : []

      // Filter out users who are already org admins
      const orgAdminIds = orgUsersData
        .filter((user: any) => user.role === 'org_admin')
        .map((user: any) => user.id)

      const availableUsersData = allUsersData.filter((user: any) =>
        !orgAdminIds.includes(user.id) &&
        user.role !== 'super_admin' // Super admins don't need to be assigned
      )

      setAvailableUsers(availableUsersData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load users')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAssignAdmin = async (userId: string) => {
    if (!userId || !organization?.id) return

    try {
      setLoading(true)

      // First add user to organization if not already a member
      const isOrgMember = orgUsers.some(user => user.id === userId)

      if (!isOrgMember) {
        const addUserResponse = await organizationsApi.addUserToOrg(organization.id, {
          user_id: userId,
          role: 'org_admin'
        })

        if (!addUserResponse.success) {
          throw new Error(addUserResponse.error?.message || 'Failed to add user to organization')
        }
      } else {
        // Update existing user role to org_admin
        const updateRoleResponse = await organizationsApi.updateUserRole(organization.id, userId, 'org_admin')

        if (!updateRoleResponse.success) {
          throw new Error(updateRoleResponse.error?.message || 'Failed to update user role')
        }
      }

      const assignedUser = availableUsers.find(user => user.id === userId) ||
        orgUsers.find(user => user.id === userId)

      toast.success(`${assignedUser?.full_name || assignedUser?.email} assigned as org admin successfully! 👑`)

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Error assigning org admin:', error)
      toast.error(error.message || 'Failed to assign org admin')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = availableUsers.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Org Admin
          </DialogTitle>
          <DialogDescription>
            Assign a user as an administrator for "{organization?.name || 'organization'}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Users */}
          <div className="space-y-2">
            <Label>Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                        {user.full_name?.substring(0, 2).toUpperCase() ||
                          user.email?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {user.full_name || user.email}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {user.role === 'tenant_admin' ? (
                        <Shield className="h-3 w-3 mr-1" />
                      ) : (
                        <User className="h-3 w-3 mr-1" />
                      )}
                      {user.role?.replace('_', ' ')}
                    </Badge>

                    <Button
                      size="sm"
                      onClick={() => handleAssignAdmin(user.id)}
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Assign
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm">
                  {searchTerm
                    ? `No users found matching "${searchTerm}"`
                    : 'No available users to assign'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
