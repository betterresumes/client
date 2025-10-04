'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Mail, Users, X } from 'lucide-react'

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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

import { organizationsApi } from '@/lib/api/organizations'

const inviteUserSchema = z.object({
  emails: z.string().optional(),
})

type InviteUserFormData = z.infer<typeof inviteUserSchema>

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  organizationName: string
  onUsersInvited?: () => void
}

export function InviteUserDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  onUsersInvited
}: InviteUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [emailList, setEmailList] = useState<string[]>([])

  const form = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      emails: '',
    }
  })

  const addEmailToList = () => {
    const emailsText = form.getValues('emails') || ''
    const emails = emailsText
      .split(',')
      .map(email => email.trim())
      .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))

    if (emails.length > 0) {
      const newEmails = emails.filter(email => !emailList.includes(email))
      setEmailList(prev => [...prev, ...newEmails])
      form.setValue('emails', '')
      // Clear any form errors since we have valid emails
      form.clearErrors('emails')
    }
  }

  const removeEmail = (emailToRemove: string) => {
    setEmailList(prev => prev.filter(email => email !== emailToRemove))
  }

  const onSubmit = async (data: InviteUserFormData) => {
    // Add any remaining emails in the input
    addEmailToList()

    // Wait for state update, then check again
    setTimeout(() => {
      if (emailList.length === 0 && !(form.getValues('emails') || '').trim()) {
        form.setError('emails', { message: 'At least one email is required' })
        return
      }
    }, 0)

    if (emailList.length === 0) {
      setError('Please add at least one valid email address')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // Add emails to organization whitelist
      const promises = emailList.map(email =>
        organizationsApi.whitelist.add(organizationId, { email })
      )

      const results = await Promise.allSettled(promises)
      const successCount = results.filter(result => result.status === 'fulfilled').length
      const failureCount = results.length - successCount

      if (successCount > 0) {
        setSuccess(`Successfully invited ${successCount} user(s) to ${organizationName}`)
        if (failureCount > 0) {
          setError(`${failureCount} invitation(s) failed`)
        }

        // Reset form and email list after successful invite
        setTimeout(() => {
          form.reset()
          setEmailList([])
          if (onUsersInvited) {
            onUsersInvited()
          }
          onOpenChange(false)
        }, 2000)
      } else {
        setError('Failed to send invitations. Please try again.')
      }
    } catch (error) {
      console.error('Error inviting users:', error)
      setError('Failed to send invitations. Please check the email addresses and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    setEmailList([])
    setError(null)
    setSuccess(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Invite Users to {organizationName}
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

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="emails">Email Addresses</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="emails"
                {...form.register('emails')}
                placeholder="user@company.com, user2@company.com"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addEmailToList()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  addEmailToList()
                  // Clear form errors if we have emails in the list
                  if (emailList.length > 0) {
                    form.clearErrors('emails')
                  }
                }}
                disabled={!(form.getValues('emails') || '').trim()}
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter email addresses separated by commas, or press Enter/comma to add them to the list
            </p>
            {form.formState.errors.emails && emailList.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.emails.message}
              </p>
            )}
          </div>

          {/* Email List */}
          {emailList.length > 0 && (
            <div className="space-y-2">
              <Label>Users to Invite ({emailList.length})</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                {emailList.map((email, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="mr-1 mb-1 flex items-center w-fit"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    <span className="truncate max-w-[200px]" title={email}>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <Users className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">How invitations work:</p>
                <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                  <li>Invited users will be added to the organization whitelist</li>
                  <li>They can join using the organization's join token</li>
                  <li>Users will have member-level access by default</li>
                </ul>
              </div>
            </div>
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
            <Button
              type="submit"
              disabled={loading || (emailList.length === 0 && !form.getValues('emails')?.trim())}
            >
              {loading ? 'Sending Invites...' : `Invite ${emailList.length || 0} User${emailList.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
