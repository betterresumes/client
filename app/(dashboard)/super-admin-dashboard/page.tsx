'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Building,
  Shield,
  Activity,
  BarChart3,
  Settings,
  UserPlus,
  Building2,
  AlertTriangle,
  TrendingUp,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

import { useAuth } from '@/lib/stores/auth'
import { authApi } from '@/lib/api/auth'
import { organizationsApi } from '@/lib/api/organizations'
import { UserRole } from '@/lib/types/user'

// Import the component tabs
import { UserManagementTab } from '@/components/admin/user-management-tab'
import { OrganizationManagementTab } from '@/components/admin/organization-management-tab'
import { SystemSettingsTab } from '@/components/admin/system-settings-tab'
import { PlatformOverviewTab } from '@/components/admin/platform-overview-tab'

interface AdminStats {
  totalUsers: number
  totalOrganizations: number
  activeUsers: number
  pendingUsers: number
  recentActivity: number
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const { user, isSuperAdmin } = useAuth()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalOrganizations: 0,
    activeUsers: 0,
    pendingUsers: 0,
    recentActivity: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not super admin
  useEffect(() => {
    if (!loading && user?.role !== 'super_admin') {
      router.push('/dashboard')
      return
    }
  }, [user?.role, loading, router])

  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadDashboardData()
    }
  }, [user?.role])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load users and organizations
      const [usersResponse, orgsResponse] = await Promise.all([
        authApi.getUsers({ page: 1, size: 1 }), // Just to get total count
        organizationsApi.list({ page: 1, limit: 1 }) // Just to get total count
      ])

      if (usersResponse.success && orgsResponse.success) {
        setStats({
          totalUsers: usersResponse.data?.total || 0,
          totalOrganizations: orgsResponse.data?.total || 0,
          activeUsers: usersResponse.data?.items?.filter(u => u.is_active).length || 0,
          pendingUsers: usersResponse.data?.items?.filter(u => !u.is_active).length || 0,
          recentActivity: 0, // This would come from activity logs
        })
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'super_admin' && !loading) {
    return null // Will redirect
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-500">Manage platform users, organizations, and settings</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <Shield className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active, {stats.pendingUsers} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              Active organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="organizations">
            <Building2 className="h-4 w-4 mr-2" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PlatformOverviewTab />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagementTab onStatsUpdate={setStats} />
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          <OrganizationManagementTab onStatsUpdate={setStats} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SystemSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
