'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Building,
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

import { authApi } from '@/lib/api/auth'
import { organizationsApi } from '@/lib/api/organizations'
import { format, subDays, startOfDay } from 'date-fns'

interface PlatformMetrics {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  totalOrganizations: number
  activeOrganizations: number
  systemUptime: number
  totalApiCalls: number
  averageResponseTime: number
}

interface RecentActivity {
  id: string
  type: 'user_registered' | 'organization_created' | 'user_login' | 'job_completed'
  description: string
  timestamp: string
  user?: string
}

export function PlatformOverviewTab() {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalOrganizations: 0,
    activeOrganizations: 0,
    systemUptime: 99.9,
    totalApiCalls: 0,
    averageResponseTime: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOverviewData()
  }, [])

  const loadOverviewData = async () => {
    try {
      setLoading(true)

      // Load users and organizations
      const [usersResponse, orgsResponse] = await Promise.all([
        authApi.getUsers({ page: 1, size: 100 }),
        organizationsApi.list({ page: 1, limit: 100 })
      ])

      if (usersResponse.success && orgsResponse.success) {
        const users = usersResponse.data?.items || []
        const orgs = orgsResponse.data?.organizations || []

        const today = startOfDay(new Date())
        const newUsersToday = users.filter(user =>
          new Date(user.created_at) >= today
        ).length

        setMetrics({
          totalUsers: users.length,
          activeUsers: users.filter(u => u.is_active).length,
          newUsersToday,
          totalOrganizations: orgs.length,
          activeOrganizations: orgs.filter((o: any) => o.is_active).length,
          systemUptime: 99.9, // This would come from monitoring
          totalApiCalls: Math.floor(Math.random() * 10000), // Mock data
          averageResponseTime: Math.floor(Math.random() * 200), // Mock data
        })

        // Generate mock recent activity
        const mockActivity: RecentActivity[] = [
          {
            id: '1',
            type: 'user_registered',
            description: 'New user registered: john.doe@company.com',
            timestamp: new Date().toISOString(),
            user: 'john.doe@company.com'
          },
          {
            id: '2',
            type: 'organization_created',
            description: 'New organization created: TechCorp Inc.',
            timestamp: subDays(new Date(), 1).toISOString(),
            user: 'admin@techcorp.com'
          },
          {
            id: '3',
            type: 'job_completed',
            description: 'Bulk analysis job completed for 500 companies',
            timestamp: subDays(new Date(), 2).toISOString(),
            user: 'analyst@company.com'
          },
        ]
        setRecentActivity(mockActivity)
      }
    } catch (error) {
      console.error('Error loading overview data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registered':
        return <Users className="h-4 w-4 text-blue-600" />
      case 'organization_created':
        return <Building className="h-4 w-4 text-green-600" />
      case 'user_login':
        return <Activity className="h-4 w-4 text-purple-600" />
      case 'job_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityBadgeColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registered':
        return 'bg-blue-100 text-blue-800'
      case 'organization_created':
        return 'bg-green-100 text-green-800'
      case 'user_login':
        return 'bg-purple-100 text-purple-800'
      case 'job_completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.systemUptime}%
            </div>
            <p className="text-xs text-muted-foreground">System uptime</p>
            <Progress value={metrics.systemUptime} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newUsersToday}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round((metrics.newUsersToday / metrics.totalUsers) * 100)}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Performance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalApiCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Platform Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Users</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{metrics.totalUsers}</div>
                <div className="text-sm text-gray-500">
                  {metrics.activeUsers} active
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Organizations</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{metrics.totalOrganizations}</div>
                <div className="text-sm text-gray-500">
                  {metrics.activeOrganizations} active
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-500 mb-2">User Activity Rate</div>
              <Progress
                value={(metrics.activeUsers / metrics.totalUsers) * 100}
                className="h-2"
              />
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((metrics.activeUsers / metrics.totalUsers) * 100)}% of users are active
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getActivityBadgeColor(activity.type)}`}
                        >
                          {activity.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium">API Service</div>
                <div className="text-sm text-gray-500">Operational</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium">Database</div>
                <div className="text-sm text-gray-500">Operational</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium">File Storage</div>
                <div className="text-sm text-gray-500">Operational</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
