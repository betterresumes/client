'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Lock,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Building,
  Building2,
  Users,
  UserPlus,
  Shield,
  Plus,
  Edit,
  Copy,
  KeyRound,
  Calendar,
  Mail,
  CheckCircle,
  Settings,
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

import { useAuthStore } from '@/lib/stores/auth-store'
import { OrgAdminManagement } from '@/components/admin/org-admin-management'
import { JoinOrganization } from '@/components/admin/join-organization'
import { TenantAdminManagement } from '@/components/admin/tenant-admin-management'
import { SuperAdminManagement } from '@/components/admin/super-admin-management'
import { authApi } from '@/lib/api/auth'
import { organizationsApi } from '@/lib/api/organizations'
import { tenantsApi } from '@/lib/api/tenants'
import { UserRole } from '@/lib/types/user'
import { UserCreate } from '@/lib/types/auth'
import { TenantResponse, ComprehensiveTenantResponse, TenantCreate, OrganizationCreate, EnhancedOrganizationResponse, WhitelistCreate } from '@/lib/types/tenant'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => {
  return data.new_password === data.confirm_password
}, {
  message: "Passwords don't match",
  path: ["confirm_password"],
}).refine((data) => {
  return data.current_password !== data.new_password
}, {
  message: "New password must be different from current password",
  path: ["new_password"],
})

const createTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  description: z.string().optional(),
  admin_email: z.string().email('Valid email is required'),
  admin_first_name: z.string().min(1, 'First name is required'),
  admin_last_name: z.string().min(1, 'Last name is required'),
  admin_password: z.string().min(8, 'Password must be at least 8 characters'),
})

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  description: z.string().optional(),
  domain: z.string().optional(),
  max_users: z.number().min(1).optional(),
  admin_email: z.string().email('Admin email is required'),
  admin_first_name: z.string().min(1, 'Admin first name is required'),
  admin_last_name: z.string().min(1, 'Admin last name is required'),
  admin_password: z.string().min(8, 'Password must be at least 8 characters'),
})

