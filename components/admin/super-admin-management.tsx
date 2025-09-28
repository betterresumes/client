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
  Search,
  Crown
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
import { useAuthStore } from '@/lib/stores/auth-store'
import { CreateTenantDialog } from './create-tenant-dialog'

interface SuperAdminManagementProps {
  initialTenants?: any[]
  onTenantUpdate?: () => void
}

export function SuperAdminManagement({ initialTenants = [], onTenantUpdate }: SuperAdminManagementProps) {
  const { user } = useAuthStore()
  const [tenants, setTenants] = useState<any[]>(initialTenants)
  const [platformStats, setPlatformStats] = useState<any>(null)
  const [loading, setLoading] = useState(!initialTenants.length)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateTenantDialog, setShowCreateTenantDialog] = useState(false)

  // Cache management
  const [dataCache, setDataCache] = useState<{
    tenants: any[]
    stats: any
    lastFetch: number
  } | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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

  useEffect(() => {
    // If we already have initial tenants data, just load stats
    if (initialTenants.length > 0) {
      setTenants(initialTenants)
      loadPlatformStats()
      return
    }

    // Check if we have cached data that's still valid
    const now = Date.now()
    if (dataCache && (now - dataCache.lastFetch) < CACHE_DURATION) {
      // Use cached data
      setTenants(dataCache.tenants)
      setPlatformStats(dataCache.stats)
      setLoading(false)
      return
    }

    // Load fresh data only if no initial data
    loadAllData()
  }, [initialTenants])

  const loadPlatformStats = async () => {
    setLoading(true)
    try {
      const currentTenants = tenants.length > 0 ? tenants : initialTenants

      // Calculate platform stats from existing tenant data
      const statsData = {
        total_tenants: currentTenants.length,
        active_tenants: currentTenants.filter((t: any) => t.is_active).length,
        total_organizations: currentTenants.reduce((sum: number, t: any) => sum + (t.total_organizations || 0), 0),
        total_users: currentTenants.reduce((sum: number, t: any) => sum + (t.total_users || 0), 0)
      }

      setPlatformStats(statsData)
    } catch (error) {
      console.error('Error calculating platform stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const tenantsResponse = await tenantsApi.list({ limit: 100 })

      const tenantsData = tenantsResponse.success ? (tenantsResponse.data?.tenants || []) : []

      // Calculate platform stats from tenant data
      const statsData = {
        total_tenants: tenantsData.length,
        active_tenants: tenantsData.filter((t: any) => t.is_active).length,
        total_organizations: tenantsData.reduce((sum: number, t: any) => sum + (t.total_organizations || 0), 0),
        total_users: tenantsData.reduce((sum: number, t: any) => sum + (t.total_users || 0), 0)
      }

      // Update state
      setTenants(tenantsData)
      setPlatformStats(statsData)

      // Update cache
      setDataCache({
        tenants: tenantsData,
        stats: statsData,
        lastFetch: Date.now()
      })
    } catch (error) {
      console.error('Error loading platform data:', error)
      toast.error('Failed to load platform data')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTenant = async (tenantId: string) => {
    // TODO: Implement tenant edit dialog
    console.log('Edit tenant:', tenantId)
    toast.info('Tenant edit functionality coming soon')
  }

  const handleTenantSettings = async (tenantId: string) => {
    // TODO: Implement tenant settings dialog
    console.log('Tenant settings:', tenantId)
    toast.info('Tenant settings functionality coming soon')
  }

  const handleTenantUsers = async (tenantId: string) => {
    // TODO: Implement tenant users dialog
    console.log('Tenant users:', tenantId)
    toast.info('Tenant users management coming soon')
  }

  const handleToggleTenantStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      setActionLoading(tenantId)

      const response = await tenantsApi.update(tenantId, { is_active: !currentStatus })

      if (response.success) {
        toast.success(`Tenant ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        refreshData()
      } else {
        toast.error(response.error?.message || 'Failed to update tenant status')
      }
    } catch (error: any) {
      console.error('Error updating tenant status:', error)
      toast.error(error.message || 'Failed to update tenant status')
    } finally {
      setActionLoading(null)
    }
  }

  const refreshData = () => {
    // Clear cache and force fresh load
    setDataCache(null)
    if (onTenantUpdate) {
      onTenantUpdate() // Call parent to refresh Zustand store
    } else {
      loadAllData()
    }
  }

  const filteredTenants = tenants.filter(tenant =>
    tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug?.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Platform Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Platform Administration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage all tenants and organizations across the platform
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
                <Building2 className="h-4 w-4 text-gray-500" />
                <span>Total Tenants: {tenants.length}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Active Tenants: {tenants.filter(t => t.is_active).length}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Building className="h-4 w-4 text-gray-500" />
                <span>Organizations: {platformStats?.total_organizations || 0}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span>Total Users: {platformStats?.total_users || 0}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-gray-500" />
                <span>Platform Status:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Operational
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Last Updated: {formatSafeDate(new Date().toISOString(), 'MMM dd, HH:mm')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Crown className="h-4 w-4 text-purple-500" />
                <span>Admin Level:</span>
              </div>
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                Super Administrator
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenants.length}</p>
                <p className="text-xs text-muted-foreground">Total Tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Building className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{platformStats?.total_organizations || 0}</p>
                <p className="text-xs text-muted-foreground">Total Organizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{platformStats?.total_users || 0}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenants.filter(t => t.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Active Tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Tenants Management</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage all tenants across the platform
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button
              onClick={() => setShowCreateTenantDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTenants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Organizations</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate" title={tenant.name}>{tenant.name}</div>
                          <div className="text-xs text-muted-foreground truncate" title={tenant.description || 'No description'}>
                            {tenant.description || 'No description'}
                          </div>
                          <div className="text-xs text-blue-600 font-mono">{tenant.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tenant.is_active ? (
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
                        <Building className="h-4 w-4 mr-1 text-gray-400" />
                        {tenant.total_organizations || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        {tenant.total_users || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatSafeDate(tenant.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleEditTenant(tenant.id)}
                          disabled={actionLoading === tenant.id}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleTenantSettings(tenant.id)}
                          disabled={actionLoading === tenant.id}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleTenantUsers(tenant.id)}
                          disabled={actionLoading === tenant.id}
                        >
                          <Users className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleToggleTenantStatus(tenant.id, tenant.is_active)}
                          disabled={actionLoading === tenant.id}
                        >
                          {tenant.is_active ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No tenants found' : 'No Tenants Yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? `No tenants match "${searchTerm}"`
                  : 'Start by creating your first tenant'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTenantDialog
        open={showCreateTenantDialog}
        onOpenChange={setShowCreateTenantDialog}
        onSuccess={refreshData}
      />
    </div>
  )
}
