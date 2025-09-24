'use client'

import { useState } from 'react'
import {
  Settings,
  Database,
  Shield,
  Mail,
  Globe,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface SystemConfig {
  siteName: string
  siteDescription: string
  allowRegistration: boolean
  requireEmailVerification: boolean
  maxUsersPerOrg: number
  enableMaintenanceMode: boolean
  maintenanceMessage: string
  smtpEnabled: boolean
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
}

export function SystemSettingsTab() {
  const [config, setConfig] = useState<SystemConfig>({
    siteName: 'AccuNode Platform',
    siteDescription: 'Financial risk prediction and analysis platform',
    allowRegistration: true,
    requireEmailVerification: true,
    maxUsersPerOrg: 100,
    enableMaintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.',
    smtpEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Here you would typically call an API to save the configuration
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock API call

      setSuccess('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">System Settings</h3>
          <p className="text-sm text-gray-500">
            Configure platform-wide settings and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={config.siteName}
                onChange={(e) => updateConfig('siteName', e.target.value)}
                placeholder="Platform name"
              />
            </div>
            <div>
              <Label htmlFor="maxUsersPerOrg">Max Users per Organization</Label>
              <Input
                id="maxUsersPerOrg"
                type="number"
                value={config.maxUsersPerOrg}
                onChange={(e) => updateConfig('maxUsersPerOrg', parseInt(e.target.value))}
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="siteDescription">Site Description</Label>
            <Textarea
              id="siteDescription"
              value={config.siteDescription}
              onChange={(e) => updateConfig('siteDescription', e.target.value)}
              placeholder="Brief description of your platform"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* User Management Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Allow User Registration</Label>
              <p className="text-xs text-gray-500">
                Allow new users to register for accounts
              </p>
            </div>
            <Switch
              checked={config.allowRegistration}
              onCheckedChange={(checked: boolean) => updateConfig('allowRegistration', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Require Email Verification</Label>
              <p className="text-xs text-gray-500">
                Users must verify their email before accessing the platform
              </p>
            </div>
            <Switch
              checked={config.requireEmailVerification}
              onCheckedChange={(checked: boolean) => updateConfig('requireEmailVerification', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable SMTP</Label>
              <p className="text-xs text-gray-500">
                Enable email sending via SMTP server
              </p>
            </div>
            <Switch
              checked={config.smtpEnabled}
              onCheckedChange={(checked: boolean) => updateConfig('smtpEnabled', checked)}
            />
          </div>

          {config.smtpEnabled && (
            <>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={config.smtpHost}
                    onChange={(e) => updateConfig('smtpHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={config.smtpPort}
                    onChange={(e) => updateConfig('smtpPort', parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="smtpUsername">SMTP Username</Label>
                  <Input
                    id="smtpUsername"
                    value={config.smtpUsername}
                    onChange={(e) => updateConfig('smtpUsername', e.target.value)}
                    placeholder="username@gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={config.smtpPassword}
                    onChange={(e) => updateConfig('smtpPassword', e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Maintenance Mode
            {config.enableMaintenanceMode && (
              <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Maintenance Mode</Label>
              <p className="text-xs text-gray-500">
                Temporarily disable user access to the platform
              </p>
            </div>
            <Switch
              checked={config.enableMaintenanceMode}
              onCheckedChange={(checked: boolean) => updateConfig('enableMaintenanceMode', checked)}
            />
          </div>

          {config.enableMaintenanceMode && (
            <>
              <Separator />
              <div>
                <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                <Textarea
                  id="maintenanceMessage"
                  value={config.maintenanceMessage}
                  onChange={(e) => updateConfig('maintenanceMessage', e.target.value)}
                  placeholder="Message to display to users during maintenance"
                  rows={3}
                />
              </div>
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Warning:</strong> Maintenance mode will prevent all users (except super admins) from accessing the platform.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium">Database</div>
                <div className="text-sm text-gray-500">Connected</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium">Redis Cache</div>
                <div className="text-sm text-gray-500">Operational</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {config.smtpEnabled ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div>
                <div className="font-medium">Email Service</div>
                <div className="text-sm text-gray-500">
                  {config.smtpEnabled ? 'Configured' : 'Not configured'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving Changes...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  )
}
