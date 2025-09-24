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

import { useAuth } from '@/lib/stores/auth'
import { authApi } from '@/lib/api/auth'
import { organizationsApi } from '@/lib/api/organizations'
import { tenantsApi } from '@/lib/api/tenants'
import { UserRole } from '@/lib/types/user'

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

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>
type CreateTenantFormData = z.infer<typeof createTenantSchema>
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

interface Tenant {
  id: string
  name: string
  slug: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  domain?: string
  organization_count?: number
}

interface TenantDetail extends Tenant {
  total_organizations: number
  active_organizations: number
  total_users_in_tenant: number
  total_tenant_admins: number
  tenant_admins: Array<{
    id: string
    email: string
    full_name?: string
    is_active: boolean
    created_at: string
  }>
  organizations: Array<{
    id: string
    name: string
    description?: string
    is_active: boolean
    created_at: string
    member_count: number
    max_users?: number
    join_enabled: boolean
    join_token?: string
    admin?: {
      id: string
      email: string
      full_name?: string
    }
    members: Array<{
      id: string
      email: string
      full_name?: string
      role: string
      is_active: boolean
    }>
  }>
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Tenant management states (for super admin)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<TenantDetail | null>(null)
  const [showTenantDetail, setShowTenantDetail] = useState(false)
  const [showCreateTenantDialog, setShowCreateTenantDialog] = useState(false)

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

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  useEffect(() => {
    loadProfile()
    if (user?.role === UserRole.SUPER_ADMIN) {
      loadTenants()
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
      const response = await tenantsApi.getAllTenants()
      if (response.success && response.data) {
        setTenants(response.data)
      }
    } catch (error) {
      console.error('Error loading tenants:', error)
      toast.error('Failed to load tenants')
    }
  }

  const loadTenantDetails = async (tenantId: string) => {
    try {
      const response = await tenantsApi.getTenantDetails(tenantId)
      if (response.success && response.data) {
        setSelectedTenant(response.data)
        setShowTenantDetail(true)
      }
    } catch (error) {
      console.error('Error loading tenant details:', error)
      toast.error('Failed to load tenant details')
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

  const onCreateTenantSubmit = async (data: CreateTenantFormData) => {
    try {
      setSaving(true)
      const response = await tenantsApi.createTenant(data)
      
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'border-red-500 text-red-700 bg-red-50'
      case UserRole.ADMIN:
        return 'border-blue-500 text-blue-700 bg-blue-50'
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
      case UserRole.ADMIN:
        return <Building className="h-3 w-3" />
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
      case UserRole.ADMIN:
        return 'Administrator'
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
        <TabsList className={`grid ${
          profile.role === UserRole.SUPER_ADMIN ? 'grid-cols-3' : 
          profile.role === UserRole.ADMIN ? 'grid-cols-3' : 
          'grid-cols-2'
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
          
          {profile.role === UserRole.ADMIN && (
            <TabsTrigger value="organization-management">
              <Building2 className="h-4 w-4 mr-2" />
              Organization Management
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
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
                  <p className="text-gray-500">Create and manage tenants</p>
                </div>
                
                <Dialog open={showCreateTenantDialog} onOpenChange={setShowCreateTenantDialog}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-black hover:bg-gray-800">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Tenant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
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

              {/* Tenants Grid */}
              {tenants.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No Tenants Found</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Get started by creating your first tenant. Tenants help organize your organizations and users.
                  </p>
                  <Button
                    onClick={() => setShowCreateTenantDialog(true)}
                    size="lg"
                    className="inline-flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Create Your First Tenant
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {tenants.map((tenant) => (
                    <Card
                      key={tenant.id}
                      className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-gray-300 bg-gradient-to-br from-white to-gray-50"
                      onClick={() => loadTenantDetails(tenant.id)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-colors">
                              <Building className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-xl font-bold truncate text-gray-900 group-hover:text-gray-700 transition-colors">
                                {tenant.name}
                              </CardTitle>
                              {tenant.description ? (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                                  {tenant.description}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-400 mt-2 italic">No description</p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={tenant.is_active ? 'default' : 'secondary'}
                            className="shrink-0 ml-3"
                          >
                            {tenant.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3 text-gray-700">
                              <Building2 className="h-5 w-5" />
                              <div>
                                <span className="text-lg font-bold">{tenant.organization_count || 0}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {(tenant.organization_count || 0) === 1 ? 'Organization' : 'Organizations'}
                                </span>
                              </div>
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
                            <span className="font-medium">Click to view details</span>
                            <span className="text-gray-300">•••</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Organization Management Tab (Admin only) */}
        {profile.role === UserRole.ADMIN && (
          <TabsContent value="organization-management">
            <div className="space-y-6">
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building2 className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Organization Management</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Organization management features will be available here for administrators.
                </p>
                <Button disabled size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Tenant Detail Dialog */}
      {profile.role === UserRole.SUPER_ADMIN && (
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
                                      <div className="text-lg font-bold text-gray-900 mt-1">{org.member_count}</div>
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
