'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Calendar, Building, Shield, CheckCircle, Clock, ArrowLeft, Edit } from 'lucide-react'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

import { useAuth } from '@/lib/stores/auth'
import { authApi } from '@/lib/api/auth'
import { UserRole, UserStatus } from '@/lib/types/user'
import { UserResponse } from '@/lib/types/auth'

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

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [organizationName, setOrganizationName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load user profile
      const profileResponse = await authApi.getProfile()
      if (profileResponse.success && profileResponse.data) {
        const userData = profileResponse.data
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

        // Use organization details from user data
        if (userData.organization) {
          setOrganizationName(userData.organization.name)
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-red-100 text-red-800 border-red-200'
      case UserRole.ADMIN:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        return <Shield className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4 mb-8">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <User className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load profile
          </h3>
          <p className="text-gray-500 mb-4">
            {error || 'Unable to load your profile information'}
          </p>
          <Button onClick={loadProfileData}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
            <p className="text-gray-500">View and manage your profile information</p>
          </div>
        </div>
        <Button onClick={() => router.push('/settings')}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`} />
              <AvatarFallback className="bg-blue-600 text-white text-lg">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile.full_name}
                </h2>
                <Badge variant="outline" className={getRoleColor(profile.role)}>
                  {getRoleIcon(profile.role)}
                  <span className="ml-1 capitalize">
                    {profile.role.replace('_', ' ')}
                  </span>
                </Badge>
                {profile.is_active ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Email</span>
              <div className="flex items-center text-sm text-gray-900">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                {profile.email}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Role</span>
              <Badge variant="outline" className={getRoleColor(profile.role)}>
                {getRoleIcon(profile.role)}
                <span className="ml-1 capitalize">
                  {profile.role.replace('_', ' ')}
                </span>
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Status</span>
              {profile.is_active ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Member Since</span>
              <div className="flex items-center text-sm text-gray-900">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {format(new Date(profile.created_at), 'MMM dd, yyyy')}
              </div>
            </div>

            {profile.last_login && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Last Login</span>
                <div className="flex items-center text-sm text-gray-900">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  {format(new Date(profile.last_login), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {organizationName ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {organizationName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Organization member
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  No Organization
                </h3>
                <p className="text-xs text-gray-500">
                  You are not currently part of any organization
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
