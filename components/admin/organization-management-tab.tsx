'use client'

import { useEffect, useState } from 'react'
import {
  Building,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  UserPlus,
  Calendar,
  Globe,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { organizationsApi } from '@/lib/api/organizations'
import { EnhancedOrganizationResponse } from '@/lib/types/tenant'
import { CreateOrganizationDialog } from '@/components/admin/create-organization-dialog'
import { InviteUserDialog } from '@/components/admin/invite-user-dialog'
import { useAuthStore } from '@/lib/stores/auth-store'

interface OrganizationManagementTabProps {
  onStatsUpdate?: (stats: any) => void
}

export function OrganizationManagementTab({ onStatsUpdate }: OrganizationManagementTabProps) {
  const [organizations, setOrganizations] = useState<EnhancedOrganizationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<EnhancedOrganizationResponse | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { user, isOrgAdmin, canManageOrganizations } = useAuthStore()

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const response = await organizationsApi.list({ page: 1, limit: 100 })

      if (response.success && response.data) {
        setOrganizations(response.data.organizations || [])

        // Update stats
        if (onStatsUpdate) {
          const activeOrgs = response.data.organizations?.filter((org: any) => org.is_active).length || 0

          onStatsUpdate((prev: any) => ({
            ...prev,
            totalOrganizations: response.data?.organizations?.length || 0,
            activeOrganizations: activeOrgs,
          }))
        }
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOrganizationAction = async (orgId: string, action: 'activate' | 'deactivate' | 'delete') => {
    try {
      setActionLoading(orgId)

      switch (action) {
        case 'activate':
          const activateResponse = await organizationsApi.update(orgId, { is_active: true })
          if (activateResponse.success) {
            toast.success('Organization activated successfully')
            await loadOrganizations()
          } else {
            toast.error('Failed to activate organization')
          }
          break
        case 'deactivate':
          const deactivateResponse = await organizationsApi.update(orgId, { is_active: false })
          if (deactivateResponse.success) {
            toast.success('Organization deactivated successfully')
            await loadOrganizations()
          } else {
            toast.error('Failed to deactivate organization')
          }
          break
        case 'delete':
          const deleteResponse = await organizationsApi.delete(orgId)
          if (deleteResponse.success) {
            toast.success('Organization deleted successfully')
            await loadOrganizations()
          } else {
            toast.error('Failed to delete organization')
          }
          break
      }
    } catch (error) {
      console.error(`Error ${action} organization:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && org.is_active) ||
      (statusFilter === 'inactive' && !org.is_active)

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Organization Management</h3>
          <p className="text-sm text-gray-500">
            Manage organizations and their settings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrganizations}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canManageOrganizations() && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Organization
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search organizations by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Organizations ({filteredOrganizations.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Organization</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[80px]">Members</TableHead>
                    <TableHead className="min-w-[100px]">Created</TableHead>
                    <TableHead className="min-w-[120px]">Website</TableHead>
                    <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-blue-600 rounded flex items-center justify-center">
                              <Building className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate" title={org.name}>{org.name}</div>
                            <div className="text-sm text-muted-foreground truncate" title={org.description || 'No description'}>
                              {org.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.is_active ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {org.total_members || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(org.created_at), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.domain ? (
                          <a
                            href={`https://${org.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center truncate max-w-[120px]"
                            title={org.domain}
                          >
                            <Globe className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{org.domain}</span>
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoading === org.id}
                            >
                              {actionLoading === org.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(canManageOrganizations() ||
                              (isOrgAdmin() && user?.organization_id === org.id)) && (
                                <>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Organization
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedOrg(org)
                                      setShowInviteDialog(true)
                                    }}
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Invite Users
                                  </DropdownMenuItem>
                                </>
                              )}
                            <DropdownMenuItem>
                              <Users className="mr-2 h-4 w-4" />
                              View Members
                            </DropdownMenuItem>
                            {canManageOrganizations() && (
                              <DropdownMenuItem
                                onClick={() => handleOrganizationAction(
                                  org.id,
                                  org.is_active ? 'deactivate' : 'activate'
                                )}
                              >
                                {org.is_active ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {canManageOrganizations() && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this organization?')) {
                                    handleOrganizationAction(org.id, 'delete')
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Organization
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filteredOrganizations.length === 0 && (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No organizations found
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'No organizations match your current filters.'
                  : 'Get started by adding your first organization.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Organization Dialog */}
      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onOrganizationCreated={loadOrganizations}
      />

      {/* Invite User Dialog */}
      {selectedOrg && (
        <InviteUserDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          organizationId={selectedOrg.id}
          organizationName={selectedOrg.name}
          onUsersInvited={loadOrganizations}
        />
      )}
    </div>
  )
}
