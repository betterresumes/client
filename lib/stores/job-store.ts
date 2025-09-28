import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { predictionsApi } from '@/lib/api/predictions';

export interface Job {
  id: string;
  fileName: string;
  startTime: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTimeMinutes?: number;
  totalRows?: number;
  jobResult?: {
    summary?: {
      total_companies?: number;
      successful_predictions?: number;
      failed_predictions?: number;
    };
    results?: any[];
  };
}

interface JobState {
  jobs: Job[];
  createJob: (fileName: string) => string;
  updateJobFromAPI: (jobId: string) => Promise<void>;
  deleteJob: (jobId: string) => void;
  clearJobs: () => void;
  getRecentJobs: () => Job[];
  hasActiveJobs: () => boolean;
}

export const useJobStore = create<JobState>()(
  devtools(
    (set, get) => ({
      jobs: [],

      createJob: (fileName: string) => {
        const jobId = Date.now().toString();
        const newJob: Job = {
          id: jobId,
          fileName,
          startTime: new Date(),
          status: 'pending',
          progress: 0,
        };

        set((state) => ({
          jobs: [newJob, ...state.jobs],
        }));

        return jobId;
      },

      updateJobFromAPI: async (jobId: string) => {
        try {
          // FIXED: Use jobs list endpoint instead of individual status endpoint
          const listResponse = await predictionsApi.jobs.listJobs({ limit: 50, offset: 0 });

          let status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
          let progress = 0;
          let jobResult: Job['jobResult'] = undefined;

          if (listResponse.success) {
            // Find the specific job in the list
            const jobsArray = listResponse.data?.jobs || listResponse.data?.items || listResponse.data || []
            const jobData = jobsArray.find((job: any) => (job.job_id || job.id) === jobId)

            if (jobData) {
              status = jobData.status || 'pending';
              progress = jobData.progress_percentage || jobData.progress || 0;

              // If completed, try to get results
              if (status === 'completed') {
                jobResult = {
                  summary: jobData.summary,
                  results: jobData.results
                };
              }
            }
          }

          set((state) => ({
            jobs: state.jobs.map((job) =>
              job.id === jobId ? { ...job, status, progress, jobResult } : job
            ) as Job[],
          }));

          // Auto-delete failed jobs after 30 seconds
          if (status === 'failed') {
            setTimeout(() => {
              get().deleteJob(jobId);
            }, 30000);
          }

        } catch (error) {
          console.error('Failed to update job from API:', error);
          set((state) => ({
            jobs: state.jobs.map((job) =>
              job.id === jobId ? { ...job, status: 'failed' as const } : job
            ),
          }));
        }
      },

      deleteJob: (jobId: string) => {
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== jobId),
        }));
      },

      clearJobs: () => {
        set({ jobs: [] });
      },

      getRecentJobs: () => {
        const jobs = get().jobs;
        return jobs
          .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
          .slice(0, 3);
      },

      hasActiveJobs: () => {
        return get().jobs.some(job => job.status === 'pending' || job.status === 'processing');
      },
    }),
    {
      name: 'job-store',
    }
  )
);
