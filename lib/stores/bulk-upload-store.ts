"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { predictionsApi } from "@/lib/api/predictions";
import { jobsApi } from "@/lib/api/jobs";
import type { Job, JobProgress } from "@/lib/types/job";

export interface BulkUploadJob {
  id: string;
  status: "pending" | "queued" | "processing" | "completed" | "failed";
  job_type: "annual" | "quarterly";
  original_filename: string;
  file_size?: number;
  total_rows?: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  progress_percentage: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  error_details?: string | Record<string, unknown>;
  celery_task_id?: string;
  celery_status?: string;
  celery_meta?: unknown;
  estimated_time_minutes?: number;
  // New fields from API response
  estimated_completion?: string;
  queue_priority?: string;
  queue_position?: number;
  current_worker_capacity?: number;
  system_load?: string;
  processing_rate?: string;
}

interface BulkUploadState {
  jobs: BulkUploadJob[];
  activeJob: BulkUploadJob | null;
  isUploading: boolean;
  isPolling: boolean;
  error: string | null;
  pollingIntervalId: NodeJS.Timeout | null;
}

interface BulkUploadStore extends BulkUploadState {
  // Actions
  uploadFile: (
    file: File,
    type: "annual" | "quarterly"
  ) => Promise<string | null>;
  startJobPolling: (jobId: string) => Promise<void>;
  startAutoPolling: () => void;
  stopJobPolling: () => void;
  refreshJobStatus: (jobId: string) => Promise<void>;
  fetchAllJobs: () => Promise<void>;
  clearError: () => void;
  reset: () => void;

  // Job management
  deleteJob: (jobId: string) => Promise<boolean>;
  cancelJob: (jobId: string) => Promise<boolean>;

  // Job management helpers
  getJobById: (jobId: string) => BulkUploadJob | null;
  getActiveJobs: () => BulkUploadJob[];
  getCompletedJobs: () => BulkUploadJob[];
  getFailedJobs: () => BulkUploadJob[];
  canDeleteJob: (job: BulkUploadJob) => boolean;

  // Debug helpers
  testJobStatus: (jobId: string) => Promise<unknown>;
  testListJobs: () => Promise<unknown>;
}

const initialState: BulkUploadState = {
  jobs: [],
  activeJob: null,
  isUploading: false,
  isPolling: false,
  error: null,
  pollingIntervalId: null,
};

