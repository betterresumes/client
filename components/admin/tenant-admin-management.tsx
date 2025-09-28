'use client'

import { useEffect, useState } from 'react'
import {
  Building,
  Building2,
  Users,
  UserPlus,
  Mail,
  KeyRound,
  Copy,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Shield,
  Settings,
  Eye,
  EyeOff,
  Plus,
  Search
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { tenantsApi } from '@/lib/api/tenants'
import { organizationsApi } from '@/lib/api/organizations'
import { CreateOrganizationDialog } from './create-organization-dialog'
import { EditOrganizationDialog } from './edit-organization-dialog'
import { AssignOrgAdminDialog } from './assign-org-admin-dialog'
import { useAuthStore } from '@/lib/stores/auth-store'

interface TenantAdminManagementProps {
  tenantId: string
  initialOrganizations?: any[]
  onOrganizationUpdate?: () => void
}

export function TenantAdminManagement({ tenantId, initialOrganizations = [], onOrganizationUpdate }: TenantAdminManagementProps) {
  const { user } = useAuthStore()
  const [tenant, setTenant] = useState<any>(null)
  const [organizations, setOrganizations] = useState<any[]>(initialOrganizations)
  const [tenantStats, setTenantStats] = useState<any>(null)
  const [loading, setLoading] = useState(!initialOrganizations.length)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [assignAdminDialogOpen, setAssignAdminDialogOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null)

  // Helper function to safely format dates
  const formatSafeDate = (dateString: string | null | undefined, formatStr: string = 'MMM dd, yyyy') => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return format(date, formatStr)
    } catch {
      return 'N/A'
    }
  }

  const loadTenantDetails = async () => {
    try {
      const [tenantResponse, statsResponse] = await Promise.all([
        tenantsApi.get(tenantId),
        tenantsApi.getStats(tenantId)
      ])

      if (tenantResponse.success) {
        setTenant(tenantResponse.data)
      }

      if (statsResponse.success) {
        setTenantStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error loading tenant details:', error)
    }
  }

  const loadOrganizations = async () => {
    if (initialOrganizations.length) return // Use props data if available

    try {
      const response = await organizationsApi.list({ tenant_id: tenantId, limit: 100 })
      if (response.success) {
        setOrganizations(response.data?.organizations || [])
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  useEffect(() => {
    if (user && tenantId) {
      const loadData = async () => {
        setLoading(true)
        await Promise.all([
          loadTenantDetails(),
          !initialOrganizations.length && loadOrganizations()
        ].filter(Boolean))
        setLoading(false)
      }

      loadData()
    }
  }, [user, tenantId])

  const refreshData = async () => {
    await Promise.all([
      loadTenantDetails(),
      loadOrganizations()
    ])

    // Call parent callback to refresh global store
    if (onOrganizationUpdate) {
      onOrganizationUpdate()
    }
  }

  const filteredOrganizations = organizations.filter(org =>
    org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-gray-200 rounded-lg"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tenant Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{tenant?.name || 'Tenant'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {tenant?.description || 'No description available'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Building className="h-4 w-4 text-gray-500" />
                <span>Organizations: {organizations.length}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Created: {formatSafeDate(tenant?.created_at)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span>Total Users: {tenantStats?.total_users || 0}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Active Users: {tenantStats?.active_users || 0}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-gray-500" />
                <span>Status:</span>
                {tenant?.is_active ? (
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
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Building className="h-4 w-4 text-green-500" />
                <span>Active Orgs: {organizations.filter(org => org.is_active).length}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <KeyRound className="h-4 w-4 text-gray-500" />
                <span>Domain:</span>
              </div>
              <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                {tenant?.domain || tenant?.slug + '.app.com' || 'No domain'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Building className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{organizations.length}</p>
                <p className="text-xs text-muted-foreground">Total Organizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{organizations.filter(org => org.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Active Organizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenantStats?.total_users || 0}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenantStats?.active_users || 0}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Organizations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage organizations within your tenant
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Organization
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrganizations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate" title={org.name}>{org.name}</div>
                          <div className="text-xs text-muted-foreground truncate" title={org.description || 'No description'}>
                            {org.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.is_active ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-xs">
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
                    <TableCell className="text-xs">
                      {formatSafeDate(org.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            setSelectedOrganization(org)
                            setEditDialogOpen(true)
                          }}
                          title="Edit Organization"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            setSelectedOrganization(org)
                            setAssignAdminDialogOpen(true)
                          }}
                          title="Assign Org Admin"
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          title="View Members"
                        >
                          <Users className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No organizations found' : 'No Organizations Yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? `No organizations match "${searchTerm}"`
                  : 'Start by creating your first organization'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Organization Dialog */}
      <CreateOrganizationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onOrganizationCreated={() => {
          refreshData()
          toast.success('Organization created successfully!')
        }}
        tenantId={tenantId}
      />

      {/* Edit Organization Dialog */}
      {selectedOrganization && (
        <EditOrganizationDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          organization={selectedOrganization}
          onSuccess={() => {
            refreshData()
            setSelectedOrganization(null)
            toast.success('Organization updated successfully!')
          }}
        />
      )}

      {/* Assign Org Admin Dialog */}
      {selectedOrganization && (
        <AssignOrgAdminDialog
          open={assignAdminDialogOpen}
          onOpenChange={setAssignAdminDialogOpen}
          organization={selectedOrganization}
          onSuccess={() => {
            refreshData()
            setSelectedOrganization(null)
            toast.success('Org admin assigned successfully!')
          }}
        />
      )}
    </div>
  )
}
