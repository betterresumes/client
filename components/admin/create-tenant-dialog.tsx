'use client'

import { useState } from 'react'
import { Loader2, Building2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

import { tenantAdminApi } from '@/lib/api/tenant-admin'

interface CreateTenantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateTenantDialog({ open, onOpenChange, onSuccess }: CreateTenantDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tenant_name: '',
    tenant_description: '',
    tenant_domain: '',
    admin_email: '',
    admin_password: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_username: '',
    create_default_org: true,
    default_org_name: '',
    default_org_description: '',
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      tenant_name: '',
      tenant_description: '',
      tenant_domain: '',
      admin_email: '',
      admin_password: '',
      admin_first_name: '',
      admin_last_name: '',
      admin_username: '',
      create_default_org: true,
      default_org_name: '',
      default_org_description: '',
    })
  }

  const validateForm = () => {
    if (!formData.tenant_name.trim()) {
      toast.error('Tenant name is required')
      return false
    }
    if (!formData.admin_email.trim()) {
      toast.error('Admin email is required')
      return false
    }
    if (!formData.admin_password || formData.admin_password.length < 8) {
      toast.error('Admin password must be at least 8 characters')
      return false
    }
    if (!formData.admin_first_name.trim()) {
      toast.error('Admin first name is required')
      return false
    }
    if (!formData.admin_last_name.trim()) {
      toast.error('Admin last name is required')
      return false
    }
    return true
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)

      const submitData = { ...formData }

      // If creating default org and no name provided, use tenant name
      if (submitData.create_default_org && !submitData.default_org_name) {
        submitData.default_org_name = `${submitData.tenant_name} Organization`
      }

      const response = await tenantAdminApi.createTenantWithAdmin(submitData)

      if (response.success) {
        toast.success(`Tenant "${response.data?.tenant_name}" created successfully`)
        resetForm()
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(response.error?.message || 'Failed to create tenant')
      }
    } catch (error: any) {
      console.error('Error creating tenant:', error)
      toast.error(error.message || 'Failed to create tenant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Tenant
          </DialogTitle>
          <DialogDescription>
            Create a new tenant with an admin user. This will create the tenant, admin user, and optionally a default organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Tenant Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tenant Information</h3>

            <div className="space-y-2">
              <Label htmlFor="tenant_name">Tenant Name *</Label>
              <Input
                id="tenant_name"
                placeholder="Acme Corporation"
                value={formData.tenant_name}
                onChange={(e) => handleInputChange('tenant_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant_description">Description</Label>
              <Textarea
                id="tenant_description"
                placeholder="Brief description of the tenant organization..."
                value={formData.tenant_description}
                onChange={(e) => handleInputChange('tenant_description', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant_domain">Domain</Label>
              <Input
                id="tenant_domain"
                placeholder="acme.com"
                value={formData.tenant_domain}
                onChange={(e) => handleInputChange('tenant_domain', e.target.value)}
              />
            </div>
          </div>

          {/* Admin User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Admin User Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin_first_name">First Name *</Label>
                <Input
                  id="admin_first_name"
                  placeholder="John"
                  value={formData.admin_first_name}
                  onChange={(e) => handleInputChange('admin_first_name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_last_name">Last Name *</Label>
                <Input
                  id="admin_last_name"
                  placeholder="Doe"
                  value={formData.admin_last_name}
                  onChange={(e) => handleInputChange('admin_last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_email">Admin Email *</Label>
              <Input
                id="admin_email"
                type="email"
                placeholder="admin@acme.com"
                value={formData.admin_email}
                onChange={(e) => handleInputChange('admin_email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_username">Username</Label>
              <Input
                id="admin_username"
                placeholder="admin"
                value={formData.admin_username}
                onChange={(e) => handleInputChange('admin_username', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_password">Admin Password *</Label>
              <Input
                id="admin_password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.admin_password}
                onChange={(e) => handleInputChange('admin_password', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Default Organization */}
          <div className="space-y-4">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Create Default Organization</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically create a default organization for this tenant
                </div>
              </div>
              <Switch
                checked={formData.create_default_org}
                onCheckedChange={(checked) => handleInputChange('create_default_org', checked)}
              />
            </div>

            {formData.create_default_org && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="default_org_name">Default Organization Name</Label>
                  <Input
                    id="default_org_name"
                    placeholder="Leave empty to use: {Tenant Name} Organization"
                    value={formData.default_org_name}
                    onChange={(e) => handleInputChange('default_org_name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_org_description">Default Organization Description</Label>
                  <Textarea
                    id="default_org_description"
                    placeholder="Default organization for the tenant..."
                    value={formData.default_org_description}
                    onChange={(e) => handleInputChange('default_org_description', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Tenant
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
