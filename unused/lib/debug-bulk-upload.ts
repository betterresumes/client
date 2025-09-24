// Debug utilities for bulk upload testing
// Add this to your browser console for debugging

import { useBulkUploadStore } from '@/lib/stores/bulk-upload-store'

// Make debug functions available globally for testing
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.debugBulkUpload = {
    // Test job status for a specific job ID
    testJobStatus: async (jobId: string) => {
      const store = useBulkUploadStore.getState()
      return await store.testJobStatus(jobId)
    },

    // List all jobs from API
    testListJobs: async () => {
      const store = useBulkUploadStore.getState()
      return await store.testListJobs()
    },

    // Show current jobs in store
    showCurrentJobs: () => {
      const store = useBulkUploadStore.getState()
      console.log('📋 Current jobs in store:', store.jobs)
      return store.jobs
    },

    // Show active job
    showActiveJob: () => {
      const store = useBulkUploadStore.getState()
      console.log('🎯 Active job:', store.activeJob)
      return store.activeJob
    },

    // Force refresh all jobs
    refreshJobs: async () => {
      const store = useBulkUploadStore.getState()
      await store.fetchAllJobs()
      console.log('🔄 Jobs refreshed')
    },

    // Clear all jobs (for testing)
    clearJobs: () => {
      const store = useBulkUploadStore.getState()
      store.reset()
      console.log('🗑️ All jobs cleared')
    }
  }

  console.log('🛠️ Bulk upload debug tools loaded! Use window.debugBulkUpload.*')
}

export { }
