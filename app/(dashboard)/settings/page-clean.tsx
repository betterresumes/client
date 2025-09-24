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
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

import { useAuth } from '@/lib/stores/auth'
import { useAuthStore } from '@/lib/stores/auth'
import { authApi } from '@/lib/api/auth'
import { organizationsApi } from '@/lib/api/organizations'
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

const joinOrgSchema = z.object({
  join_token: z.string().min(1, 'Join token is required'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>
type JoinOrgFormData = z.infer<typeof joinOrgSchema>
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
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()
  const { shouldRefreshProfile, refreshUserProfile } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  const joinOrgForm = useForm<JoinOrgFormData>({
    resolver: zodResolver(joinOrgSchema)
  })

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (shouldRefreshProfile) {
      refreshUserProfile()
      loadProfile()
    }
  }, [shouldRefreshProfile, refreshUserProfile])

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

      const response = await organizationsApi.joinOrganization(data.join_token)

      if (response.success) {
        toast.success('Successfully joined organization!')
        joinOrgForm.reset()
        loadProfile() // Refresh profile to show new organization
      } else {
        toast.error(typeof response.error === 'string' ? response.error : 'Failed to join organization')
      }
    } catch (error) {
      console.error('Error joining organization:', error)
      toast.error('Failed to join organization')
    } finally {
      setSaving(false)
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'border-red-500 text-red-700 bg-red-50'
      case 'tenant_admin':
        return 'border-blue-500 text-blue-700 bg-blue-50'
      case 'org_admin':
        return 'border-green-500 text-green-700 bg-green-50'
      case 'org_member':
        return 'border-gray-500 text-gray-700 bg-gray-50'
      default:
        return 'border-gray-500 text-gray-700 bg-gray-50'
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="h-3 w-3" />
      case 'tenant_admin':
        return <Building className="h-3 w-3" />
      case 'org_admin':
        return <Users className="h-3 w-3" />
      case 'org_member':
        return <User className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <p>Unable to load profile</p>
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
        <TabsList className={`grid ${profile?.role !== 'super_admin' && profile?.role !== 'tenant_admin' && !profile?.organization_id ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
