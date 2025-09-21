// Test file to verify job store functionality
import { useJobStore } from '@/lib/stores/job-store'

const testJobStore = () => {
  const { createJob, updateJobProgress, completeJob, getJobStatus } = useJobStore.getState()

  // Create a test job
  const jobId = 'test_job_123'
  createJob(jobId, 'test_file.csv', 3, 'quarterly')

  // Check if job was created
  const job = getJobStatus(jobId)
  console.log('Created job:', job)

  // Update progress
  updateJobProgress(jobId, 50, 2)
  const updatedJob = getJobStatus(jobId)
  console.log('Updated job:', updatedJob)

  // Complete job
  const mockResult = {
    id: jobId,
    fileName: 'test_file.csv',
    totalCompanies: 3,
    processedCompanies: 3,
    successfulPredictions: 3,
    failedPredictions: 0,
    predictionType: 'quarterly' as const,
    results: [
      {
        company_symbol: 'AAPL',
        company_name: 'Apple Inc.',
        default_probability: 0.05,
        risk_category: 'LOW',
        status: 'success' as const
      }
    ],
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    duration: '2 seconds'
  }

  completeJob(jobId, mockResult)
  const completedJob = getJobStatus(jobId)
  console.log('Completed job:', completedJob)
}

// Export for manual testing
export default testJobStore