export const useBulkUploadStore = create<BulkUploadStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      uploadFile: async (file: File, type: "annual" | "quarterly") => {
        set({ isUploading: true, error: null });

        // Generate temp job ID for immediate feedback
        const tempJobId = `temp-${Date.now()}`;

        try {
          console.log(`🚀 Starting ${type} bulk upload for file:`, file.name);

          // Show immediate upload feedback
          const tempJob: BulkUploadJob = {
            id: tempJobId,
            status: "pending",
            job_type: type,
            original_filename: file.name,
            file_size: file.size,
            total_rows: 0,
            processed_rows: 0,
            successful_rows: 0,
            failed_rows: 0,
            progress_percentage: 0,
            created_at: new Date().toISOString(),
          };

          // Add temporary job for immediate UI feedback
          set((state) => ({
            jobs: [tempJob, ...state.jobs],
            activeJob: tempJob,
          }));

          // Call the appropriate async bulk upload endpoint
          const response =
            type === "annual"
              ? await predictionsApi.annual.bulkUploadAnnualAsync(file)
              : await predictionsApi.quarterly.bulkUploadQuarterlyAsync(file);

          console.log(`📡 Bulk upload API response:`, {
            success: response.success,
            data: response.data,
            error: response.error,
          });

          if (!response.success || !response.data) {
            // Parse error details to provide better user feedback
            let errorMsg = "Upload failed";
            let userFriendlyMsg = "";

            if (response.error) {
              if (typeof response.error === "string") {
                errorMsg = response.error;
              } else if (response.error.details) {
                errorMsg = response.error.details;
              } else if (response.error.message) {
                errorMsg = response.error.message;
              }
            }

            // Check for common error patterns and provide helpful messages
            if (errorMsg.includes("Missing required columns")) {
              const missingColumns = errorMsg.match(/Missing required columns: (.+)/);
              if (missingColumns) {
                const columns = missingColumns[1];
                if (type === "annual") {
                  userFriendlyMsg = `❌ Wrong file format: This appears to be a quarterly file. Annual predictions require these columns: ${columns}. Please switch to the "Quarterly Model" tab or upload an annual predictions file.`;
                } else {
                  userFriendlyMsg = `❌ Wrong file format: This appears to be an annual file. Quarterly predictions require these columns: ${columns}. Please switch to the "Annual Model" tab or upload a quarterly predictions file.`;
                }
              } else {
                userFriendlyMsg = `❌ File format error: Your file is missing required columns. ${errorMsg}`;
              }
            } else if (errorMsg.includes("Invalid file format") || errorMsg.includes("file format")) {
              userFriendlyMsg = `❌ Invalid file format: Please ensure you're uploading a CSV or Excel file with the correct structure. Download the template to see the required format.`;
            } else if (errorMsg.includes("file size") || errorMsg.includes("too large")) {
              userFriendlyMsg = `❌ File too large: Your file exceeds the maximum size limit. Please reduce the file size and try again.`;
            } else if (errorMsg.includes("No job ID") || errorMsg.includes("job_id")) {
              userFriendlyMsg = `❌ Server error: Failed to create analysis job. Please try again or contact support if the issue persists.`;
            } else {
              userFriendlyMsg = `❌ Upload failed: ${errorMsg}`;
            }

            console.error("❌ Bulk upload failed:", {
              originalError: errorMsg,
              userMessage: userFriendlyMsg
            });

            // Remove temporary job and show error
            set((state) => ({
              jobs: state.jobs.filter((j) => j.id !== tempJobId),
              activeJob: null,
              isUploading: false,
              error: userFriendlyMsg,
            }));
            throw new Error(userFriendlyMsg);
          }

          const jobData = response.data;
          console.log(`📋 Job data received:`, jobData);

          // Extract job details from new Celery response format
          const jobId =
            jobData.job_id || jobData.id || jobData.task_id || jobData.jobId;
          const taskId = jobData.task_id || jobData.celery_task_id;
          const queuePriority = jobData.queue_priority || "medium";
          const estimatedTimeMinutes =
            jobData.estimated_time_minutes || jobData.estimatedTimeMinutes;
          const totalCompanies =
            jobData.total_companies || jobData.totalCompanies || 0;

          if (!jobId) {
            console.error("❌ No job ID found in response:", jobData);
            
            let errorMsg = "❌ Server error: Failed to create analysis job. The server didn't return a job ID.";
            
            // Check if there's additional error information in the response
            if (jobData.error || jobData.message) {
              const serverMsg = jobData.error || jobData.message;
              if (serverMsg.includes("Missing required columns")) {
                const missingColumns = serverMsg.match(/Missing required columns: (.+)/);
                if (missingColumns) {
                  const columns = missingColumns[1];
                  if (type === "annual") {
                    errorMsg = `❌ Wrong file format: This appears to be a quarterly file. Annual predictions require: ${columns}. Please switch to "Quarterly Model" tab.`;
                  } else {
                    errorMsg = `❌ Wrong file format: This appears to be an annual file. Quarterly predictions require: ${columns}. Please switch to "Annual Model" tab.`;
                  }
                }
              } else {
                errorMsg = `❌ Server error: ${serverMsg}`;
              }
            }

            set((state) => ({
              jobs: state.jobs.filter((j) => j.id !== tempJobId),
              activeJob: null,
              isUploading: false,
              error: errorMsg,
            }));
            throw new Error(errorMsg);
          }

          console.log(`🆔 Extracted job details:`, {
            jobId,
            taskId,
            queuePriority,
            estimatedTimeMinutes,
            totalCompanies,
          });

          // Update the temporary job with real job data
          const realJob: BulkUploadJob = {
            id: jobId,
            status: "queued", // Start with queued status for new Celery system
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
            estimated_time_minutes: estimatedTimeMinutes,
          };

          // Replace temporary job with real job
          set((state) => ({
            jobs: [realJob, ...state.jobs.filter((j) => j.id !== tempJobId)],
            activeJob: realJob,
            isUploading: false,
          }));

          console.log(`✅ Bulk upload job created:`, {
            jobId: realJob.id,
            taskId: realJob.celery_task_id,
            estimatedTime: realJob.estimated_time_minutes,
            filename: realJob.original_filename,
            queuePriority: queuePriority,
          });

          // Immediately check if job exists by trying to get its status
          try {
            console.log(
              `🔍 Verifying job exists by checking status for ID: ${realJob.id}`
            );
            const statusResponse = await predictionsApi.jobs.getJobStatus(
              realJob.id
            );

            if (statusResponse.success) {
              console.log(
                `✅ Job verification successful:`,
                statusResponse.data
              );
            } else {
              console.warn(`⚠️ Job verification failed:`, statusResponse.error);
              // Don't throw error here, as the job might just be initializing
            }
          } catch (verificationError) {
            console.warn(
              `⚠️ Job verification error (job might be initializing):`,
              verificationError
            );
          }

          // Start polling for progress
          await get().startJobPolling(realJob.id);

          return realJob.id;
        } catch (error: unknown) {
          console.error("❌ Bulk upload failed:", error);

          // Remove temporary job on error
          set((state) => ({
            jobs: state.jobs.filter((j) => j.id !== tempJobId),
            activeJob: null,
            isUploading: false,
            error: error instanceof Error ? error.message : "Upload failed",
          }));
          return null;
        }
      },

      startJobPolling: async (jobId: string) => {
        const state = get();

        // Don't start polling if already polling
        if (state.isPolling) {
          return;
        }

        set({ isPolling: true });

        const poll = async () => {
          try {
            await get().refreshJobStatus(jobId);

            const currentState = get();
            const job = currentState.jobs.find((j) => j.id === jobId);

            // Stop polling if job is complete or failed
            if (!job || job.status === "completed" || job.status === "failed") {
              get().stopJobPolling();
              return;
            }

            // Continue polling
            const intervalId = setTimeout(poll, 3000); // Poll every 3 seconds
            set({ pollingIntervalId: intervalId });
          } catch (error) {
            console.error("❌ Job polling error:", error);
            get().stopJobPolling();
          }
        };

        // Start first poll immediately
        poll();
      },

      stopJobPolling: () => {
        const state = get();

        if (state.pollingIntervalId) {
          clearTimeout(state.pollingIntervalId);
        }

        set({
          isPolling: false,
          pollingIntervalId: null,
        });
      },

      refreshJobStatus: async (jobId: string) => {
        try {
          console.log(`🔄 Refreshing status for job ${jobId}`)
          
          // Use the correct bulk upload job status endpoint
          const response = await jobsApi.predictions.getBulkUploadJobStatus(jobId);

          if (!response.success) {
            console.warn(`⚠️ Failed to get status for job ${jobId}:`, response.error);
            return;
          }

          const jobData = response.data;
          console.log(`📊 Job ${jobId} status update:`, jobData);

          // The response.data may have different structures depending on the endpoint
          // Let's handle both the simple status response and the full job response
          if (jobData) {
            set((state) => ({
              jobs: state.jobs.map((job) => {
                if (job.id === jobId) {
                  // Handle different response structures - suppressing type checks for API flexibility
                  /* eslint-disable @typescript-eslint/no-explicit-any */
                  const jobDataObj = jobData as any;
                  const apiJob = jobDataObj.job || jobDataObj;
                  /* eslint-enable @typescript-eslint/no-explicit-any */
                  
                  const updatedJob: BulkUploadJob = {
                    ...job,
                    status: String(apiJob.status || "pending") as BulkUploadJob['status'],
                    total_rows: Number(apiJob.total_rows || apiJob.total_records || job.total_rows || 0),
                    processed_rows: Number(apiJob.processed_rows || apiJob.processed_records || job.processed_rows || 0),
                    successful_rows: Number(apiJob.successful_rows || apiJob.successful_predictions || job.successful_rows || 0),
                    failed_rows: Number(apiJob.failed_rows || apiJob.failed_predictions || job.failed_rows || 0),
                    progress_percentage: apiJob.progress_percentage !== undefined ? Number(apiJob.progress_percentage) :
                      apiJob.progress !== undefined ? Number(apiJob.progress) : 
                      (apiJob.processed_records && apiJob.total_records && apiJob.total_records > 0) ?
                      (Number(apiJob.processed_records) / Number(apiJob.total_records)) * 100 : job.progress_percentage,
                    started_at: apiJob.started_at ? String(apiJob.started_at) : job.started_at,
                    completed_at: apiJob.completed_at ? String(apiJob.completed_at) : job.completed_at,
                    error_message: apiJob.error_message || apiJob.message || (Array.isArray(apiJob.errors) && apiJob.errors.length > 0 ? apiJob.errors[0] : job.error_message),
                    error_details: apiJob.error_details || (Array.isArray(apiJob.errors) ? { errors: apiJob.errors } : job.error_details),
                    // Additional fields from detailed job response
                    celery_task_id: apiJob.celery_task_id || job.celery_task_id,
                    celery_status: apiJob.celery_status ? String(apiJob.celery_status) : job.celery_status,
                    celery_meta: apiJob.celery_meta || job.celery_meta,
                    estimated_completion: apiJob.estimated_completion ? String(apiJob.estimated_completion) : job.estimated_completion,
                    processing_rate: apiJob.processing_rate ? String(apiJob.processing_rate) : job.processing_rate,
                    current_worker_capacity: typeof apiJob.current_worker_capacity === 'number' ? apiJob.current_worker_capacity : job.current_worker_capacity,
                    system_load: apiJob.system_load ? String(apiJob.system_load) : job.system_load,
                    queue_priority: apiJob.queue_priority ? String(apiJob.queue_priority) : job.queue_priority,
                    queue_position: typeof apiJob.queue_position === 'number' ? apiJob.queue_position : job.queue_position,
                  };
                  
                  console.log(`✅ Updated job ${jobId}:`, {
                    status: updatedJob.status,
                    progress: updatedJob.progress_percentage,
                    processed: updatedJob.processed_rows,
                    total: updatedJob.total_rows
                  });
                  
                  return updatedJob;
                }
                return job;
              }),
            }));

            // Update active job if this is the active one
            const currentActiveJob = get().activeJob;
            if (currentActiveJob && currentActiveJob.id === jobId) {
              const updatedActiveJob = get().jobs.find(j => j.id === jobId);
              if (updatedActiveJob) {
                set({ activeJob: updatedActiveJob });
              }
            }
          }

        } catch (error) {
          console.error(`❌ Error refreshing job status for ${jobId}:`, error);
        }
      },

      fetchAllJobs: async () => {
        try {
          console.log('🔍 Fetching all bulk upload jobs...')
          
          // Use the correct bulk upload jobs endpoint
          const response = await jobsApi.predictions.listBulkUploadJobs({
            limit: 50,
            offset: 0,
          });

          console.log('📡 Jobs API response:', response)

          if (response.success && response.data) {
            // Handle different response structures
            const jobsArray = response.data.jobs || [];

            console.log('📋 Raw jobs data:', jobsArray)

            const jobs: BulkUploadJob[] = jobsArray.map((apiJob: Record<string, unknown>) => ({
              id: String(apiJob.job_id || apiJob.id),
              status: String(apiJob.status || "pending") as BulkUploadJob['status'],
              job_type: String(apiJob.job_type || "annual") as BulkUploadJob['job_type'],
              original_filename: String(apiJob.filename || apiJob.original_filename || "unknown.csv"),
              file_size: typeof apiJob.file_size === 'number' ? apiJob.file_size : undefined,
              total_rows: Number(apiJob.total_records || apiJob.total_rows || 0),
              processed_rows: Number(apiJob.processed_records || apiJob.processed_rows || 0),
              successful_rows: Number(apiJob.successful_predictions || apiJob.successful_rows || 0),
              failed_rows: Number(apiJob.failed_predictions || apiJob.failed_rows || 0),
              progress_percentage: Number(apiJob.progress || apiJob.progress_percentage || 0),
              created_at: String(apiJob.created_at || new Date().toISOString()),
              started_at: apiJob.started_at ? String(apiJob.started_at) : undefined,
              completed_at: apiJob.completed_at ? String(apiJob.completed_at) : undefined,
              error_message: Array.isArray(apiJob.errors) ? String(apiJob.errors[0]) : String(apiJob.error_message || ''),
              error_details: apiJob.error_details as string | Record<string, unknown> | undefined,
              celery_task_id: apiJob.celery_task_id ? String(apiJob.celery_task_id) : undefined,
              celery_status: apiJob.celery_status ? String(apiJob.celery_status) : undefined,
              celery_meta: apiJob.celery_meta as Record<string, unknown> | undefined,
              estimated_time_minutes: typeof apiJob.estimated_time_minutes === 'number' ? apiJob.estimated_time_minutes : undefined,
              // New fields from API response
              estimated_completion: apiJob.estimated_completion ? String(apiJob.estimated_completion) : undefined,
              queue_priority: apiJob.queue_priority ? String(apiJob.queue_priority) : undefined,
              queue_position: typeof apiJob.queue_position === 'number' ? apiJob.queue_position : undefined,
              current_worker_capacity: typeof apiJob.current_worker_capacity === 'number' ? apiJob.current_worker_capacity : undefined,
              system_load: apiJob.system_load ? String(apiJob.system_load) : undefined,
              processing_rate: apiJob.processing_rate ? String(apiJob.processing_rate) : undefined,
            }));

            console.log('✅ Mapped jobs:', jobs.map(j => ({
              id: j.id.substring(0, 8),
              status: j.status,
              filename: j.original_filename,
              progress: j.progress_percentage
            })))

            set({ jobs });
            console.log(`📋 Fetched ${jobs.length} bulk upload jobs`);

            // Start auto-polling for any active jobs
            const activeJobs = jobs.filter(
              (job) =>
                job.status === "pending" ||
                job.status === "queued" ||
                job.status === "processing"
            );

            if (activeJobs.length > 0 && !get().isPolling) {
              console.log(
                `🔄 Starting auto-polling for ${activeJobs.length} active jobs`
              );
              get().startAutoPolling();
            }
          }
        } catch (error: unknown) {
          console.error("❌ Failed to fetch jobs:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch jobs";
          set({ error: errorMessage });
        }
      },

      // Add auto-polling method
      startAutoPolling: () => {
        const { isPolling, pollingIntervalId } = get();

        if (isPolling || pollingIntervalId) {
          return; // Already polling
        }

        console.log("🔄 Starting auto-polling for job updates");

        const intervalId = setInterval(async () => {
          const { jobs } = get();
          const activeJobs = jobs.filter(
            (job) =>
              job.status === "pending" ||
              job.status === "queued" ||
              job.status === "processing"
          );

          if (activeJobs.length === 0) {
            console.log("✅ No active jobs, stopping auto-polling");
            get().stopJobPolling();
            return;
          }

          // Refresh all jobs to get latest status
          await get().fetchAllJobs();
        }, 3000); // Poll every 3 seconds

        set({
          isPolling: true,
          pollingIntervalId: intervalId,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        get().stopJobPolling();
        set(initialState);
      },

      // Helper methods
      getJobById: (jobId: string) => {
        return get().jobs.find((job) => job.id === jobId) || null;
      },

      getActiveJobs: () => {
        return get().jobs.filter(
          (job) =>
            job.status === "pending" ||
            job.status === "queued" ||
            job.status === "processing"
        );
      },

      getCompletedJobs: () => {
        return get().jobs.filter((job) => job.status === "completed");
      },

      getFailedJobs: () => {
        return get().jobs.filter((job) => job.status === "failed");
      },

      // Job management methods
      canDeleteJob: (job: BulkUploadJob) => {
        // Can delete any job except those currently processing
        return job.status !== "processing";
      },

      deleteJob: async (jobId: string) => {
        console.log(`🗑️ Attempting to delete job: ${jobId}`);

        const job = get().getJobById(jobId);
        if (!job) {
          console.error(`❌ Job not found: ${jobId}`);
          set({ error: "Job not found" });
          return false;
        }

        // Check if job can be deleted
        if (!get().canDeleteJob(job)) {
          const errorMsg =
            "Cannot delete job that is currently processing. Please cancel it first.";
          console.error(`❌ ${errorMsg}`);
          set({ error: errorMsg });
          return false;
        }

        try {
          const response = await predictionsApi.jobs.deleteJob(jobId);

          if (response.success) {
            // Remove job from store
            set((state) => ({
              jobs: state.jobs.filter((j) => j.id !== jobId),
              activeJob: state.activeJob?.id === jobId ? null : state.activeJob,
              error: null,
            }));

            console.log(`✅ Successfully deleted job: ${jobId}`);
            return true;
          } else {
            const errorMsg =
              typeof response.error === "string"
                ? response.error
                : response.error?.message || "Failed to delete job";
            console.error(`❌ Delete failed: ${errorMsg}`);
            set({ error: errorMsg });
            return false;
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error occurred";
          console.error(`❌ Error deleting job:`, error);
          set({ error: errorMsg });
          return false;
        }
      },

      cancelJob: async (jobId: string) => {
        console.log(`🛑 Attempting to cancel job: ${jobId}`);

        const job = get().getJobById(jobId);
        if (!job) {
          console.error(`❌ Job not found: ${jobId}`);
          set({ error: "Job not found" });
          return false;
        }

        // Only processing jobs can be cancelled
        if (job.status !== "processing") {
          const errorMsg = `Job is ${job.status}, only processing jobs can be cancelled`;
          console.error(`❌ ${errorMsg}`);
          set({ error: errorMsg });
          return false;
        }

        try {
          const response = await predictionsApi.jobs.cancelJob(jobId);

          if (response.success) {
            // Update job status to cancelled/failed
            set((state) => ({
              jobs: state.jobs.map((j) =>
                j.id === jobId
                  ? {
                      ...j,
                      status: "failed" as const,
                      error_message: "Cancelled by user",
                    }
                  : j
              ),
              error: null,
            }));

            console.log(`✅ Successfully cancelled job: ${jobId}`);

            // Refresh job status to get updated info
            await get().refreshJobStatus(jobId);
            return true;
          } else {
            const errorMsg =
              typeof response.error === "string"
                ? response.error
                : response.error?.message || "Failed to cancel job";
            console.error(`❌ Cancel failed: ${errorMsg}`);
            set({ error: errorMsg });
            return false;
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error occurred";
          console.error(`❌ Error cancelling job:`, error);
          set({ error: errorMsg });
          return false;
        }
      },

      // Debug helper function
      testJobStatus: async (jobId: string) => {
        console.log(`🔍 Testing job status for ID: ${jobId}`);
        try {
          const response = await predictionsApi.jobs.getJobStatus(jobId);
          console.log(`📡 Response:`, response);
          return response;
        } catch (error) {
          console.error(`❌ Error testing job status:`, error);
          return { success: false, error: error };
        }
      },

      // Debug helper to list all jobs from API
      testListJobs: async () => {
        console.log(`📋 Testing list jobs API`);
        try {
          const response = await predictionsApi.jobs.listJobs({
            limit: 10,
            offset: 0,
          });
          console.log(`📡 List jobs response:`, response);
          return response;
        } catch (error) {
          console.error(`❌ Error listing jobs:`, error);
          return { success: false, error: error };
        }
      },
    }),
    {
      name: "bulk-upload-store",
      partialize: (state) => ({
        jobs: state.jobs,
        // Don't persist polling state or active job
      }),
    }
  )
);
