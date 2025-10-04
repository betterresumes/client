'use client'

import { useState } from 'react'
import { Shield, Loader2, Mail } from 'lucide-react'
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

import { tenantAdminApi } from '@/lib/api/tenant-admin'

interface AssignOrgAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: any
  onSuccess?: () => void
}

export function AssignOrgAdminDialog({
  open,
  onOpenChange,
  organization,
  onSuccess
}: AssignOrgAdminDialogProps) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleAssignAdmin = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (!organization?.id) {
      toast.error('Organization not found')
      return
    }

    try {
      setLoading(true)

      const response = await tenantAdminApi.assignUserToOrganization({
        user_email: email.trim(),
        organization_id: organization.id,
        role: 'org_admin'
      })

      if (response.success) {
        toast.success(`Successfully assigned ${email} as org admin to ${organization.name}! 👑`)
        setEmail('')
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast.error(response.error?.message || 'Failed to assign org admin')
      }
    } catch (error: any) {
      console.error('Error assigning org admin:', error)
      toast.error(error.message || 'Failed to assign org admin')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assign Org Admin
          </DialogTitle>
          <DialogDescription>
            Assign a user as an administrator for "{organization?.name || 'organization'}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">User Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAssignAdmin()
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-500">
              The user will be assigned as an organization administrator with full management permissions.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignAdmin}
              disabled={loading || !email.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Admin
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
