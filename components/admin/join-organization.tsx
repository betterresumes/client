'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building, UserPlus, KeyRound, Mail, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { organizationsApi } from '@/lib/api/organizations'
import { useAuthStore } from '@/lib/stores/auth-store'

const joinOrganizationSchema = z.object({
  email: z.string().email('Valid email is required'),
  join_token: z.string().min(1, 'Join token is required'),
})

type JoinOrganizationFormData = z.infer<typeof joinOrganizationSchema>

interface JoinOrganizationProps {
  onJoinSuccess?: () => void
}

export function JoinOrganization({ onJoinSuccess }: JoinOrganizationProps) {
  const { user, refreshUserProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<JoinOrganizationFormData>({
    resolver: zodResolver(joinOrganizationSchema),
    defaultValues: {
      email: user?.email || '',
      join_token: '',
    }
  })

  const onSubmit = async (data: JoinOrganizationFormData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      console.log('Attempting to join organization with:', { email: data.email, join_token: data.join_token })

      // Call the join organization API
      const response = await organizationsApi.join({
        email: data.email,
        join_token: data.join_token
      })

      if (response.success) {
        const orgName = response.data?.organization_name || response.data?.name || 'organization'
        setSuccess(`Successfully joined ${orgName}!`)
        toast.success(`Welcome to ${orgName}! 🎉`, {
          description: 'You can now access organization resources.'
        })

        // Refresh user profile to update organization info
        await refreshUserProfile()

        // Reset form
        form.reset({
          email: user?.email || '',
          join_token: '',
        })

        if (onJoinSuccess) {
          onJoinSuccess()
        }
      } else {
        const errorMessage = response.error?.message || 'Failed to join organization'
        console.error('Join organization failed:', response.error)
        setError(errorMessage)
        toast.error('Failed to join organization', {
          description: errorMessage
        })
      }
    } catch (error: any) {
      console.error('Error joining organization:', error)

      let errorMessage = 'Failed to join organization'
      let errorDescription = 'Please try again later'

      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = 'Invalid join token or email'
            errorDescription = 'Please check your join token and email address'
            break
          case 404:
            errorMessage = 'Organization not found'
            errorDescription = 'The join token might be expired or invalid'
            break
          case 405:
            errorMessage = 'Join feature not available'
            errorDescription = 'This feature is currently unavailable. Please contact your organization admin.'
            break
          case 409:
            errorMessage = 'Already a member'
            errorDescription = 'You are already a member of this organization'
            break
          case 500:
            errorMessage = 'Server error'
            errorDescription = 'Please try again in a few moments'
            break
          default:
            errorMessage = error.response.data?.message || 'Unknown error occurred'
            errorDescription = 'Please contact support if the problem persists'
        }
      } else if (error.request) {
        errorMessage = 'Network error'
        errorDescription = 'Please check your internet connection'
      }

      setError(errorMessage)
      toast.error(errorMessage, {
        description: errorDescription
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="h-5 w-5" />
          <span>Join Organization</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your email and the organization's join token to become a member
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="email">Your Email Address</Label>
            <div className="flex items-center mt-1">
              <Mail className="h-4 w-4 text-gray-500 mr-2" />
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="your.email@company.com"
                className="flex-1"
                disabled={!!user?.email}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
            {user?.email && (
              <p className="text-xs text-muted-foreground mt-1">
                Using your account email address
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="join_token">Organization Join Token</Label>
            <div className="flex items-center mt-1">
              <KeyRound className="h-4 w-4 text-gray-500 mr-2" />
              <Input
                id="join_token"
                {...form.register('join_token')}
                placeholder="Enter the join token provided by the organization admin"
                className="flex-1 font-mono text-sm"
              />
            </div>
            {form.formState.errors.join_token && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.join_token.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              You can get this token from your organization administrator
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <UserPlus className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">How to join an organization:</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                  <li>Ask your organization admin for the join token</li>
                  <li>Make sure your email is on the organization's whitelist</li>
                  <li>Enter your email and the join token above</li>
                  <li>You'll become a member with default permissions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset({
                  email: user?.email || '',
                  join_token: '',
                })
                setError(null)
                setSuccess(null)
              }}
              disabled={loading}
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.formState.isValid}
            >
              {loading ? 'Joining...' : 'Join Organization'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
