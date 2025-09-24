'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { predictionsApi } from '@/lib/api/predictions'
import { useBulkUploadStore } from '@/lib/stores/bulk-upload-store'
import { toast } from 'sonner'
import { Trash2, Square, RefreshCw } from 'lucide-react'

export function BulkUploadDebugger() {
  const [testJobId, setTestJobId] = useState('b9523f1e-3d6a-44f3-b5b0-fc6a4ff95f1a')
  const [debugResults, setDebugResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { jobs, fetchAllJobs, deleteJob, cancelJob, canDeleteJob } = useBulkUploadStore()

  const testJobStatus = async (jobId: string) => {
    setIsLoading(true)
    console.log(`🔍 Testing job status for: ${jobId}`)

    try {
      const response = await predictionsApi.jobs.getJobStatus(jobId)
      console.log(`📡 Job status response:`, response)
      setDebugResults({
        type: 'jobStatus',
        jobId,
        success: response.success,
        data: response.data,
        error: response.error
      })

      if (response.success) {
        toast.success(`Job found! Status: ${response.data?.status}`)
      } else {
        toast.error(`Job not found: ${response.error}`)
      }
    } catch (error) {
      console.error(`❌ Error testing job status:`, error)
      setDebugResults({
        type: 'jobStatus',
        jobId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setIsLoading(false)
  }

  const testListAllJobs = async () => {
    setIsLoading(true)
    console.log(`📋 Testing list all jobs API`)

    try {
      const response = await predictionsApi.jobs.listJobs({ limit: 10, offset: 0 })
      console.log(`📡 List jobs response:`, response)
      setDebugResults({
        type: 'listJobs',
        success: response.success,
        data: response.data,
        error: response.error
      })

      if (response.success) {
        const jobCount = response.data?.jobs?.length || response.data?.items?.length || 0
        toast.success(`Found ${jobCount} jobs in API`)
      } else {
        toast.error(`Failed to list jobs: ${response.error}`)
      }
    } catch (error) {
      console.error(`❌ Error listing jobs:`, error)
      setDebugResults({
        type: 'listJobs',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setIsLoading(false)
  }

  const testUpload = async () => {
    setIsLoading(true)
    console.log(`📤 Testing file upload with sample data`)

    // Create a sample CSV file for testing
    const csvContent = `company_symbol,company_name,sector,market_cap,reporting_year,reporting_quarter,long_term_debt_to_total_capital,total_debt_to_ebitda,net_income_margin,ebit_to_interest_expense,return_on_assets
AAPL,Apple Inc,Technology,3000000,2024,Q1,18.75,2.10,25.30,15.80,12.50
MSFT,Microsoft Corp,Technology,2500000,2024,Q1,15.20,1.80,22.10,18.50,11.20`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const file = new File([blob], 'test_upload.csv', { type: 'text/csv' })

    try {
      console.log(`🚀 Uploading test file...`)
      const response = await predictionsApi.annual.bulkUploadAnnualAsync(file)
      console.log(`📡 Upload response:`, response)

      setDebugResults({
        type: 'upload',
        success: response.success,
        data: response.data,
        error: response.error
      })

      if (response.success && response.data) {
        const jobId = response.data.job_id || response.data.id || response.data.task_id
        toast.success(`Upload successful! Job ID: ${jobId}`)

        // Automatically test the returned job ID
        if (jobId) {
          setTestJobId(jobId)
          setTimeout(() => testJobStatus(jobId), 2000) // Wait 2 seconds then test
        }
      } else {
        toast.error(`Upload failed: ${response.error}`)
      }
    } catch (error) {
      console.error(`❌ Error testing upload:`, error)
      setDebugResults({
        type: 'upload',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      toast.error(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setIsLoading(false)
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm(`Are you sure you want to delete job ${jobId}?`)) return

    setIsLoading(true)
    const success = await deleteJob(jobId)

    if (success) {
      toast.success('Job deleted successfully')
      await fetchAllJobs() // Refresh the list
    } else {
      toast.error('Failed to delete job')
    }
    setIsLoading(false)
  }

  const handleCancelJob = async (jobId: string) => {
    if (!confirm(`Are you sure you want to cancel job ${jobId}?`)) return

    setIsLoading(true)
    const success = await cancelJob(jobId)

    if (success) {
      toast.success('Job cancelled successfully')
      await fetchAllJobs() // Refresh the list
    } else {
      toast.error('Failed to cancel job')
    }
    setIsLoading(false)
  }

  return (
    <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
      <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-4">
        🔧 Bulk Upload Debugger & Job Manager
      </h3>

      <div className="space-y-4">
        {/* Test Job Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
            Test Job Status
          </label>
          <div className="flex gap-2">
            <Input
              value={testJobId}
              onChange={(e) => setTestJobId(e.target.value)}
              placeholder="Enter job ID to test"
              className="font-mono text-xs"
            />
            <Button
              onClick={() => testJobStatus(testJobId)}
              disabled={isLoading || !testJobId}
              size="sm"
            >
              Test Status
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={testListAllJobs}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            List All Jobs
          </Button>
          <Button
            onClick={testUpload}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Test Upload
          </Button>
          <Button
            onClick={fetchAllJobs}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Store
          </Button>
        </div>

        {/* Current Store Jobs with Management */}
        {jobs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              Jobs in Store ({jobs.length}) - With Delete Options
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center gap-2 text-xs p-2 rounded border">
                  <Badge variant={job.status === 'completed' ? 'default' :
                    job.status === 'failed' ? 'destructive' :
                      job.status === 'processing' ? 'secondary' : 'outline'}>
                    {job.status}
                  </Badge>
                  <span className="font-mono flex-1 truncate">{job.id}</span>
                  <span className="truncate max-w-[100px]">{job.original_filename}</span>

                  {/* Action buttons */}
                  <div className="flex gap-1">
                    {job.status === 'processing' && (
                      <Button
                        onClick={() => handleCancelJob(job.id)}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title="Cancel processing job"
                      >
                        <Square className="h-3 w-3" />
                      </Button>
                    )}
                    {canDeleteJob(job) && (
                      <Button
                        onClick={() => handleDeleteJob(job.id)}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        title={`Delete ${job.status} job`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
              💡 You can delete any job except those currently processing
            </p>
          </div>
        )}

        {/* Debug Results */}
        {debugResults && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              Last Test Result ({debugResults.type})
            </h4>
            <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(debugResults, null, 2)}
            </pre>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-yellow-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">Processing...</p>
          </div>
        )}
      </div>
    </Card>
  )
}
