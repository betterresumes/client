'use client'

import { useState } from 'react'
import { Building, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

import { organizationsApi } from '@/lib/api/organizations'

interface CreateOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrganizationCreated?: () => void
  tenantId?: string
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onOrganizationCreated,
  tenantId
}: CreateOrganizationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '',
    max_users: 500,
    default_role: 'org_member',
  })

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      domain: '',
      max_users: 500,
      default_role: 'org_member',
    })
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Organization name is required')
      return false
    }
    if (formData.name.length < 2) {
      toast.error('Organization name must be at least 2 characters')
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

      const orgData = {
        name: formData.name,
        description: formData.description || undefined,
        domain: formData.domain || undefined,
        max_users: formData.max_users,
        default_role: formData.default_role,
        tenant_id: tenantId,
      }

      console.log('Creating organization with data:', orgData)
      const response = await organizationsApi.create(orgData)

      if (response.success) {
        toast.success(`Organization "${formData.name}" created successfully! 🏢`)
        resetForm()
        onOpenChange(false)
        if (onOrganizationCreated) {
          onOrganizationCreated()
        }
      } else {
        console.error('Organization creation failed:', response.error)
        const errorMessage = response.error?.message || 'Failed to create organization'
        toast.error(`Failed to create organization: ${errorMessage}`)
      }
    } catch (error: any) {
      console.error('Error creating organization:', error)
      toast.error(error.message || 'Failed to create organization. Please check your inputs and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Create New Organization
          </DialogTitle>
          <DialogDescription>
            Create a new organization within your tenant. This will allow you to manage users and access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-4">
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
              <Label htmlFor="domain">Domain (optional)</Label>
              <Input
                id="domain"
                placeholder="acme.com"
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max_users">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.max_users}
                  onChange={(e) => handleInputChange('max_users', parseInt(e.target.value) || 500)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_role" className="flex items-center gap-2">
                  Default User Role
                  <Badge variant="secondary" className="text-xs">
                    For new members
                  </Badge>
                </Label>
                <select
                  id="default_role"
                  value={formData.default_role}
                  onChange={(e) => handleInputChange('default_role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="org_member">Member (Regular User)</option>
                  <option value="org_admin">Admin (Can Manage Organization)</option>
                </select>
                <p className="text-xs text-gray-500">
                  You can assign specific org admins after creating the organization
                </p>
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
              Create Organization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
