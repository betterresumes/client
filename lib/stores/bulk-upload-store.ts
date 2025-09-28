'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { predictionsApi } from '@/lib/api/predictions'
import { jobsApi } from '@/lib/api/jobs'
import type { Job, JobProgress } from '@/lib/types/job'

interface BulkUploadJob {
  id: string
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed'
  job_type: 'annual' | 'quarterly'
  original_filename: string
  file_size?: number
  total_rows?: number
  processed_rows: number
  successful_rows: number
  failed_rows: number
  progress_percentage: number
  created_at: string
  started_at?: string
  completed_at?: string
  error_message?: string
  error_details?: string
  celery_task_id?: string
  celery_status?: string
  celery_meta?: any
  estimated_time_minutes?: number
}

interface BulkUploadState {
  jobs: BulkUploadJob[]
  activeJob: BulkUploadJob | null
  isUploading: boolean
  isPolling: boolean
  error: string | null
  pollingIntervalId: NodeJS.Timeout | null
}

interface BulkUploadStore extends BulkUploadState {
  // Actions
  uploadFile: (file: File, type: 'annual' | 'quarterly') => Promise<string | null>
  startJobPolling: (jobId: string) => Promise<void>
  stopJobPolling: () => void
  refreshJobStatus: (jobId: string) => Promise<void>
  fetchAllJobs: () => Promise<void>
  clearError: () => void
  reset: () => void

  // Job management
  deleteJob: (jobId: string) => Promise<boolean>
  cancelJob: (jobId: string) => Promise<boolean>

  // Job management helpers
  getJobById: (jobId: string) => BulkUploadJob | null
  getActiveJobs: () => BulkUploadJob[]
  getCompletedJobs: () => BulkUploadJob[]
  getFailedJobs: () => BulkUploadJob[]
  canDeleteJob: (job: BulkUploadJob) => boolean

  // Debug helpers
  testJobStatus: (jobId: string) => Promise<any>
  testListJobs: () => Promise<any>
}

const initialState: BulkUploadState = {
  jobs: [],
  activeJob: null,
  isUploading: false,
  isPolling: false,
  error: null,
  pollingIntervalId: null
}