const inviteMemberSchema = z.object({
  emails: z.string().min(1, 'At least one email is required'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>
type CreateTenantFormData = z.infer<typeof createTenantSchema>
type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>
type InviteMemberFormData = z.infer<typeof inviteMemberSchema>
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

// Use the imported types from lib
type Tenant = ComprehensiveTenantResponse
type TenantDetail = ComprehensiveTenantResponse

export default function SettingsPage() {
  const router = useRouter()
  const { user, updateUser } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Tenant management states (for super admin)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<TenantDetail | null>(null)
  const [showTenantDetail, setShowTenantDetail] = useState(false)
  const [showCreateTenantDialog, setShowCreateTenantDialog] = useState(false)

  // Organization management states (for tenant admin)
  const [organizations, setOrganizations] = useState<EnhancedOrganizationResponse[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState<EnhancedOrganizationResponse | null>(null)
  const [showOrganizationDetail, setShowOrganizationDetail] = useState(false)
  const [showCreateOrganizationDialog, setShowCreateOrganizationDialog] = useState(false)
  const [showInviteMemberDialog, setShowInviteMemberDialog] = useState(false)
  const [organizationMembers, setOrganizationMembers] = useState<any[]>([])
  const [whitelistedEmails, setWhitelistedEmails] = useState<string[]>([])

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Dialog states
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false)

  // Forms
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  })

  const createTenantForm = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema)
  })

  const createOrganizationForm = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema)
  })

  const inviteMemberForm = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema)
  })

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  useEffect(() => {
    loadProfile()
    if (user?.role === UserRole.SUPER_ADMIN) {
      loadTenants()
    } else if (user?.role === 'tenant_admin') {
      loadOrganizations()
    }
  }, [user])

  const loadProfile = async () => {
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
        profileForm.reset({
          full_name: profile.full_name,
          email: profile.email,
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
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
      toast.error('Failed to load tenants')
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
      const response = await organizationsApi.list()
      if (response.success && response.data) {
        setOrganizations(response.data.organizations || [])
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
      toast.error('Failed to load organizations')
    }
  }

  const loadOrganizationDetails = async (orgId: string) => {
    try {
      const response = await organizationsApi.get(orgId)
      if (response.success && response.data) {
        setSelectedOrganization(response.data)
        setShowOrganizationDetail(true)

        // Load organization members
        const membersResponse = await organizationsApi.getUsers(orgId)
        if (membersResponse.success && membersResponse.data) {
          setOrganizationMembers(membersResponse.data.users || [])
        }

        // Load whitelist
        const whitelistResponse = await organizationsApi.whitelist.list(orgId)
        if (whitelistResponse.success && whitelistResponse.data) {
          setWhitelistedEmails(whitelistResponse.data.whitelist.map((item: any) => item.email))
        }
      }
    } catch (error) {
      console.error('Error loading organization details:', error)
      toast.error('Failed to load organization details')
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
          tenant_id: userData.tenant_id,
        }
        setProfile(profile)
        if (user) {
          updateUser({
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

  const onCreateTenantSubmit = async (data: CreateTenantFormData) => {
    try {
      setSaving(true)
      const response = await tenantsApi.create(data)

      if (response.success) {
        toast.success('Tenant created successfully')
        createTenantForm.reset()
        setShowCreateTenantDialog(false)
        loadTenants()
      } else {
        toast.error(typeof response.error === 'string' ? response.error : 'Failed to create tenant')
      }
    } catch (error) {
      console.error('Error creating tenant:', error)
      toast.error('Failed to create tenant')
    } finally {
      setSaving(false)
    }
  }

  const onCreateOrganizationSubmit = async (data: CreateOrganizationFormData) => {
    try {
      setSaving(true)

      // Create organization
      const orgResponse = await organizationsApi.create({
        name: data.name,
        description: data.description,
        domain: data.domain,
        max_users: data.max_users,
      })

      if (orgResponse.success) {
        // Create admin user for the organization
        const adminResponse = await authApi.admin.createUser({
          email: data.admin_email,
          password: data.admin_password,
          first_name: data.admin_first_name,
          last_name: data.admin_last_name,
          role: UserRole.ORG_ADMIN,
        })

        if (adminResponse.success) {
          toast.success('Organization and admin created successfully')
          createOrganizationForm.reset()
          setShowCreateOrganizationDialog(false)
          loadOrganizations()
        } else {
          toast.error('Organization created but failed to create admin user')
        }
      } else {
        toast.error(typeof orgResponse.error === 'string' ? orgResponse.error : 'Failed to create organization')
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Failed to create organization')
    } finally {
      setSaving(false)
    }
  }

  const onInviteMembersSubmit = async (data: InviteMemberFormData) => {
    try {
      setSaving(true)
      const emails = data.emails.split(',').map(email => email.trim()).filter(email => email)

      if (!selectedOrganization) return

      // Add emails to whitelist
      const promises = emails.map(email =>
        organizationsApi.whitelist.add(selectedOrganization.id, { email })
      )

      const results = await Promise.allSettled(promises)
      const successCount = results.filter(result => result.status === 'fulfilled').length
      const failureCount = results.length - successCount

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} email(s) to whitelist`)
        if (failureCount > 0) {
          toast.warning(`${failureCount} email(s) failed to be added`)
        }
      } else {
        toast.error('Failed to add emails to whitelist')
      }

      inviteMemberForm.reset()
      setShowInviteMemberDialog(false)

      // Refresh whitelist
      const whitelistResponse = await organizationsApi.whitelist.list(selectedOrganization.id)
      if (whitelistResponse.success && whitelistResponse.data) {
        setWhitelistedEmails(whitelistResponse.data.whitelist.map((item: any) => item.email))
      }
    } catch (error) {
      console.error('Error inviting members:', error)
      toast.error('Failed to invite members')
    } finally {
      setSaving(false)
    }
  }

  const removeWhitelistEmail = async (email: string) => {
    try {
      if (!selectedOrganization) return

      const response = await organizationsApi.whitelist.remove(selectedOrganization.id, email)
      if (response.success) {
        toast.success('Email removed from whitelist')
        setWhitelistedEmails(prev => prev.filter(e => e !== email))
      } else {
        toast.error('Failed to remove email from whitelist')
      }
    } catch (error) {
      console.error('Error removing email from whitelist:', error)
      toast.error('Failed to remove email from whitelist')
    }
  }

  const regenerateJoinToken = async (orgId: string) => {
    try {
      const response = await organizationsApi.regenerateJoinToken(orgId)
      if (response.success) {
        toast.success('Join token regenerated successfully')
        // Refresh organization details
        await loadOrganizationDetails(orgId)
      } else {
        toast.error('Failed to regenerate join token')
      }
    } catch (error) {
      console.error('Error regenerating join token:', error)
      toast.error('Failed to regenerate join token')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'border-red-500 text-red-700 bg-red-50'
      case UserRole.TENANT_ADMIN:
        return 'border-blue-500 text-blue-700 bg-blue-50'
      case UserRole.ORG_ADMIN:
        return 'border-purple-500 text-purple-700 bg-purple-50'
      case UserRole.ORG_MEMBER:
        return 'border-green-500 text-green-700 bg-green-50'
      case UserRole.USER:
        return 'border-gray-500 text-gray-700 bg-gray-50'
      default:
        return 'border-gray-500 text-gray-700 bg-gray-50'
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <Shield className="h-3 w-3" />
      case UserRole.TENANT_ADMIN:
        return <Building className="h-3 w-3" />
      case UserRole.ORG_ADMIN:
        return <Users className="h-3 w-3" />
      case UserRole.ORG_MEMBER:
        return <UserPlus className="h-3 w-3" />
      case UserRole.USER:
        return <User className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Administrator'
      case UserRole.TENANT_ADMIN:
        return 'Tenant Administrator'
      case UserRole.ORG_ADMIN:
        return 'Organization Administrator'
      case UserRole.ORG_MEMBER:
        return 'Organization Member'
      case UserRole.USER:
        return 'User'
      default:
        return 'User'
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <p>Unable to load profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
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
          <p className="text-gray-500">Manage your account and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="user-details" className="space-y-6">
        <TabsList className={`ml-[3em]  w-grid ${profile.role === UserRole.SUPER_ADMIN ? 'grid-cols-3' :
          profile.role === UserRole.TENANT_ADMIN ? 'grid-cols-3' :
            profile.role === 'org_admin' ? 'grid-cols-3' :
              'grid-cols-3'
          }`}>
          <TabsTrigger value="user-details">
            <User className="h-4 w-4 mr-2" />
            User Details
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>

          {/* Role-specific management tabs */}
          {profile.role === UserRole.SUPER_ADMIN && (
            <TabsTrigger value="tenant-management">
              <Building className="h-4 w-4 mr-2" />
              Tenant Management
            </TabsTrigger>
          )}

          {profile.role === UserRole.TENANT_ADMIN && (
            <TabsTrigger value="organization-management">
              <Building2 className="h-4 w-4 mr-2" />
              Organization Management
            </TabsTrigger>
          )}

          {profile.role === UserRole.ORG_ADMIN && profile.organization_id && (
            <TabsTrigger value="org-admin-management">
              <Settings className="h-4 w-4 mr-2" />
              My Organization
            </TabsTrigger>
          )}

          {/* Join Organization tab for regular users who are not already in an organization */}
          {![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORG_ADMIN].includes(profile.role as UserRole) &&
            !profile.organization_id && (
              <TabsTrigger value="join-organization">
                <Building className="h-4 w-4 mr-2" />
                Join Organization
              </TabsTrigger>
            )}
        </TabsList>

        {/* User Details Tab */}
        <TabsContent value="user-details">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Overview Card */}
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getInitials(profile.full_name, profile.email)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">{profile.full_name || 'No Name'}</CardTitle>
                <Badge variant="outline" className={`${getRoleColor(profile.role)} w-fit mx-auto`}>
                  {getRoleIcon(profile.role)}
                  <span className="ml-1">{getRoleDisplayName(profile.role)}</span>
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{profile.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {format(new Date(profile.created_at), 'MMM dd, yyyy')}</span>
                </div>
                {profile.last_login && (
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Last login {format(new Date(profile.last_login), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3 text-sm">
                  <div className={`h-3 w-3 rounded-full ${profile.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={profile.is_active ? 'text-green-700' : 'text-red-700'}>
                    {profile.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Edit Profile Form */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Edit Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
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
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
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
        </TabsContent>

        {/* Tenant Management Tab (Super Admin only) */}
        {profile.role === UserRole.SUPER_ADMIN && (
          <TabsContent value="tenant-management">
            <SuperAdminManagement />
          </TabsContent>
        )}

        {/* Organization Management Tab (Tenant Admin only) */}
        {profile.role === UserRole.TENANT_ADMIN && profile.tenant_id && (
          <TabsContent value="organization-management">
            <TenantAdminManagement tenantId={profile.tenant_id} />
          </TabsContent>
        )}

        {/* Organization Admin Management Tab */}
        {profile.role === UserRole.ORG_ADMIN && profile.organization_id && (
          <TabsContent value="org-admin-management">
            <OrgAdminManagement organizationId={profile.organization_id} />
          </TabsContent>
        )}
        {/* Join Organization Tab for Regular Users */}
        {![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORG_ADMIN].includes(profile.role as UserRole) &&
          !profile.organization_id && (
            <TabsContent value="join-organization">
              <JoinOrganization
                onJoinSuccess={() => {
                  // Refresh the profile to get updated organization info
                  loadProfile()
                  toast.success('Welcome to your new organization!')
                }}
              />
            </TabsContent>
          )}
      </Tabs>

      {/* Tenant Detail Dialog */}
      {profile.role === UserRole.SUPER_ADMIN && (
        <Dialog open={showTenantDetail} onOpenChange={setShowTenantDetail}>
          <DialogContent className="max-h-[95vh] overflow-hidden w-full max-w-screen">
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
                  <Card className="border-t-4 border-t-blue-500">
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
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building className="h-5 w-5 text-blue-600" />
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
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-green-600" />
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
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-purple-600" />
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
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Shield className="h-5 w-5 text-orange-600" />
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
                  <Card className="border-t-4 border-t-orange-500">
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
                                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-orange-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {admin.full_name || 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">{admin.email}</p>
                                      </div>
                                      <Badge variant={admin.is_active ? 'default' : 'secondary'} className="shrink-0 ml-2">
                                        {admin.is_active ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                      <div className="text-xs text-gray-400">
                                        Joined: {new Date(admin.created_at).toLocaleDateString()}
                                      </div>
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
                  <Card className="border-t-4 border-t-green-500">
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
                                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-green-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-semibold text-gray-900 truncate">{org.name}</h4>
                                        {org.description && (
                                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{org.description}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                      <Badge variant="outline" className={org.is_active ? 'border-green-500 text-green-700' : 'border-gray-500 text-gray-700'}>
                                        {org.is_active ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Users</div>
                                      <div className="text-lg font-bold text-gray-900 mt-1">{org.total_users}</div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Max Users</div>
                                      <div className="text-lg font-bold text-gray-900 mt-1">{org.max_users || 'Unlimited'}</div>
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
                                        <h5 className="font-medium text-blue-900 flex items-center gap-2">
                                          <KeyRound className="h-4 w-4" />
                                          Join Token
                                        </h5>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => copyToClipboard(org.join_token || '')}
                                          className="text-blue-700 border-blue-300 hover:bg-blue-100"
                                        >
                                          <Copy className="h-3 w-3 mr-1" />
                                          Copy
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
                                          <h5 className="font-medium text-green-900">Organization Admin</h5>
                                          <p className="text-sm text-green-700">{org.admin.full_name || org.admin.email}</p>
                                          <p className="text-xs text-green-600">{org.admin.email}</p>
                                        </div>
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
      )}

      {/* Organization Detail Dialog (Tenant Admin) */}
      {profile.role === UserRole.TENANT_ADMIN && (
        <Dialog open={showOrganizationDetail} onOpenChange={setShowOrganizationDetail}>
          <DialogContent className="max-h-[95vh] overflow-hidden w-full max-w-screen">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div>{selectedOrganization?.name}</div>
                  <div className="text-sm font-normal text-gray-500 mt-1">
                    Organization Management Dashboard
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedOrganization && (
              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6 p-1">
                  {/* Basic Info */}
                  <Card className="border-t-4 border-t-blue-500">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Organization Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Organization Name</Label>
                          <p className="text-lg font-medium">{selectedOrganization.name}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Status</Label>
                          <div>
                            <Badge
                              variant={selectedOrganization.is_active ? 'default' : 'secondary'}
                              className="text-sm px-3 py-1"
                            >
                              {selectedOrganization.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        {selectedOrganization.domain && (
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Domain</Label>
                            <p className="text-sm font-medium">{selectedOrganization.domain}</p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Max Users</Label>
                          <p className="text-sm">{selectedOrganization.max_users || 'Unlimited'}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Created Date</Label>
                          <p className="text-sm">{new Date(selectedOrganization.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</p>
                        </div>
                        {selectedOrganization.description && (
                          <div className="space-y-2 md:col-span-2 lg:col-span-3">
                            <Label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Description</Label>
                            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                              {selectedOrganization.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Join Token */}
                  {selectedOrganization.join_enabled && selectedOrganization.join_token && (
                    <Card className="border-t-4 border-t-green-500">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <KeyRound className="h-5 w-5" />
                          Join Token
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => regenerateJoinToken(selectedOrganization.id)}
                            className="ml-auto"
                          >
                            Regenerate
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-green-900">Organization Join Token</h5>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(selectedOrganization.join_token || '')}
                              className="text-green-700 border-green-300 hover:bg-green-100"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <div className="font-mono text-sm bg-white p-3 border border-green-200 rounded-md break-all">
                            {selectedOrganization.join_token}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Member Management */}
                  <Card className="border-t-4 border-t-purple-500">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Member Management
                          <Badge variant="outline" className="ml-2 text-xs">
                            {organizationMembers.length} members
                          </Badge>
                        </CardTitle>
                        <Button
                          onClick={() => setShowInviteMemberDialog(true)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Invite Members
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {organizationMembers.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {organizationMembers.map((member: any) => (
                            <Card key={member.id} className="border border-gray-200">
                              <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {member.full_name || member.first_name + ' ' + member.last_name || 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">{member.email}</p>
                                        <p className="text-xs text-gray-400 mt-1 capitalize">
                                          {member.role?.replace('_', ' ') || 'Member'}
                                        </p>
                                      </div>
                                      <Badge variant={member.is_active ? 'default' : 'secondary'} className="shrink-0 ml-2">
                                        {member.is_active ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No members found in this organization</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Email Whitelist */}
                  <Card className="border-t-4 border-t-orange-500">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Whitelist
                        <Badge variant="outline" className="ml-2 text-xs">
                          {whitelistedEmails.length} emails
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {whitelistedEmails.length > 0 ? (
                        <div className="space-y-2">
                          {whitelistedEmails.map((email) => (
                            <div key={email} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Mail className="h-4 w-4 text-orange-600" />
                                <span className="text-sm font-medium text-orange-900">{email}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeWhitelistEmail(email)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No emails in whitelist</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={showInviteMemberDialog} onOpenChange={setShowInviteMemberDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <p className="text-sm text-gray-600">
              Add email addresses to the organization whitelist. Users with these emails can join the organization.
            </p>
          </DialogHeader>

          <form onSubmit={inviteMemberForm.handleSubmit(onInviteMembersSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="emails">Email Addresses</Label>
              <textarea
                id="emails"
                {...inviteMemberForm.register('emails')}
                placeholder="Enter email addresses separated by commas&#10;example: john@company.com, jane@company.com"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 text-sm"
              />
              {inviteMemberForm.formState.errors.emails && (
                <p className="text-sm text-red-600 mt-1">
                  {inviteMemberForm.formState.errors.emails.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Separate multiple email addresses with commas
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteMemberDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add to Whitelist'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
