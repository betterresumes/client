'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Lock,
  Bell,
  Shield,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Building,
  Building2,
  Users,
  UserPlus,
  Copy,
  Plus,
  Trash2,
  Edit,
  KeyRound
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

import { useAuth } from '@/lib/stores/auth'
import { authApi } from '@/lib/api/auth'
import { organizationsApi } from '@/lib/api/organizations'
import { tenantsApi } from '@/lib/api/tenants'
import { tenantAdminApi } from '@/lib/api/tenant-admin'
import { UserRole } from '@/lib/types/auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import { usePredictionsStore } from '@/lib/stores/predictions-store'

// Form schemas
const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

const joinOrgSchema = z.object({
  join_token: z.string().min(1, 'Invite code is required'),
})

const createTenantSchema = z.object({
  name: z.string().min(2, 'Tenant name must be at least 2 characters'),
  description: z.string().optional(),
  admin_email: z.string().email('Valid email required'),
  admin_password: z.string().min(8, 'Password must be at least 8 characters'),
  admin_first_name: z.string().min(2, 'First name required'),
  admin_last_name: z.string().min(2, 'Last name required'),
})

const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  description: z.string().optional(),
})

const inviteUserSchema = z.object({
  email: z.string().email('Valid email address required'),
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>
type JoinOrgFormData = z.infer<typeof joinOrgSchema>
type CreateTenantFormData = z.infer<typeof createTenantSchema>
type CreateOrgFormData = z.infer<typeof createOrgSchema>
type InviteUserFormData = z.infer<typeof inviteUserSchema>

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  last_login?: string
  organization_id?: string
  tenant_id?: string
}

interface Organization {
  id: string
  name: string
  description?: string
  join_token?: string
  member_count?: number
  is_active: boolean
}

interface Tenant {
  id: string
  name: string
  description?: string
  organization_count?: number
  is_active: boolean
}

interface OrganizationMember {
  id: string
  email: string
  full_name?: string
  role: UserRole
  is_active: boolean
  joined_at: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Role-based management state
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)

  // Dialog state
  const [showCreateTenantDialog, setShowCreateTenantDialog] = useState(false)
  const [showCreateOrgDialog, setShowCreateOrgDialog] = useState(false)
  const [showInviteUserDialog, setShowInviteUserDialog] = useState(false)

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
    }
  })

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    }
  })

  // Join organization form
  const joinOrgForm = useForm<JoinOrgFormData>({
    resolver: zodResolver(joinOrgSchema),
    defaultValues: {
      join_token: '',
    }
  })

  // Create tenant form
  const createTenantForm = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      description: '',
      admin_email: '',
      admin_password: '',
      admin_first_name: '',
      admin_last_name: '',
    }
  })

  // Create org form
  const createOrgForm = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  })

  // Invite user form
  const inviteUserForm = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
    }
  })

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const response = await authApi.getProfile()

      if (response.success && response.data) {
        const userData = response.data
        const profile: UserProfile = {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name || '',
          role: userData.role as UserRole,
          is_active: userData.is_active,
          created_at: userData.created_at,
          last_login: userData.last_login,
          organization_id: userData.organization_id,
          tenant_id: userData.tenant_id,
        }
        setProfile(profile)
        // Update form with current data
        profileForm.reset({
          full_name: userData.full_name || '',
          email: userData.email,
        })

        // Load role-based data
        if (profile.role === 'super_admin') {
          await loadTenants()
        } else if (profile.role === 'tenant_admin') {
          await loadOrganizations()
        } else if (profile.role === 'org_admin' && profile.organization_id) {
          setSelectedOrg(profile.organization_id)
          await loadOrgMembers(profile.organization_id)
          await loadOrganizations() // Load to get join token info
        }
      } else {
        setError('Failed to load profile')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const loadTenants = async () => {
    try {
      const response = await tenantsApi.list()
      if (response.success && response.data) {
        setTenants(response.data.tenants || [])
      }
    } catch (error) {
      console.error('Error loading tenants:', error)
    }
  }

  const loadOrganizations = async () => {
    try {
      // For tenant admins, filter by their tenant_id to only show their organizations
      const params: any = {}
      if (profile?.role === 'tenant_admin' && user?.tenant_id) {
        params.tenant_id = user.tenant_id
      }

      const response = await organizationsApi.list(params)
      if (response.success && response.data) {
        setOrganizations(response.data.organizations || [])

        // If user is tenant admin, refresh predictions to show filtered data
        if (profile?.role === 'tenant_admin' && user?.tenant_id) {
          const predictionsStore = usePredictionsStore.getState()
          predictionsStore.invalidateCache()
        }
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  const loadOrgMembers = async (orgId: string) => {
    try {
      const response = await organizationsApi.getUsers(orgId)
      if (response.success && response.data) {
        const members = response.data.users.map(user => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active,
          joined_at: user.created_at
        }))
        setOrgMembers(members)
      }
    } catch (error) {
      console.error('Error loading organization members:', error)
    }
  }

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await authApi.updateProfile({
        full_name: data.full_name,
        email: data.email,
      })

      if (response.success && response.data) {
        const userData = response.data
        const profile: UserProfile = {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name || '',
          role: userData.role as UserRole,
          is_active: userData.is_active,
          created_at: userData.created_at,
          last_login: userData.last_login,
          organization_id: userData.organization_id,
        }
        setProfile(profile)
        // Update auth store if needed
        if (user) {
          const nameParts = userData.full_name?.split(' ') || ['', '']
          setUser({
            ...user,
            email: userData.email,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
          })
        }
        setSuccess('Profile updated successfully')
      } else {
        setError('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await authApi.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      })

      if (response.success) {
        setSuccess('Password changed successfully')
        passwordForm.reset()
        setShowCurrentPassword(false)
        setShowNewPassword(false)
        setShowConfirmPassword(false)
      } else {
        setError('Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setError('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const onJoinOrgSubmit = async (data: JoinOrgFormData) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await authApi.joinOrganization({
        join_token: data.join_token,
      })

      if (response.success) {
        setSuccess('Successfully joined organization!')
        joinOrgForm.reset()
        // Reload profile to get updated organization info
        await loadProfileData()
      } else {
        setError(typeof response.error === 'string' ? response.error : 'Failed to join organization')
      }
    } catch (error) {
      console.error('Error joining organization:', error)
      setError('Failed to join organization')
    } finally {
      setSaving(false)
    }
  }

  const onCreateTenantSubmit = async (data: CreateTenantFormData) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await tenantAdminApi.createTenantWithAdmin({
        tenant_name: data.name,
        tenant_description: data.description,
        admin_email: data.admin_email,
        admin_password: data.admin_password,
        admin_first_name: data.admin_first_name,
        admin_last_name: data.admin_last_name,
      })

      if (response.success) {
        setSuccess('Tenant created successfully!')
        createTenantForm.reset()
        setShowCreateTenantDialog(false)
        await loadTenants()
      } else {
        setError(typeof response.error === 'string' ? response.error : 'Failed to create tenant')
      }
    } catch (error) {
      console.error('Error creating tenant:', error)
      setError('Failed to create tenant')
    } finally {
      setSaving(false)
    }
  }

  const onCreateOrgSubmit = async (data: CreateOrgFormData) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await organizationsApi.create({
        name: data.name,
        description: data.description,
      })

      if (response.success) {
        setSuccess('Organization created successfully!')
        createOrgForm.reset()
        setShowCreateOrgDialog(false)
        await loadOrganizations()
      } else {
        setError(typeof response.error === 'string' ? response.error : 'Failed to create organization')
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      setError('Failed to create organization')
    } finally {
      setSaving(false)
    }
  }

  const onInviteUserSubmit = async (data: InviteUserFormData) => {
    if (!selectedOrg) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await organizationsApi.whitelist.add(selectedOrg, {
        email: data.email,
      })

      if (response.success) {
        setSuccess(`Invitation sent to ${data.email}!`)
        inviteUserForm.reset()
        setShowInviteUserDialog(false)
      } else {
        setError(typeof response.error === 'string' ? response.error : 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      setError('Failed to send invitation')
    } finally {
      setSaving(false)
    }
  }

  const getTabsGridCols = () => {
    let tabCount = 2 // profile + security
    if (profile?.role !== 'super_admin' && profile?.role !== 'tenant_admin' && !profile?.organization_id) tabCount++
    if (profile?.role === 'super_admin') tabCount++
    if (profile?.role === 'tenant_admin') tabCount++
    if (profile?.role === 'org_admin') tabCount++

    return `grid-cols-${Math.min(tabCount, 6)}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'tenant_admin':
      case 'org_admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
      case 'tenant_admin':
      case 'org_admin':
        return <Shield className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load settings
          </h3>
          <p className="text-gray-500 mb-4">
            Unable to load your settings information
          </p>
          <Button onClick={loadProfileData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className={`grid w-full ${getTabsGridCols()}`}>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>

          {/* Join Organization for users without org (not super_admin or tenant_admin) */}
          {profile?.role !== 'super_admin' && profile?.role !== 'tenant_admin' && !profile?.organization_id && (
            <TabsTrigger value="join-org">
              <Building2 className="h-4 w-4 mr-2" />
              Join Organization
            </TabsTrigger>
          )}

          {/* Super Admin: Tenant Management */}
          {profile?.role === 'super_admin' && (
            <TabsTrigger value="tenant-management">
              <Building className="h-4 w-4 mr-2" />
              Tenant Management
            </TabsTrigger>
          )}

          {/* Tenant Admin: Organization Management */}
          {profile?.role === 'tenant_admin' && (
            <TabsTrigger value="org-management">
              <Building2 className="h-4 w-4 mr-2" />
              Organization Management
            </TabsTrigger>
          )}

          {/* Org Admin: Member Management */}
          {profile?.role === 'org_admin' && (
            <TabsTrigger value="member-management">
              <Users className="h-4 w-4 mr-2" />
              Member Management
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      {...profileForm.register('full_name')}
                      placeholder="Enter your full name"
                    />
                    {profileForm.formState.errors.full_name && (
                      <p className="text-sm text-red-600 mt-1">
                        {profileForm.formState.errors.full_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...profileForm.register('email')}
                      placeholder="Enter your email"
                    />
                    {profileForm.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">
                        {profileForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Role</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className={getRoleColor(profile.role)}>
                        {getRoleIcon(profile.role)}
                        <span className="ml-1 capitalize">
                          {profile.role.replace('_', ' ')}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Contact an administrator to change your role
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving || !profileForm.formState.isDirty}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="current_password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      {...passwordForm.register('current_password')}
                      placeholder="Enter your current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.current_password && (
                    <p className="text-sm text-red-600 mt-1">
                      {passwordForm.formState.errors.current_password.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showNewPassword ? 'text' : 'password'}
                        {...passwordForm.register('new_password')}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.new_password && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.new_password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...passwordForm.register('confirm_password')}
                        placeholder="Confirm new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.confirm_password && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.confirm_password.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    <Lock className="h-4 w-4 mr-2" />
                    {saving ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Join Organization Tab - for users without org */}
        {profile?.role !== 'super_admin' && profile?.role !== 'tenant_admin' && !profile?.organization_id && (
          <TabsContent value="join-org">
            <Card>
              <CardHeader>
                <CardTitle>Join Organization</CardTitle>
                <p className="text-sm text-gray-600">
                  Enter an invitation code to join an organization
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={joinOrgForm.handleSubmit(onJoinOrgSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="join_token">Invitation Code</Label>
                    <Input
                      id="join_token"
                      {...joinOrgForm.register('join_token')}
                      placeholder="Enter your invitation code"
                    />
                    {joinOrgForm.formState.errors.join_token && (
                      <p className="text-sm text-red-600 mt-1">
                        {joinOrgForm.formState.errors.join_token.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      <Building2 className="h-4 w-4 mr-2" />
                      {saving ? 'Joining...' : 'Join Organization'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Super Admin: Tenant Management */}
        {profile?.role === 'super_admin' && (
          <TabsContent value="tenant-management">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Tenant Management</CardTitle>
                      <p className="text-sm text-gray-600">
                        Create and manage tenants
                      </p>
                    </div>
                    <Dialog open={showCreateTenantDialog} onOpenChange={setShowCreateTenantDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Tenant
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Tenant</DialogTitle>
                          <DialogDescription>
                            Create a new tenant and assign an admin user
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={createTenantForm.handleSubmit(onCreateTenantSubmit)} className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <Label htmlFor="tenant_name">Tenant Name</Label>
                              <Input
                                id="tenant_name"
                                {...createTenantForm.register('name')}
                                placeholder="Enter tenant name"
                              />
                              {createTenantForm.formState.errors.name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {createTenantForm.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="admin_email">Admin Email</Label>
                              <Input
                                id="admin_email"
                                type="email"
                                {...createTenantForm.register('admin_email')}
                                placeholder="admin@example.com"
                              />
                              {createTenantForm.formState.errors.admin_email && (
                                <p className="text-sm text-red-600 mt-1">
                                  {createTenantForm.formState.errors.admin_email.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="tenant_description">Description (Optional)</Label>
                            <Input
                              id="tenant_description"
                              {...createTenantForm.register('description')}
                              placeholder="Enter tenant description"
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <Label htmlFor="admin_first_name">Admin First Name</Label>
                              <Input
                                id="admin_first_name"
                                {...createTenantForm.register('admin_first_name')}
                                placeholder="John"
                              />
                              {createTenantForm.formState.errors.admin_first_name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {createTenantForm.formState.errors.admin_first_name.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="admin_last_name">Admin Last Name</Label>
                              <Input
                                id="admin_last_name"
                                {...createTenantForm.register('admin_last_name')}
                                placeholder="Doe"
                              />
                              {createTenantForm.formState.errors.admin_last_name && (
                                <p className="text-sm text-red-600 mt-1">
                                  {createTenantForm.formState.errors.admin_last_name.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="admin_password">Admin Password</Label>
                              <Input
                                id="admin_password"
                                type="password"
                                {...createTenantForm.register('admin_password')}
                                placeholder="Password"
                              />
                              {createTenantForm.formState.errors.admin_password && (
                                <p className="text-sm text-red-600 mt-1">
                                  {createTenantForm.formState.errors.admin_password.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreateTenantDialog(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                              {saving ? 'Creating...' : 'Create Tenant'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tenants.length === 0 ? (
                      <div className="text-center py-8">
                        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No tenants found</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Organizations</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tenants.map((tenant) => (
                            <TableRow key={tenant.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{tenant.name}</p>
                                  {tenant.description && (
                                    <p className="text-sm text-gray-500">{tenant.description}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{tenant.organization_count || 0}</TableCell>
                              <TableCell>
                                <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                                  {tenant.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Tenant Admin: Organization Management */}
        {profile?.role === 'tenant_admin' && (
          <TabsContent value="org-management">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Organization Management</CardTitle>
                      <p className="text-sm text-gray-600">
                        Create and manage organizations in your tenant
                      </p>
                    </div>
                    <Dialog open={showCreateOrgDialog} onOpenChange={setShowCreateOrgDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Organization
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Organization</DialogTitle>
                          <DialogDescription>
                            Create a new organization in your tenant
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={createOrgForm.handleSubmit(onCreateOrgSubmit)} className="space-y-4">
                          <div>
                            <Label htmlFor="org_name">Organization Name</Label>
                            <Input
                              id="org_name"
                              {...createOrgForm.register('name')}
                              placeholder="Enter organization name"
                            />
                            {createOrgForm.formState.errors.name && (
                              <p className="text-sm text-red-600 mt-1">
                                {createOrgForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="org_description">Description (Optional)</Label>
                            <Input
                              id="org_description"
                              {...createOrgForm.register('description')}
                              placeholder="Enter organization description"
                            />
                          </div>

                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreateOrgDialog(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                              {saving ? 'Creating...' : 'Create Organization'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {organizations.length === 0 ? (
                      <div className="text-center py-8">
                        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No organizations found</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Join Token</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {organizations.map((org) => (
                            <TableRow key={org.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{org.name}</p>
                                  {org.description && (
                                    <p className="text-sm text-gray-500">{org.description}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{org.member_count || 0}</TableCell>
                              <TableCell>
                                <Badge variant={org.is_active ? 'default' : 'secondary'}>
                                  {org.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {org.join_token && (
                                  <div className="flex items-center space-x-2">
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      {org.join_token.substring(0, 8)}...
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(org.join_token || '')}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Org Admin: Member Management */}
        {profile?.role === 'org_admin' && (
          <TabsContent value="member-management">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Member Management</CardTitle>
                      <p className="text-sm text-gray-600">
                        Manage organization members and send invitations
                      </p>
                    </div>
                    <Dialog open={showInviteUserDialog} onOpenChange={setShowInviteUserDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite New Member</DialogTitle>
                          <DialogDescription>
                            Send an invitation to join your organization
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={inviteUserForm.handleSubmit(onInviteUserSubmit)} className="space-y-4">
                          <div>
                            <Label htmlFor="invite_email">Email Address</Label>
                            <Input
                              id="invite_email"
                              type="email"
                              {...inviteUserForm.register('email')}
                              placeholder="user@example.com"
                            />
                            {inviteUserForm.formState.errors.email && (
                              <p className="text-sm text-red-600 mt-1">
                                {inviteUserForm.formState.errors.email.message}
                              </p>
                            )}
                          </div>

                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowInviteUserDialog(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                              {saving ? 'Sending...' : 'Send Invitation'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orgMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No members found</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orgMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>{member.full_name || 'N/A'}</TableCell>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getRoleColor(member.role)}>
                                  {getRoleIcon(member.role)}
                                  <span className="ml-1 capitalize">
                                    {member.role.replace('_', ' ')}
                                  </span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={member.is_active ? 'default' : 'secondary'}>
                                  {member.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(member.joined_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Organization Join Token Card */}
              {profile?.organization_id && (
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Join Code</CardTitle>
                    <p className="text-sm text-gray-600">
                      Share this code with users to join your organization
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Label>Join Code</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">
                            {organizations.find(org => org.id === profile.organization_id)?.join_token || 'Loading...'}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(organizations.find(org => org.id === profile.organization_id)?.join_token || '')}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Button variant="outline" size="sm">
                          <KeyRound className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
