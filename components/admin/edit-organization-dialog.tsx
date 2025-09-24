'use client'

import { useState } from 'react'
import { Loader2, Building, Edit } from 'lucide-react'
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

import { organizationsApi } from '@/lib/api/organizations'

interface EditOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: any
  onSuccess: () => void
}

export function EditOrganizationDialog({
  open,
  onOpenChange,
  organization,
  onSuccess
}: EditOrganizationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    domain: organization?.domain || '',
    is_active: organization?.is_active || true,
    max_users: organization?.max_users || 500,
    join_enabled: organization?.join_enabled || true,
    default_role: organization?.default_role || 'org_member',
    allow_global_data_access: organization?.allow_global_data_access || false,
  })

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: organization?.name || '',
      description: organization?.description || '',
      domain: organization?.domain || '',
      is_active: organization?.is_active || true,
      max_users: organization?.max_users || 500,
      join_enabled: organization?.join_enabled || true,
      default_role: organization?.default_role || 'org_member',
      allow_global_data_access: organization?.allow_global_data_access || false,
    })
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Organization name is required')
      return false
    }
    if (formData.max_users < 1 || formData.max_users > 10000) {
      toast.error('Max users must be between 1 and 10,000')
      return false
    }
    return true
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)

      const updateData = {
        name: formData.name,
        description: formData.description || undefined,
        domain: formData.domain || undefined,
        is_active: formData.is_active,
        max_users: formData.max_users,
        join_enabled: formData.join_enabled,
        default_role: formData.default_role,
        allow_global_data_access: formData.allow_global_data_access,
      }

      const response = await organizationsApi.update(organization.id, updateData)

      if (response.success) {
        toast.success(`Organization "${formData.name}" updated successfully`)
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(response.error?.message || 'Failed to update organization')
      }
    } catch (error: any) {
      console.error('Error updating organization:', error)
      toast.error(error.message || 'Failed to update organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Organization
          </DialogTitle>
          <DialogDescription>
            Update organization settings and configuration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                placeholder="Acme Inc."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the organization..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="acme.com"
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
              />
            </div>
          </div>

          {/* Organization Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Organization Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_users">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.max_users}
                  onChange={(e) => handleInputChange('max_users', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_role">Default Role</Label>
                <select
                  id="default_role"
                  value={formData.default_role}
                  onChange={(e) => handleInputChange('default_role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="org_member">Member</option>
                  <option value="org_admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Active Status</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow users to access this organization
                  </div>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
              </div>

              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Join Token</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow users to join using the organization's join token
                  </div>
                </div>
                <Switch
                  checked={formData.join_enabled}
                  onCheckedChange={(checked) => handleInputChange('join_enabled', checked)}
                />
              </div>

              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Global Data Access</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow organization to access platform-wide data
                  </div>
                </div>
                <Switch
                  checked={formData.allow_global_data_access}
                  onCheckedChange={(checked) => handleInputChange('allow_global_data_access', checked)}
                />
              </div>
            </div>
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
              Update Organization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