export const useBulkUploadStore = create<BulkUploadStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      uploadFile: async (file: File, type: 'annual' | 'quarterly') => {
        set({ isUploading: true, error: null })

        // Generate temp job ID for immediate feedback
        const tempJobId = `temp-${Date.now()}`

        try {
          console.log(`🚀 Starting ${type} bulk upload for file:`, file.name)

          // Show immediate upload feedback
          const tempJob: BulkUploadJob = {
            id: tempJobId,
            status: 'pending',
            job_type: type,
            original_filename: file.name,
            file_size: file.size,
            total_rows: 0,
            processed_rows: 0,
            successful_rows: 0,
            failed_rows: 0,
            progress_percentage: 0,
            created_at: new Date().toISOString()
          }

          // Add temporary job for immediate UI feedback
          set(state => ({
            jobs: [tempJob, ...state.jobs],
            activeJob: tempJob
          }))

          // Call the appropriate async bulk upload endpoint
          const response = type === 'annual'
            ? await predictionsApi.annual.bulkUploadAnnualAsync(file)
            : await predictionsApi.quarterly.bulkUploadQuarterlyAsync(file)

          console.log(`📡 Bulk upload API response:`, {
            success: response.success,
            data: response.data,
            error: response.error
          })

          if (!response.success || !response.data) {
            const errorMsg = typeof response.error === 'string' ? response.error : 'Upload failed'
            console.error('❌ Bulk upload failed:', errorMsg)

            // Remove temporary job and show error
            set(state => ({
              jobs: state.jobs.filter(j => j.id !== tempJobId),
              activeJob: null,
              isUploading: false,
              error: errorMsg
            }))
            throw new Error(errorMsg)
          }

          const jobData = response.data
          console.log(`📋 Job data received:`, jobData)

          // Extract job details from new Celery response format
          const jobId = jobData.job_id || jobData.id || jobData.task_id || jobData.jobId
          const taskId = jobData.task_id || jobData.celery_task_id
          const queuePriority = jobData.queue_priority || 'medium'
          const estimatedTimeMinutes = jobData.estimated_time_minutes || jobData.estimatedTimeMinutes
          const totalCompanies = jobData.total_companies || jobData.totalCompanies || 0

          if (!jobId) {
            console.error('❌ No job ID found in response:', jobData)
            set(state => ({
              jobs: state.jobs.filter(j => j.id !== tempJobId),
              activeJob: null,
              isUploading: false,
              error: 'No job ID returned from upload'
            }))
            throw new Error('No job ID returned from upload')
          }

          console.log(`🆔 Extracted job details:`, {
            jobId,
            taskId,
            queuePriority,
            estimatedTimeMinutes,
            totalCompanies
          })

          // Update the temporary job with real job data
          const realJob: BulkUploadJob = {
            id: jobId,
            status: 'queued', // Start with queued status for new Celery system
            job_type: type,
            original_filename: file.name,
            file_size: file.size,
            total_rows: totalCompanies,
            processed_rows: 0,
            successful_rows: 0,
            failed_rows: 0,
            progress_percentage: 0,
            created_at: new Date().toISOString(),
            celery_task_id: taskId,
            estimated_time_minutes: estimatedTimeMinutes
          }

          // Replace temporary job with real job
          set(state => ({
            jobs: [realJob, ...state.jobs.filter(j => j.id !== tempJobId)],
            activeJob: realJob,
            isUploading: false
          }))

          console.log(`✅ Bulk upload job created:`, {
            jobId: realJob.id,
            taskId: realJob.celery_task_id,
            estimatedTime: realJob.estimated_time_minutes,
            filename: realJob.original_filename,
            queuePriority: queuePriority
          })

          // Immediately check if job exists by getting it from the jobs list (not individual status endpoint)
          try {
            console.log(`🔍 Verifying job exists by checking jobs list for ID: ${realJob.id}`)
            const listResponse = await predictionsApi.jobs.listJobs({ limit: 50, offset: 0 })

            if (listResponse.success) {
              const jobsArray = listResponse.data?.jobs || listResponse.data?.items || listResponse.data || []
              const foundJob = jobsArray.find((job: any) => (job.job_id || job.id) === realJob.id)

              if (foundJob) {
                console.log(`✅ Job verification successful:`, foundJob)
              } else {
                console.warn(`⚠️ Job not found in list yet - it might still be initializing`)
              }
            } else {
              console.warn(`⚠️ Job verification failed:`, listResponse.error)
              // Don't throw error here, as the job might just be initializing
            }
          } catch (verificationError) {
            console.warn(`⚠️ Job verification error (job might be initializing):`, verificationError)
          }

          // Start polling for progress
          await get().startJobPolling(realJob.id)

          return realJob.id
        } catch (error: any) {
          console.error('❌ Bulk upload failed:', error)

          // Remove temporary job on error
          set(state => ({
            jobs: state.jobs.filter(j => j.id !== tempJobId),
            activeJob: null,
            isUploading: false,
            error: error.message || 'Upload failed'
          }))
          return null
        }
      },

      startJobPolling: async (jobId: string) => {
        const state = get()

        // Don't start polling if already polling
        if (state.isPolling) {
          return
        }

        set({ isPolling: true })

        const poll = async () => {
          try {
            await get().refreshJobStatus(jobId)

            const currentState = get()
            const job = currentState.jobs.find(j => j.id === jobId)

            // Stop polling if job is complete or failed
            if (!job || job.status === 'completed' || job.status === 'failed') {
              get().stopJobPolling()
              return
            }

            // Continue polling more aggressively for active jobs
            const intervalId = setTimeout(poll, 1500) // Poll every 1.5 seconds for better responsiveness
            set({ pollingIntervalId: intervalId })
          } catch (error) {
            console.error('❌ Job polling error:', error)
            get().stopJobPolling()
          }
        }

        // Start first poll immediately
        poll()
      },

      stopJobPolling: () => {
        const state = get()

        if (state.pollingIntervalId) {
          clearTimeout(state.pollingIntervalId)
        }

        set({
          isPolling: false,
          pollingIntervalId: null
        })
      },

      refreshJobStatus: async (jobId: string) => {
        try {
          // FIXED: Use the list endpoint to get fresh status instead of individual status endpoint
          // The individual status endpoint appears to return cached/stale data
          const response = await predictionsApi.jobs.listJobs({
            limit: 50,
            offset: 0
          })

          if (!response.success) {
            console.warn(`⚠️ Failed to get jobs list for status update:`, response.error)
            return
          }

          // Find the specific job in the list
          const jobsArray = response.data?.jobs || response.data?.items || response.data || []
          const jobStatus = jobsArray.find((job: any) =>
            (job.job_id || job.id) === jobId
          )

          if (!jobStatus) {
            console.warn(`⚠️ Job ${jobId} not found in jobs list - it might still be initializing or was deleted`)

            // Mark job as potentially failed if it's been too long
            const job = get().jobs.find(j => j.id === jobId)
            if (job) {
              const createdTime = new Date(job.created_at).getTime()
              const now = new Date().getTime()
              const minutesElapsed = (now - createdTime) / (1000 * 60)

              if (minutesElapsed > 2) { // If job has been missing for more than 2 minutes
                console.warn(`⚠️ Job ${jobId} has been missing for ${minutesElapsed.toFixed(1)} minutes, marking as failed`)

                set(state => ({
                  jobs: state.jobs.map(j =>
                    j.id === jobId
                      ? {
                        ...j,
                        status: 'failed' as const,
                        error_message: 'Job not found on server - may have been deleted or failed to create',
                        completed_at: new Date().toISOString()
                      }
                      : j
                  )
                }))

                return // Stop polling this job
              }
            }

            return // Don't update anything, job might still be initializing
          }

          // Now we have jobStatus from the jobs list - use it directly
          console.log(`📊 Job ${jobId} status update [${new Date().toISOString()}]:`, {
            status: jobStatus.status,
            progress_percentage: jobStatus.progress_percentage,
            progress: jobStatus.progress,
            processed_records: jobStatus.processed_records,
            total_records: jobStatus.total_records,
            isActiveJob: get().activeJob?.id === jobId,
            fullJobStatus: jobStatus
          })

          set(state => ({
            jobs: state.jobs.map(job =>
              job.id === jobId
                ? {
                  ...job,
                  // Map Celery worker statuses to our job statuses
                  status: (jobStatus.status === 'pending' || jobStatus.status === 'queued') ? 'queued' :
                    jobStatus.status === 'processing' ? 'processing' :
                      jobStatus.status === 'completed' ? 'completed' :
                        jobStatus.status === 'failed' ? 'failed' :
                          job.status, // Keep current status if unknown
                  processed_rows: jobStatus.processed_records || jobStatus.processed_rows || job.processed_rows,
                  successful_rows: jobStatus.successful_predictions || jobStatus.successful_rows || job.successful_rows,
                  failed_rows: jobStatus.failed_predictions || jobStatus.failed_rows || job.failed_rows,
                  total_rows: jobStatus.total_records || jobStatus.total_rows || job.total_rows,
                  progress_percentage: (() => {
                    // Try multiple progress field names that might exist in the API response
                    if (jobStatus.progress_percentage !== undefined) return jobStatus.progress_percentage
                    if (jobStatus.progress !== undefined) return jobStatus.progress
                    if (jobStatus.processed_records && jobStatus.total_records && jobStatus.total_records > 0) {
                      const calculated = Math.round((jobStatus.processed_records / jobStatus.total_records) * 100)
                      console.log(`📊 Calculated progress for ${jobId}: ${calculated}% (${jobStatus.processed_records}/${jobStatus.total_records})`)
                      return calculated
                    }
                    return job.progress_percentage || 0
                  })(),
                  error_message: jobStatus.errors?.[0] || jobStatus.error_message || job.error_message,
                  updated_at: jobStatus.updated_at || new Date().toISOString(),
                  completed_at: (jobStatus.status === 'completed' || jobStatus.status === 'failed') ?
                    (jobStatus.completed_at || new Date().toISOString()) :
                    job.completed_at,
                  // Store Celery-specific fields
                  celery_status: jobStatus.status,
                  celery_meta: jobStatus.meta || job.celery_meta
                }
                : job
            ),
            activeJob: state.activeJob?.id === jobId
              ? {
                ...state.activeJob,
                // Apply same status mapping for activeJob
                status: (jobStatus.status === 'pending' || jobStatus.status === 'queued') ? 'queued' :
                  jobStatus.status === 'processing' ? 'processing' :
                    jobStatus.status === 'completed' ? 'completed' :
                      jobStatus.status === 'failed' ? 'failed' :
                        state.activeJob.status,
                processed_rows: jobStatus.processed_records || jobStatus.processed_rows || state.activeJob.processed_rows,
                successful_rows: jobStatus.successful_predictions || jobStatus.successful_rows || state.activeJob.successful_rows,
                failed_rows: jobStatus.failed_predictions || jobStatus.failed_rows || state.activeJob.failed_rows,
                total_rows: jobStatus.total_records || jobStatus.total_rows || state.activeJob.total_rows,
                progress_percentage: (() => {
                  // Try multiple progress field names that might exist in the API response
                  if (jobStatus.progress_percentage !== undefined) return jobStatus.progress_percentage
                  if (jobStatus.progress !== undefined) return jobStatus.progress
                  if (jobStatus.processed_records && jobStatus.total_records && jobStatus.total_records > 0) {
                    const calculated = Math.round((jobStatus.processed_records / jobStatus.total_records) * 100)
                    console.log(`📊 ActiveJob calculated progress for ${jobId}: ${calculated}% (${jobStatus.processed_records}/${jobStatus.total_records})`)
                    return calculated
                  }
                  return state.activeJob.progress_percentage || 0
                })(),
                error_message: jobStatus.errors?.[0] || jobStatus.error_message || state.activeJob.error_message,
                updated_at: jobStatus.updated_at || new Date().toISOString(),
                completed_at: (jobStatus.status === 'completed' || jobStatus.status === 'failed') ?
                  (jobStatus.completed_at || new Date().toISOString()) :
                  state.activeJob.completed_at,
                celery_status: jobStatus.status,
                celery_meta: jobStatus.meta || state.activeJob.celery_meta
              }
              : state.activeJob
          }))

          console.log(`✅ Updated job status for ${jobId}:`, jobStatus.status)
        } catch (error) {
          console.error(`❌ Error refreshing job status for ${jobId}:`, error)

          // If this is a network error or server error, don't mark job as failed immediately
          // But if it's a persistent 404, handle it
          if (error instanceof Error && error.message.includes('404')) {
            const job = get().jobs.find(j => j.id === jobId)
            if (job) {
              const createdTime = new Date(job.created_at).getTime()
              const now = new Date().getTime()
              const minutesElapsed = (now - createdTime) / (1000 * 60)

              if (minutesElapsed > 3) { // Give more time for job creation
                console.error(`❌ Job ${jobId} consistently returning 404 for ${minutesElapsed.toFixed(1)} minutes, marking as failed`)

                set(state => ({
                  jobs: state.jobs.map(j =>
                    j.id === jobId
                      ? {
                        ...j,
                        status: 'failed' as const,
                        error_message: 'Job not found - may have failed to create properly',
                        completed_at: new Date().toISOString()
                      }
                      : j
                  )
                }))
              }
            }
          }
        }
      },

      fetchAllJobs: async () => {
        try {
          // Use the predictions-specific jobs endpoint
          const response = await predictionsApi.jobs.listJobs({
            limit: 50,
            offset: 0
          })

          if (response.success && response.data) {
            // Handle different response structures
            const jobsArray = response.data.jobs || response.data.items || response.data || []

            const jobs: BulkUploadJob[] = jobsArray.map((apiJob: any) => ({
              id: apiJob.job_id || apiJob.id,
              status: apiJob.status || 'pending',
              job_type: apiJob.job_type || 'annual',
              original_filename: apiJob.filename || apiJob.original_filename || 'unknown.csv',
              file_size: apiJob.file_size,
              total_rows: apiJob.total_records || apiJob.total_rows || 0,
              processed_rows: apiJob.processed_records || apiJob.processed_rows || 0,
              successful_rows: apiJob.successful_predictions || apiJob.successful_rows || 0,
              failed_rows: apiJob.failed_predictions || apiJob.failed_rows || 0,
              progress_percentage: apiJob.progress || apiJob.progress_percentage || 0,
              created_at: apiJob.created_at || new Date().toISOString(),
              started_at: apiJob.started_at,
              completed_at: apiJob.completed_at,
              error_message: apiJob.errors?.[0] || apiJob.error_message,
              error_details: apiJob.error_details,
              celery_task_id: apiJob.celery_task_id,
              celery_status: apiJob.celery_status,
              celery_meta: apiJob.celery_meta,
              estimated_time_minutes: apiJob.estimated_time_minutes
            }))

            set({ jobs })
            console.log(`📋 Fetched ${jobs.length} bulk upload jobs`)
          }
        } catch (error: any) {
          console.error('❌ Failed to fetch jobs:', error)
          set({ error: error.message || 'Failed to fetch jobs' })
        }
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        get().stopJobPolling()
        set(initialState)
      },

      // Helper methods
      getJobById: (jobId: string) => {
        return get().jobs.find(job => job.id === jobId) || null
      },

      getActiveJobs: () => {
        return get().jobs.filter(job =>
          job.status === 'pending' || job.status === 'queued' || job.status === 'processing'
        )
      },

      getCompletedJobs: () => {
        return get().jobs.filter(job => job.status === 'completed')
      },

      getFailedJobs: () => {
        return get().jobs.filter(job => job.status === 'failed')
      },

      // Job management methods
      canDeleteJob: (job: BulkUploadJob) => {
        // Can delete any job except those currently processing
        return job.status !== 'processing'
      },

      deleteJob: async (jobId: string) => {
        console.log(`🗑️ Attempting to delete job: ${jobId}`)

        const job = get().getJobById(jobId)
        if (!job) {
          console.error(`❌ Job not found: ${jobId}`)
          set({ error: 'Job not found' })
          return false
        }

        // Check if job can be deleted
        if (!get().canDeleteJob(job)) {
          const errorMsg = 'Cannot delete job that is currently processing. Please cancel it first.'
          console.error(`❌ ${errorMsg}`)
          set({ error: errorMsg })
          return false
        }

        try {
          const response = await predictionsApi.jobs.deleteJob(jobId)

          if (response.success) {
            // Remove job from store
            set(state => ({
              jobs: state.jobs.filter(j => j.id !== jobId),
              activeJob: state.activeJob?.id === jobId ? null : state.activeJob,
              error: null
            }))

            console.log(`✅ Successfully deleted job: ${jobId}`)
            return true
          } else {
            const errorMsg = typeof response.error === 'string'
              ? response.error
              : response.error?.message || 'Failed to delete job'
            console.error(`❌ Delete failed: ${errorMsg}`)
            set({ error: errorMsg })
            return false
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
          console.error(`❌ Error deleting job:`, error)
          set({ error: errorMsg })
          return false
        }
      },

      cancelJob: async (jobId: string) => {
        console.log(`🛑 Attempting to cancel job: ${jobId}`)

        const job = get().getJobById(jobId)
        if (!job) {
          console.error(`❌ Job not found: ${jobId}`)
          set({ error: 'Job not found' })
          return false
        }

        // Only processing jobs can be cancelled
        if (job.status !== 'processing') {
          const errorMsg = `Job is ${job.status}, only processing jobs can be cancelled`
          console.error(`❌ ${errorMsg}`)
          set({ error: errorMsg })
          return false
        }

        try {
          const response = await predictionsApi.jobs.cancelJob(jobId)

          if (response.success) {
            // Update job status to cancelled/failed
            set(state => ({
              jobs: state.jobs.map(j =>
                j.id === jobId
                  ? { ...j, status: 'failed' as const, error_message: 'Cancelled by user' }
                  : j
              ),
              error: null
            }))

            console.log(`✅ Successfully cancelled job: ${jobId}`)

            // Refresh job status to get updated info
            await get().refreshJobStatus(jobId)
            return true
          } else {
            const errorMsg = typeof response.error === 'string'
              ? response.error
              : response.error?.message || 'Failed to cancel job'
            console.error(`❌ Cancel failed: ${errorMsg}`)
            set({ error: errorMsg })
            return false
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
          console.error(`❌ Error cancelling job:`, error)
          set({ error: errorMsg })
          return false
        }
      },

      // Debug helper function
      testJobStatus: async (jobId: string) => {
        console.log(`🔍 Testing job status for ID: ${jobId}`)
        try {
          console.log(`📡 Testing individual status endpoint...`)
          const individualResponse = await predictionsApi.jobs.getJobStatus(jobId)
          console.log(`� Individual endpoint response:`, individualResponse)

          console.log(`�📡 Testing list endpoint...`)
          const listResponse = await predictionsApi.jobs.listJobs({ limit: 50, offset: 0 })
          if (listResponse.success) {
            const jobsArray = listResponse.data?.jobs || listResponse.data?.items || listResponse.data || []
            const jobInList = jobsArray.find((job: any) => (job.job_id || job.id) === jobId)
            console.log(`📋 Job found in list:`, jobInList)
          }

          return {
            individual: individualResponse,
            list: listResponse
          }
        } catch (error) {
          console.error(`❌ Error testing job status:`, error)
          return { success: false, error: error }
        }
      },

      // Debug helper to list all jobs from API
      testListJobs: async () => {
        console.log(`📋 Testing list jobs API`)
        try {
          const response = await predictionsApi.jobs.listJobs({ limit: 10, offset: 0 })
          console.log(`📡 List jobs response:`, response)
          return response
        } catch (error) {
          console.error(`❌ Error listing jobs:`, error)
          return { success: false, error: error }
        }
      },

      // Debug helper to compare both endpoints
      compareEndpoints: async (jobId: string) => {
        console.log(`🔍 Comparing endpoints for job ${jobId}`)

        try {
          // Test individual status endpoint - THIS IS THE STALE ONE
          console.log(`📡 Calling individual status endpoint: GET /api/v1/predictions/jobs/${jobId}/status`)
          const individual = await predictionsApi.jobs.getJobStatus(jobId)

          // Test list endpoint and find the job - THIS IS THE FRESH ONE  
          console.log(`📡 Calling list endpoint: GET /api/v1/predictions/jobs?limit=50&offset=0`)
          const list = await predictionsApi.jobs.listJobs({ limit: 50, offset: 0 })
          let jobInList = null
          if (list.success) {
            const jobsArray = list.data?.jobs || list.data?.items || list.data || []
            jobInList = jobsArray.find((job: any) => (job.job_id || job.id) === jobId)
          }

          console.log(`
🚨 ENDPOINT COMPARISON FOR JOB ${jobId}:

❌ STALE Individual Status Endpoint (/jobs/${jobId}/status):
   Status: ${individual.data?.status || 'N/A'}
   Processed: ${individual.data?.processed_rows || individual.data?.processed_records || 'N/A'}  
   Progress: ${individual.data?.progress_percentage || individual.data?.progress || 'N/A'}%

✅ FRESH List Endpoint (/jobs?limit=50&offset=0):
   Status: ${jobInList?.status || 'NOT FOUND'}
   Processed: ${jobInList?.processed_rows || jobInList?.processed_records || 'N/A'}
   Progress: ${jobInList?.progress_percentage || jobInList?.progress || 'N/A'}%

🔑 USE THE LIST ENDPOINT DATA - IT'S ACCURATE!
          `)

          return { individual, list, jobInList }
        } catch (error) {
          console.error(`❌ Error comparing endpoints:`, error)
          return { error }
        }
      },

      // Add method to force use list endpoint for debugging
      debugRefreshJobFromList: async (jobId: string) => {
        console.log(`🔄 Force refreshing job ${jobId} from list endpoint only`)
        await get().fetchAllJobs() // This uses list endpoint
        const job = get().jobs.find(j => j.id === jobId)
        console.log(`📋 Current job state after list refresh:`, job)
        return job
      }
    }),
    {
      name: 'bulk-upload-store',
      partialize: (state) => ({
        jobs: state.jobs,
        // Don't persist polling state or active job
      })
    }
  )
)
