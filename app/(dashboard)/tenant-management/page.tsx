'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building,
  Building2,
  Users,
  Shield,
  Plus,
  Edit,
  ArrowLeft,
  User,
  Copy,
  KeyRound
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { toast } from 'sonner'

import { useAuth } from '@/lib/stores/auth'
import { tenantsApi } from '@/lib/api/tenants'

const createTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  description: z.string().optional(),
  admin_email: z.string().email('Valid email is required'),
  admin_first_name: z.string().min(1, 'First name is required'),
  admin_last_name: z.string().min(1, 'Last name is required'),
  admin_password: z.string().min(8, 'Password must be at least 8 characters'),
})

type CreateTenantFormData = z.infer<typeof createTenantSchema>

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

export default function TenantManagementPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<TenantDetail | null>(null)
  const [showTenantDetail, setShowTenantDetail] = useState(false)
  const [showCreateTenantDialog, setShowCreateTenantDialog] = useState(false)

  const createTenantForm = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema)
  })

  // Redirect if not super admin
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.push('/dashboard')
      return
    }
    if (user?.role === 'super_admin') {
      loadTenants()
    }
  }, [user, router])

  const loadTenants = async () => {
    try {
      setLoading(true)
      const response = await tenantsApi.getAllTenants()
      if (response.success && response.data) {
        setTenants(response.data)
      }
    } catch (error) {
      console.error('Error loading tenants:', error)
      toast.error('Failed to load tenants')
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'super_admin') {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
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
            <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
            <p className="text-gray-500">Create and manage tenants</p>
          </div>
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

      {/* Tenant Detail Dialog */}
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
    </div>
  )
}
