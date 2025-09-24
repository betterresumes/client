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
import { ComprehensiveTenantResponse } from '@/lib/types/tenant'

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
  message: "New password and confirm password don't match",
  path: ["confirm_password"],
}).refine((data) => data.current_password !== data.new_password, {
  message: "New password must be different from current password",
  path: ["new_password"],
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email address is required'),
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>
type JoinOrgFormData = z.infer<typeof joinOrgSchema>
type CreateTenantFormData = z.infer<typeof createTenantSchema>
type CreateOrgFormData = z.infer<typeof createOrgSchema>
type InviteUserFormData = z.infer<typeof inviteUserSchema>
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

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

interface TenantDetail extends ComprehensiveTenantResponse {
  // This will use the full comprehensive tenant response
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
  const { shouldRefreshProfile, refreshUserProfile } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Role-based management state
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<TenantDetail | null>(null)
  const [showTenantDetail, setShowTenantDetail] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)

  // Dialog state
  const [showCreateTenantDialog, setShowCreateTenantDialog] = useState(false)
  const [showCreateOrgDialog, setShowCreateOrgDialog] = useState(false)
  const [showInviteUserDialog, setShowInviteUserDialog] = useState(false)
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false)

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

  // Forgot password form
  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    }
  })

  useEffect(() => {
    loadProfileData()
  }, [shouldRefreshProfile, refreshUserProfile])

  const loadProfileData = async () => {
    try {
      setLoading(true)

      // Use auth store caching
      let userData = user

      // Check if we should refresh profile cache
      if (shouldRefreshProfile() || !userData) {
        userData = await refreshUserProfile()
      }

      if (userData) {
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

  const loadTenantDetails = async (tenantId: string) => {
    try {
      const response = await tenantsApi.get(tenantId)
      if (response.success && response.data) {
        setSelectedTenant(response.data)
        setShowTenantDetail(true)
      }
    } catch (error) {
      console.error('Error loading tenant details:', error)
      toast.error('Failed to load tenant details')
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
            ...userData,
            full_name: userData.full_name || '',
          })
        }
        toast.success('Profile updated successfully')
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setSaving(true)

      const response = await authApi.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      })

      if (response.success) {
        toast.success('Password changed successfully')
        passwordForm.reset()
        setShowCurrentPassword(false)
        setShowNewPassword(false)
        setShowConfirmPassword(false)
      } else {
        toast.error(typeof response.error === 'string' ? response.error : 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setSaving(true)

      const response = await authApi.forgotPassword(data.email)

      if (response.success) {
        toast.success('Password reset email sent! Please check your inbox.')
        forgotPasswordForm.reset()
        setShowForgotPasswordDialog(false)
      } else {
        toast.error(typeof response.error === 'string' ? response.error : 'Failed to send password reset email')
      }
    } catch (error) {
      console.error('Error sending forgot password email:', error)
      toast.error('Failed to send password reset email')
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
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center space-x-4">
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-100 rounded w-48"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="h-px bg-gray-200"></div>
                <div className="flex justify-end">
                  <div className="h-10 bg-gray-200 rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
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



      {/* Management Links */}
      {profile && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {profile.role === 'super_admin' && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/tenant-management')}>
              <CardContent className="p-6 text-center">
                <Building className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Tenant Management</h3>
                <p className="text-sm text-gray-600 mt-1">Create and manage tenants</p>
              </CardContent>
            </Card>
          )}

          {profile.role === 'tenant_admin' && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/organization-management')}>
              <CardContent className="p-6 text-center">
                <Building2 className="h-8 w-8 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold text-gray-900">Organization Management</h3>
                <p className="text-sm text-gray-600 mt-1">Manage your organizations</p>
              </CardContent>
            </Card>
          )}

          {profile.role === 'org_admin' && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/member-management')}>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Member Management</h3>
                <p className="text-sm text-gray-600 mt-1">Manage organization members</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
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
                      disabled
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Change Password</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowForgotPasswordDialog(true)}
                  >
                    Forgot Password?
                  </Button>
                </div>
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
          </div>
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
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Building className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tenants Found</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                          Get started by creating your first tenant. Tenants help organize your organizations and users.
                        </p>
                        <Button
                          onClick={() => setShowCreateTenantDialog(true)}
                          className="inline-flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create Your First Tenant
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {tenants.map((tenant) => (
                          <Card
                            key={tenant.id}
                            className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-gray-300"
                            onClick={() => loadTenantDetails(tenant.id)}
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                    <Building className="h-5 w-5 text-gray-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg font-semibold truncate">{tenant.name}</CardTitle>
                                    {tenant.description ? (
                                      <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                        {tenant.description}
                                      </p>
                                    ) : (
                                      <p className="text-sm text-gray-400 mt-1 italic">No description</p>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant={tenant.is_active ? 'default' : 'secondary'}
                                  className="shrink-0 ml-2"
                                >
                                  {tenant.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Building2 className="h-4 w-4" />
                                    <span className="text-sm font-medium">{tenant.organization_count || 0}</span>
                                    <span className="text-sm text-gray-500">
                                      {(tenant.organization_count || 0) === 1 ? 'Organization' : 'Organizations'}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Add edit functionality here
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
                                  <span>Click to view details</span>
                                  <span>•••</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tenant Detail Dialog */}
              <div className="w-full">
                <Dialog open={showTenantDetail} onOpenChange={setShowTenantDetail}>
                  <DialogContent className="max-w-none w-[98vw] max-h-[95vh] overflow-hidden">
                    <DialogHeader className="pb-4 border-b">
                      <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <div>{selectedTenant?.name}</div>
                          <div className="text-sm font-normal text-gray-500 mt-1">
                            Tenant Management Dashboard
                          </div>
                        </div>
                      </DialogTitle>
                    </DialogHeader>

                    {selectedTenant && (
                      <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                        <div className="space-y-6 p-1">
                          {/* Basic Info */}
                          <Card className="border-t-4 border-t-gray-200">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-xl flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Tenant Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                  <Label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Tenant Name</Label>
                                  <p className="text-lg font-medium">{selectedTenant.name}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Status</Label>
                                  <div>
                                    <Badge
                                      variant={selectedTenant.is_active ? 'default' : 'secondary'}
                                      className="text-sm px-3 py-1"
                                    >
                                      {selectedTenant.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Slug</Label>
                                  <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg border">
                                    {selectedTenant.slug}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Created Date</Label>
                                  <p className="text-sm">{new Date(selectedTenant.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}</p>
                                </div>
                                {selectedTenant.domain && (
                                  <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Domain</Label>
                                    <p className="text-sm font-medium">{selectedTenant.domain}</p>
                                  </div>
                                )}
                                {selectedTenant.description && (
                                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                    <Label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Description</Label>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                                      {selectedTenant.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Statistics */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Building className="h-5 w-5 text-gray-600" />
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold text-gray-900">{selectedTenant.total_organizations}</div>
                                    <div className="text-sm text-gray-500 font-medium">Total Organizations</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-gray-600" />
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold text-gray-900">{selectedTenant.active_organizations}</div>
                                    <div className="text-sm text-gray-500 font-medium">Active Organizations</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Users className="h-5 w-5 text-gray-600" />
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold text-gray-900">{selectedTenant.total_users_in_tenant}</div>
                                    <div className="text-sm text-gray-500 font-medium">Total Users</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-gray-600" />
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold text-gray-900">{selectedTenant.total_tenant_admins}</div>
                                    <div className="text-sm text-gray-500 font-medium">Tenant Admins</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Tenant Admins */}
                          <Card className="border-t-4 border-t-gray-200">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-xl flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Tenant Administrators
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {selectedTenant.tenant_admins.length}
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {selectedTenant.tenant_admins.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                  {selectedTenant.tenant_admins.map((admin) => (
                                    <Card key={admin.id} className="border border-gray-200 hover:shadow-sm transition-shadow">
                                      <CardContent className="p-4">
                                        <div className="flex items-start space-x-3">
                                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <User className="h-5 w-5 text-gray-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 truncate">{admin.full_name}</h4>
                                                <p className="text-sm text-gray-500 truncate">{admin.email}</p>
                                              </div>
                                              <Badge variant={admin.is_active ? 'default' : 'secondary'} className="ml-2">
                                                {admin.is_active ? 'Active' : 'Inactive'}
                                              </Badge>
                                            </div>
                                            <div className="mt-3 space-y-2">
                                              <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>Role: <span className="font-medium text-gray-700">{admin.role}</span></span>
                                              </div>
                                              <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>Joined: {new Date(admin.created_at).toLocaleDateString()}</span>
                                              </div>
                                              {admin.last_login && (
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                  <span>Last login: {new Date(admin.last_login).toLocaleDateString()}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-500">No tenant administrators found</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Organizations */}
                          <Card className="border-t-4 border-t-gray-200">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-xl flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Organizations
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {selectedTenant.organizations.length}
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {selectedTenant.organizations.length > 0 ? (
                                <div className="space-y-6">
                                  {selectedTenant.organizations.map((org) => (
                                    <Card key={org.id} className="border border-gray-200 hover:shadow-sm transition-shadow">
                                      <CardContent className="p-6">
                                        <div className="space-y-4">
                                          <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3 flex-1">
                                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Building2 className="h-5 w-5 text-gray-600" />
                                              </div>
                                              <div className="flex-1">
                                                <h4 className="font-semibold text-lg text-gray-900">{org.name}</h4>
                                                {org.description ? (
                                                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{org.description}</p>
                                                ) : (
                                                  <p className="text-sm text-gray-400 mt-1 italic">No description</p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex flex-col gap-2 items-end">
                                              <Badge variant={org.is_active ? 'default' : 'secondary'}>
                                                {org.is_active ? 'Active' : 'Inactive'}
                                              </Badge>
                                              <Badge variant="outline">{org.default_role}</Badge>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Users</div>
                                              <div className="text-lg font-bold text-gray-900 mt-1">{org.total_users}</div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Max Users</div>
                                              <div className="text-lg font-bold text-gray-900 mt-1">{org.max_users}</div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Join Enabled</div>
                                              <div className="mt-2">
                                                <Badge variant={org.join_enabled ? 'default' : 'secondary'} className="text-xs">
                                                  {org.join_enabled ? 'Yes' : 'No'}
                                                </Badge>
                                              </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Created</div>
                                              <div className="text-sm font-medium text-gray-900 mt-1">
                                                {new Date(org.created_at).toLocaleDateString()}
                                              </div>
                                            </div>
                                          </div>

                                          {org.join_enabled && org.join_token && (
                                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                              <div className="flex items-center justify-between mb-2">
                                                <Label className="text-sm font-semibold text-blue-800">Join Token</Label>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => navigator.clipboard.writeText(org.join_token)}
                                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                                >
                                                  <Copy className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              <div className="font-mono text-sm bg-white p-3 border border-blue-200 rounded-md break-all">
                                                {org.join_token}
                                              </div>
                                            </div>
                                          )}

                                          {org.admin && (
                                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                              <div className="flex items-start space-x-3">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                  <Shield className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                  <h5 className="font-semibold text-green-900">Organization Admin</h5>
                                                  <p className="text-sm text-green-700 mt-1">
                                                    {org.admin.full_name} ({org.admin.email})
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {org.members.length > 0 && (
                                            <div>
                                              <h5 className="font-medium mb-2">Members ({org.members.length})</h5>
                                              <div className="max-h-40 overflow-y-auto">
                                                {org.members.map((member) => (
                                                  <div key={member.id} className="flex items-center justify-between py-2 border-t first:border-t-0">
                                                    <div>
                                                      <p className="text-sm font-medium">{member.full_name}</p>
                                                      <p className="text-xs text-gray-500">{member.email}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                      <Badge variant="outline" className="text-xs">{member.role}</Badge>
                                                      <Badge variant={member.is_active ? 'default' : 'secondary'} className="text-xs">
                                                        {member.is_active ? 'Active' : 'Inactive'}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-500">No organizations found</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Super Admin: Tenant Management - End */}

        {/* Tenant Detail Dialog */}


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

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </DialogHeader>

          <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...forgotPasswordForm.register('email')}
                placeholder="Enter your email address"
              />
              {forgotPasswordForm.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {forgotPasswordForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPasswordDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
