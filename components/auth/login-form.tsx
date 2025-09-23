'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { useAuthStore } from '@/lib/stores/auth-store'
import { authApi } from '@/lib/api'
import { apiClient } from '@/lib/api/client'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      })

      if (response.success && response.data) {
        // Set the token in API client immediately after successful login
        apiClient.setAuthToken(
          response.data.access_token,
          response.data.refresh_token || ''
        )

        // Now get user profile with the token set
        const userResponse = await authApi.getMe()

        if (userResponse.success && userResponse.data) {
          setAuth(
            response.data.access_token,
            response.data.refresh_token || '',
            userResponse.data,
            response.data.expires_in || 3600 // Default to 1 hour if not provided
          )

          toast.success('Login successful!', {
            description: 'Welcome back! Loading your dashboard...',
          })

          // Small delay to ensure auth state is propagated
          await new Promise(resolve => setTimeout(resolve, 200))

          // Check if there's a redirect URL stored in sessionStorage
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
          if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin')
            router.push(redirectUrl)
          } else {
            router.push('/dashboard')
          }
        } else {
          const errorMessage = typeof userResponse.error === 'string'
            ? userResponse.error
            : userResponse.error?.message || 'Failed to get user profile'

          toast.error('Login failed', {
            description: errorMessage,
          })

          // Clear the token since profile fetch failed
          apiClient.clearAuth()
        }
      } else {
        const errorMessage = typeof response.error === 'string'
          ? response.error
          : response.error?.message || 'Invalid email or password'

        toast.error('Login failed', {
          description: errorMessage,
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed', {
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bricolage font-bold text-gray-900 dark:text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Sign in to your AccuNode AI account
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 dark:text-gray-300">
                  Email address
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="name@company.com"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 dark:text-gray-300">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm text-gray-600 dark:text-gray-400">
                      Remember me
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
