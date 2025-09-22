'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building, Plus } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { organizationsApi } from '@/lib/api/organizations'
import { OrganizationCreate } from '@/lib/types/tenant'

const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  description: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  is_active: z.boolean(),
})

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>

interface CreateOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrganizationCreated?: () => void
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onOrganizationCreated
}: CreateOrganizationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      description: '',
      website: '',
      is_active: true,
    }
  })

  const onSubmit = async (data: CreateOrganizationFormData) => {
    try {
      setLoading(true)
      setError(null)

      const orgData: OrganizationCreate = {
        name: data.name,
        description: data.description || undefined,
      }

      const response = await organizationsApi.create(orgData)

      if (response.success) {
        form.reset()
        onOpenChange(false)
        if (onOrganizationCreated) {
          onOrganizationCreated()
        }
      } else {
        setError(response.error?.message || 'Failed to create organization')
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      setError('Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Create New Organization
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Acme Corporation"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Brief description of the organization..."
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              {...form.register('website')}
              placeholder="https://example.com"
            />
            {form.formState.errors.website && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.website.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_active" className="text-sm font-medium">
                Active Organization
              </Label>
              <p className="text-xs text-gray-500">
                Users can join and use this organization
              </p>
            </div>
            <Switch
              id="is_active"
              checked={form.watch('is_active')}
              onCheckedChange={(checked: boolean) => form.setValue('is_active', checked)}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
