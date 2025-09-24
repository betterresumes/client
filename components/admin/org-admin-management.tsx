'use client'

import { useEffect, useState } from 'react'
import {
  Building,
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
  EyeOff
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

import { organizationsApi } from '@/lib/api/organizations'
import { useAuthStore } from '@/lib/stores/auth-store'
import { InviteUserDialog } from '@/components/admin/invite-user-dialog'

interface OrgAdminManagementProps {
  organizationId: string
}

export function OrgAdminManagement({ organizationId }: OrgAdminManagementProps) {
  const { user } = useAuthStore()
  const [organization, setOrganization] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [whitelist, setWhitelist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showJoinToken, setShowJoinToken] = useState(false)

  // Cache management
  const [dataCache, setDataCache] = useState<{
    organization: any
    members: any[]
    whitelist: any[]
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
    if (organizationId) {
      // Check if we have cached data that's still valid
      const now = Date.now()
      if (dataCache && (now - dataCache.lastFetch) < CACHE_DURATION) {
        // Use cached data
        setOrganization(dataCache.organization)
        setMembers(dataCache.members)
        setWhitelist(dataCache.whitelist)
        setLoading(false)
        return
      }

      // Load fresh data
      loadAllData()
    }
  }, [organizationId, dataCache])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [orgResponse, membersResponse, whitelistResponse] = await Promise.all([
        organizationsApi.get(organizationId),
        organizationsApi.getUsers(organizationId, { limit: 100 }),
        organizationsApi.whitelist.list(organizationId, { limit: 100 })
      ])

      const orgData = orgResponse.success ? orgResponse.data : null
      const membersData = membersResponse.success ? (membersResponse.data?.users || []) : []
      const whitelistData = whitelistResponse.success ? (whitelistResponse.data?.whitelist || []) : []

      // Update state
      setOrganization(orgData)
      setMembers(membersData)
      setWhitelist(whitelistData)

      // Update cache
      setDataCache({
        organization: orgData,
        members: membersData,
        whitelist: whitelistData,
        lastFetch: Date.now()
      })
    } catch (error) {
      console.error('Error loading organization data:', error)
      toast.error('Failed to load organization data')
    } finally {
      setLoading(false)
    }
  }

  const loadOrganizationDetails = async () => {
    try {
      const response = await organizationsApi.get(organizationId)
      if (response.success && response.data) {
        setOrganization(response.data)
        // Update cache
        if (dataCache) {
          setDataCache({
            ...dataCache,
            organization: response.data,
            lastFetch: Date.now()
          })
        }
      }
    } catch (error) {
      console.error('Error loading organization details:', error)
      toast.error('Failed to load organization details')
    }
  }

  const loadMembers = async () => {
    try {
      const response = await organizationsApi.getUsers(organizationId, { limit: 100 })
      if (response.success && response.data) {
        const membersData = response.data.users || []
        setMembers(membersData)
        // Update cache
        if (dataCache) {
          setDataCache({
            ...dataCache,
            members: membersData,
            lastFetch: Date.now()
          })
        }
      }
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  const loadWhitelist = async () => {
    try {
      const response = await organizationsApi.whitelist.list(organizationId, { limit: 100 })
      if (response.success && response.data) {
        const whitelistData = response.data.whitelist || []
        setWhitelist(whitelistData)
        // Update cache
        if (dataCache) {
          setDataCache({
            ...dataCache,
            whitelist: whitelistData,
            lastFetch: Date.now()
          })
        }
      }
    } catch (error) {
      console.error('Error loading whitelist:', error)
    } finally {
      setLoading(false)
    }
  }

  const regenerateJoinToken = async () => {
    try {
      setActionLoading('regenerate-token')
      const response = await organizationsApi.regenerateJoinToken(organizationId)
      if (response.success) {
        toast.success('Join token regenerated successfully')
        await loadOrganizationDetails()
      } else {
        toast.error('Failed to regenerate join token')
      }
    } catch (error) {
      console.error('Error regenerating token:', error)
      toast.error('Failed to regenerate join token')
    } finally {
      setActionLoading(null)
    }
  }

  const copyJoinToken = () => {
    if (organization?.join_token) {
      navigator.clipboard.writeText(organization.join_token)
      toast.success('Join token copied to clipboard')
    }
  }

  const removeWhitelistEmail = async (email: string) => {
    try {
      setActionLoading(`remove-${email}`)
      const response = await organizationsApi.whitelist.remove(organizationId, email)
      if (response.success) {
        toast.success('Email removed from whitelist')
        setWhitelist(prev => prev.filter(item => item.email !== email))
      } else {
        toast.error('Failed to remove email from whitelist')
      }
    } catch (error) {
      console.error('Error removing email:', error)
      toast.error('Failed to remove email')
    } finally {
      setActionLoading(null)
    }
  }

  const refreshData = () => {
    // Clear cache and force fresh load
    setDataCache(null)
    loadAllData()
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Organization Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{organization?.name || 'Organization'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {organization?.description || 'No description available'}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span>Members: {members.length}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Created: {formatSafeDate(organization?.created_at)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-gray-500" />
                <span>Status:</span>
                {organization?.is_active ? (
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
                <Mail className="h-4 w-4 text-gray-500" />
                <span>Whitelist: {whitelist.length} emails</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <KeyRound className="h-4 w-4 text-gray-500" />
                <span>Join Token:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowJoinToken(!showJoinToken)}
                  className="h-6 px-2"
                >
                  {showJoinToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
              {showJoinToken && (
                <div className="flex items-center space-x-2">
                  <Input
                    value={organization?.join_token || ''}
                    readOnly
                    className="text-xs font-mono h-8"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyJoinToken}
                    className="h-8 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={regenerateJoinToken}
                    disabled={actionLoading === 'regenerate-token'}
                    className="h-8 px-2"
                  >
                    {actionLoading === 'regenerate-token' ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Organization Members</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage users who have joined your organization
            </p>
          </div>
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Users
          </Button>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {member.full_name?.split(' ').map((n: string) => n[0]).join('') || member.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{member.full_name || member.username}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {member.role?.replace('_', ' ') || 'Member'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.is_active ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-xs">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatSafeDate(member.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Yet</h3>
              <p className="text-gray-500 mb-4">
                Start by inviting users to join your organization
              </p>
              <Button onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First User
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Whitelist Management */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-lg">Email Whitelist</CardTitle>
            <p className="text-sm text-muted-foreground">
              Emails that are allowed to join your organization
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {whitelist.length > 0 ? (
            <div className="space-y-2">
              {whitelist.map((item) => (
                <div key={item.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{item.email}</span>
                    <Badge variant="outline" className="text-xs">
                      Added {formatSafeDate(item.created_at, 'MMM dd')}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWhitelistEmail(item.email)}
                    disabled={actionLoading === `remove-${item.email}`}
                    className="text-red-600 hover:text-red-700"
                  >
                    {actionLoading === `remove-${item.email}` ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No emails in whitelist</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      {organization && (
        <InviteUserDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          organizationId={organization.id}
          organizationName={organization.name}
          onUsersInvited={() => {
            loadWhitelist()
            loadMembers()
          }}
        />
      )}
    </div>
  )
}
