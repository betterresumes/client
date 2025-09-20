import type { BaseEntity, JobStatus } from './common'
import type { PredictionResult } from './prediction'

// Job request types
export interface JobParams {
  page?: number
  limit?: number
  search?: string
  status?: JobStatus
  jobType?: string
  startDate?: string
  endDate?: string
  userId?: string
  organizationId?: string
  sortBy?: 'createdAt' | 'startedAt' | 'completedAt' | 'progress' | 'status'
  sortOrder?: 'asc' | 'desc'
}

// Main job type (alias for BulkJob)
export interface Job extends BulkJob { }

// Background job types
export interface BulkJob extends BaseEntity {
  fileName: string
  fileSize: number
  status: JobStatus
  progress: number
  totalRecords: number
  processedRecords: number
  successfulRecords: number
  failedRecords: number
  errorMessage?: string
  startedAt?: string
  completedAt?: string
  userId: string
  organizationId?: string
  modelType: 'annual' | 'quarterly'
}

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
  totalProcessed: number
  successful: number
  failed: number
  averageRisk: number
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  processingTime: number
}

export interface JobProgress {
  jobId: string
  status: JobStatus
  progress: number
  message?: string
  estimatedTimeRemaining?: number
}

export interface CreateJobRequest {
  fileName: string
  fileSize: number
  modelType: 'annual' | 'quarterly'
  organizationId?: string
}
