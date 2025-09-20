import type { BaseEntity, JobStatus, PaginatedResponse } from './common'
import type { PredictionResult } from './prediction'

// Job types for bulk upload operations
export interface BulkJob extends BaseEntity {
  file_name: string
  file_size: number
  status: JobStatus
  progress: number
  total_records: number
  processed_records: number
  successful_records: number
  failed_records: number
  error_message?: string
  started_at?: string
  completed_at?: string
  user_id: string
  organization_id?: string
  tenant_id?: string
  model_type: 'annual' | 'quarterly'
}

// Job result types
export interface JobResult {
  job: BulkJob
  predictions?: PredictionResult[]
  errors?: JobError[]
  summary?: JobSummary
}

export interface JobError {
  row: number
  field?: string
  message: string
  value?: any
}

export interface JobSummary {
  total_processed: number
  successful: number
  failed: number
  average_risk: number
  risk_distribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  processing_time: number
}

export interface JobProgress {
  job_id: string
  status: JobStatus
  progress: number
  current_step?: string
  total_steps?: number
  estimated_time_remaining?: number
  processed_items?: number
  total_items?: number
  message?: string
  errors?: Array<{ message: string; details?: any }>
}

// API request types
export interface JobParams {
  status?: JobStatus
  limit?: number     // default: 50
  offset?: number    // default: 0
  page?: number
  search?: string
  job_type?: string
  start_date?: string
  end_date?: string
  user_id?: string
  organization_id?: string
  sort_by?: 'created_at' | 'started_at' | 'completed_at' | 'progress' | 'status'
  sort_order?: 'asc' | 'desc'
}

// Job creation request
export interface CreateJobRequest {
  file_name: string
  file_size: number
  model_type: 'annual' | 'quarterly'
  organization_id?: string
}

// Response types
export type Job = BulkJob
export type JobListResponse = PaginatedResponse<Job>

// Job logs
export interface JobLogEntry {
  timestamp: string
  level: string
  message: string
  details?: any
}

export interface JobLogsResponse {
  logs: JobLogEntry[]
  total_count: number
}

export interface JobLogsParams {
  level?: 'debug' | 'info' | 'warning' | 'error'
  limit?: number
  offset?: number
}

// Job results
export interface JobResultsResponse {
  results: any
  summary?: {
    total_processed: number
    success_count: number
    error_count: number
    warnings?: string[]
  }
  download_url?: string
}

// Job statistics
export interface JobStatsResponse {
  total_jobs: number
  active_jobs: number
  completed_jobs: number
  failed_jobs: number
  average_execution_time: number
  jobs_by_type: Record<string, number>
  jobs_by_status: Record<string, number>
  recent_activity: Array<{
    date: string
    completed: number
    failed: number
  }>
}

// Bulk operations
export interface BulkJobOperation {
  job_ids: string[]
}

export interface BulkJobOperationResponse {
  cancelled?: string[]
  deleted?: string[]
  failed: Array<{ id: string; error: string }>
}
