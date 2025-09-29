'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnnualPredictionRequest, QuarterlyPredictionRequest } from '@/lib/types/prediction'
import { useCreatePredictionMutations } from '@/hooks/use-prediction-mutations'
import { usePredictionMutations } from '@/hooks/use-prediction-edit-mutations'
import { predictionsApi } from '@/lib/api/predictions'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { useJobStore } from '@/lib/stores/job-store'
import { useBulkUploadStore } from '@/lib/stores/bulk-upload-store'
import { IndividualAnalysisForm } from './analysis/individual-analysis-form'
import { CompanyAnalysisPanel } from './company-analysis-panel'
import { ProcessingSteps } from './processing-steps'
import { EmptyAnalysisState } from './empty-analysis-state'
import { formatApiError } from '@/lib/utils/error-formatting'
import { SAMPLE_DATA } from '@/lib/config/sectors'
import { BulkUploadSection } from './analysis/bulk-upload-section-new'
import { JobStatusContainer } from './job-status-display'
import { JobResultsDialog } from './job-results-dialog'
import { jobsApi } from '@/lib/api/jobs'
import { Loader2, Download, Trash2, X, FileSpreadsheet, ChevronDown, ChevronUp, Eye } from 'lucide-react'

// Simple Jobs Display Component - Just jobs, no upload widget integration
function SimpleJobsDisplaySection({
  jobs,
  bulkJobs,
  hasActiveJobs,
  onDeleteBulkJob,
  onCancelBulkJob,
  canDeleteJob,
  onViewResults,
  onDownloadExcel
}: {
  jobs: any[]
  bulkJobs: any[]
  hasActiveJobs: () => boolean
  onDeleteBulkJob: (jobId: string, filename: string) => void
  onCancelBulkJob: (jobId: string, filename: string) => void
  canDeleteJob: (job: any) => boolean
  onViewResults?: (jobId: string, filename?: string) => void
  onDownloadExcel?: (jobId: string, filename?: string) => void
}) {
  const [showAllJobs, setShowAllJobs] = useState(false)

  // Combine and sort jobs (most recent first)
  const allJobs = [...bulkJobs].sort((a, b) =>
    new Date(b.created_at || b.startTime || 0).getTime() -
    new Date(a.created_at || a.startTime || 0).getTime()
  )

  const displayedJobs = showAllJobs ? allJobs : allJobs.slice(0, 8)
  const hasMoreJobs = allJobs.length > 8

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analysis Jobs
            </h3>
            {(hasActiveJobs() || bulkJobs.some(job => job.status === 'processing' || job.status === 'pending')) && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-600 font-medium">Active</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track progress and view results ({allJobs.length} total)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasMoreJobs && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllJobs(!showAllJobs)}
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
            >
              {showAllJobs ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show All ({allJobs.length})
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Individual Analysis Jobs */}
      {jobs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Recent Jobs
          </h4>
          <JobStatusContainer />
        </div>
      )}

      {/* Bulk Upload Jobs */}
      {displayedJobs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Bulk Upload Jobs
          </h4>

          {/* Grid Layout - Better space utilization */}
          <div className={`grid gap-4 ${showAllJobs
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
            {displayedJobs.map((bulkJob) => (
              <JobCard
                key={bulkJob.id}
                job={bulkJob}
                onDelete={onDeleteBulkJob}
                onCancel={onCancelBulkJob}
                canDelete={canDeleteJob}
                isCompact={showAllJobs}
                onViewResults={onViewResults}
                onDownloadExcel={onDownloadExcel}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact Job Card Component
function JobCard({
  job,
  onDelete,
  onCancel,
  canDelete,
  isCompact,
  onViewResults,
  onDownloadExcel
}: {
  job: any
  onDelete: (jobId: string, filename: string) => void
  onCancel: (jobId: string, filename: string) => void
  canDelete: (job: any) => boolean
  isCompact: boolean
  onViewResults?: (jobId: string, filename?: string) => void
  onDownloadExcel?: (jobId: string, filename?: string) => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'failed': return 'bg-red-50 text-red-700 border-red-200'
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500'
      case 'failed': return 'bg-red-500'
      case 'processing': return 'bg-blue-500'
      case 'pending': return 'bg-amber-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card className="group border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 transition-all duration-200 bg-white dark:bg-gray-800">
      <div className="p-4 space-y-3">
        {/* Header with Status and Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className={`text-xs font-medium border ${getStatusColor(job.status)} ${job.status === 'processing' ? 'animate-pulse' : ''
                  }`}
              >
                {job.status === 'processing' ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing
                  </div>
                ) : (
                  job.status.charAt(0).toUpperCase() + job.status.slice(1)
                )}
              </Badge>
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-gray-200">
                {job.job_type?.toUpperCase() || 'BULK'}
              </Badge>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
              {job.original_filename}
            </h4>
          </div>


        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {job.progress_percentage}% Complete
            </span>
            <span className="text-xs text-gray-500">
              {job.processed_rows || 0}/{job.total_rows || 0}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${getProgressBarColor(job.status)} ${job.status === 'processing' ? 'animate-pulse' : ''
                }`}
              style={{ width: `${Math.max(job.progress_percentage || 0, 2)}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs">
            {job.successful_rows > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                {job.successful_rows}
              </span>
            )}
            {job.failed_rows > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <div className="h-1 w-1 bg-red-500 rounded-full"></div>
                {job.failed_rows}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* View Results Icon */}
            {job.status === 'completed' && onViewResults && (
              <Button
                onClick={() => onViewResults(job.id, job.original_filename)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="View Results"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            {/* Download Excel Icon */}
            {job.status === 'completed' && onDownloadExcel && (
              <Button
                onClick={() => onDownloadExcel(job.id, job.original_filename)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Export CSV"
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
            {/* Cancel Job Icon - for processing jobs */}
            {job.status === 'processing' && (
              <Button
                onClick={() => onCancel(job.id, job.original_filename)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="Cancel Job"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {/* Delete Job Icon */}
            {canDelete(job) && (
              <Button
                onClick={() => onDelete(job.id, job.original_filename)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="Delete Job"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {job.error_message && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-xs text-red-700 dark:text-red-400 line-clamp-2">
              {job.error_message}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

// Helper function to format error messages for better user experience
const formatErrorMessage = (error: any, fallbackMessage: string): string => {
  return formatApiError(error, fallbackMessage)
}

export function CustomAnalysisView() {
  const { prefilledData, clearPrefilledData } = useDashboardStore()
  const { createJob, updateJobFromAPI, deleteJob, hasActiveJobs, jobs } = useJobStore()
  const {
    jobs: bulkJobs,
    fetchAllJobs: fetchBulkJobs,
    deleteJob: deleteBulkJob,
    cancelJob: cancelBulkJob,
    canDeleteJob
  } = useBulkUploadStore()
  const [activeTab, setActiveTab] = useState('individual')
  const [predictionType, setPredictionType] = useState<'annual' | 'quarterly'>('annual')
  const [showResults, setShowResults] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  // Job Results Dialog states
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [selectedJobName, setSelectedJobName] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editMode, setEditMode] = useState<{ isEditing: boolean; predictionId: string | null }>({
    isEditing: false,
    predictionId: null
  })

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)

  // File upload states - separate for annual and quarterly
  const [uploadedFiles, setUploadedFiles] = useState<{
    annual: File | null
    quarterly: File | null
  }>({
    annual: null,
    quarterly: null
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadQueue, setUploadQueue] = useState<Array<{
    id: string
    file: File
    progress: number
    status: 'uploading' | 'completed' | 'error'
    error?: string
  }>>([])
  const [processingFiles, setProcessingFiles] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel?: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  })

  const [analysisResults, setAnalysisResults] = useState<{
    company: {
      id: string
      name: string
      subtitle: string
      sector: string
      defaultRate: string
      riskCategory: string
    }
    predictions: any[]
  } | null>(null)

  // Form data states (supports both annual and quarterly)
  const [formData, setFormData] = useState({
    stockSymbol: '',
    marketCap: '',
    companyName: '',
    sector: '',
    reportingYear: '2024',
    reportingQuarter: 'Q1',

    // Annual model ratios (5 ratios)
    ebitInterestExpense: '',
    totalDebtEbitda: '',
    returnOnAssets: '',
    netIncomeMargin: '',
    longTermDebtTotalCapital: '',

    // Quarterly model ratios (4 ratios)
    sgaMargin: '',
    returnOnCapital: ''
  })

  const {
    createAnnualPredictionMutation,
    createQuarterlyPredictionMutation,
    bulkUploadMutation
  } = useCreatePredictionMutations()

  const { updatePredictionMutation } = usePredictionMutations()

  // Handle prefilled data from edit action
  useEffect(() => {
    if (prefilledData) {
      const data = prefilledData

      // Set prediction type
      if (data.predictionType) {
        setPredictionType(data.predictionType)
      }

      // Set edit mode if this data has an ID (indicating it's an existing prediction)
      if (data.id) {
        setEditMode({
          isEditing: true,
          predictionId: data.id
        })
      } else {
        setEditMode({
          isEditing: false,
          predictionId: null
        })
      }

      // Prefill form data
      setFormData({
        stockSymbol: data.company_symbol || '',
        companyName: data.company_name || '',
        sector: data.sector || '',
        marketCap: data.market_cap?.toString() || '',
        reportingYear: data.reporting_year || '2024',
        reportingQuarter: data.reporting_quarter || 'Q1',

        // Annual ratios
        longTermDebtTotalCapital: data.long_term_debt_to_total_capital?.toString() || '',
        totalDebtEbitda: data.total_debt_to_ebitda?.toString() || '',
        netIncomeMargin: data.net_income_margin?.toString() || '',
        ebitInterestExpense: data.ebit_to_interest_expense?.toString() || '',
        returnOnAssets: data.return_on_assets?.toString() || '',

        // Quarterly ratios
        sgaMargin: data.sga_margin?.toString() || '',
        returnOnCapital: data.return_on_capital?.toString() || ''
      })

      // Show appropriate message based on edit mode
      if (data.id) {
        toast.info(`Editing ${data.company_symbol} - Update existing prediction`, {
          duration: 4000
        })
      } else {
        toast.info(`Editing ${data.company_symbol} - Modify values as needed and create new prediction`, {
          duration: 4000
        })
      }

      // Clear prefilled data after using it
      clearPrefilledData()
    }
  }, [prefilledData, clearPrefilledData])

  // Fetch bulk upload jobs when component mounts
  useEffect(() => {
    fetchBulkJobs()
  }, [fetchBulkJobs])

  // Clear upload progress when switching prediction types
  useEffect(() => {
    // Clear any ongoing upload states when switching types
    if (isUploading) {
      setUploadProgress(0)
    }
    // Clear upload results to prevent showing stale data
    setUploadResults(null)
  }, [predictionType])

  // Handle form submission for individual analysis
  const handleAnalysis = async () => {
    // Disable button immediately when clicked
    setIsSubmitting(true)

    if (!formData.stockSymbol || !formData.companyName || !formData.sector || !formData.marketCap) {
      toast.error('Please fill in all required fields')
      setIsSubmitting(false)
      return
    }

    // Clear any previous error message
    // Start processing simulation
    await simulateProcessing()

    if (predictionType === 'annual') {
      const requestData: AnnualPredictionRequest = {
        company_symbol: formData.stockSymbol,
        company_name: formData.companyName,
        market_cap: parseFloat(formData.marketCap),
        sector: formData.sector,
        reporting_year: formData.reportingYear,
        reporting_quarter: formData.reportingQuarter || undefined,
        long_term_debt_to_total_capital: parseFloat(formData.longTermDebtTotalCapital) || 0,
        total_debt_to_ebitda: parseFloat(formData.totalDebtEbitda) || 0,
        net_income_margin: parseFloat(formData.netIncomeMargin) || 0,
        ebit_to_interest_expense: parseFloat(formData.ebitInterestExpense) || 0,
        return_on_assets: parseFloat(formData.returnOnAssets) || 0,
      }

      if (editMode.isEditing && editMode.predictionId) {
        // Update existing prediction
        updatePredictionMutation.mutate({
          id: editMode.predictionId,
          data: requestData,
          type: 'annual'
        }, {
          onSuccess: (results) => {
            // Format the API response for CompanyAnalysisPanel
            const predictionData = results.data?.prediction || results.data || results

            // Add null check to prevent errors
            if (!predictionData) {
              toast.error('No prediction data received from server')
              setIsProcessing(false)
              return
            }

            const formattedResults = {
              company: {
                id: predictionData?.company_symbol || formData.stockSymbol,
                name: predictionData?.company_symbol || formData.stockSymbol,
                subtitle: predictionData?.company_name || formData.companyName,
                sector: predictionData?.sector || formData.sector,
                defaultRate: `${((predictionData?.ensemble_probability || predictionData?.probability || 0) * 100).toFixed(2)}%`,
                riskCategory: predictionData?.risk_level || 'MEDIUM'
              },
              predictions: [predictionData]
            }

            setTimeout(() => {
              setAnalysisResults(formattedResults)
              setShowResults(true)
              setIsProcessing(false)
              setIsSubmitting(false)
              setProcessingStep(0)
              // Clear edit mode after successful update
              setEditMode({ isEditing: false, predictionId: null })
            }, 500)
            toast.success('Annual prediction updated successfully!')
          },
          onError: (error: any) => {
            setIsProcessing(false)
            setIsSubmitting(false)
            setIsSubmitting(false)
            setProcessingStep(0)
            const rawErrorMessage = error?.response?.data?.detail || error?.message || 'Update failed. Please try again.'
            const formattedErrorMessage = formatErrorMessage(error, 'Update failed. Please try again.')
            toast.error(formattedErrorMessage)
          }
        })
      } else {
        // Create new prediction
        createAnnualPredictionMutation.mutate(requestData, {
          onSuccess: (results) => {
            // Check if the mutation actually succeeded (no API errors)
            if (!results?.response?.data?.prediction && !results?.response?.data) {
              // API error occurred but was not caught by onError
              const errorMsg = 'Prediction creation failed - invalid response from server'
              setIsProcessing(false)
              setIsSubmitting(false)
              setProcessingStep(0)
              toast.error(errorMsg)
              return
            }

            // Format the API response for CompanyAnalysisPanel
            // API returns: { prediction: { ... } }
            const predictionData = results.response?.data?.prediction || results.response?.data

            // Add null check to prevent errors
            if (!predictionData) {
              toast.error('No prediction data received from server')
              setIsProcessing(false)
              setIsSubmitting(false)
              setProcessingStep(0)
              return
            }

            const formattedResults = {
              company: {
                id: predictionData.company_symbol || formData.stockSymbol,
                name: predictionData.company_symbol || formData.stockSymbol,
                subtitle: predictionData.company_name || formData.companyName,
                sector: predictionData.sector || formData.sector,
                defaultRate: `${((predictionData.ensemble_probability || predictionData.probability || 0) * 100).toFixed(2)}%`,
                riskCategory: predictionData.risk_level || 'MEDIUM'
              },
              predictions: [predictionData] // Wrap single result in array
            }

            // Complete the processing - no step 5, just finish
            setTimeout(() => {
              setAnalysisResults(formattedResults)
              setShowResults(true)
              setIsProcessing(false)
              setIsSubmitting(false)
              setProcessingStep(0)

              // IMMEDIATE: Trigger dashboard refresh events (but don't switch tabs)


              // Just trigger the refresh events, user can switch tabs when they want
              window.dispatchEvent(new CustomEvent('prediction-created-stay-here'))

            }, 500)
            toast.success('Annual analysis completed successfully!', {
              description: 'Your prediction has been added to the dashboard and is ready to view.',
              duration: 4000
            })
          },
          onError: (error: any) => {
            setIsProcessing(false)
            setIsSubmitting(false)
            setIsSubmitting(false)
            setProcessingStep(0)
            // Extract error message from API response
            const rawErrorMessage = error?.response?.data?.detail || error?.message || 'Analysis failed. Please try again.'

            // Format user-friendly error messages
            const formattedErrorMessage = formatErrorMessage(error, 'Analysis failed. Please try again.')
            toast.error(formattedErrorMessage)
          }
        })
      }
    } else {
      const requestData: QuarterlyPredictionRequest = {
        company_symbol: formData.stockSymbol,
        company_name: formData.companyName,
        market_cap: parseFloat(formData.marketCap),
        sector: formData.sector,
        reporting_year: formData.reportingYear,
        reporting_quarter: formData.reportingQuarter,
        total_debt_to_ebitda: parseFloat(formData.totalDebtEbitda) || 0,
        sga_margin: parseFloat(formData.sgaMargin) || 0,
        long_term_debt_to_total_capital: parseFloat(formData.longTermDebtTotalCapital) || 0,
        return_on_capital: parseFloat(formData.returnOnCapital) || 0,
      }

      if (editMode.isEditing && editMode.predictionId) {
        // Update existing quarterly prediction with enhanced response
        updatePredictionMutation.mutate({
          id: editMode.predictionId,
          data: requestData,
          type: 'quarterly'
        }, {
          onSuccess: (results) => {
            const predictionData = results.data?.prediction || results.data || results

            // Add null check to prevent errors
            if (!predictionData) {
              toast.error('No prediction data received from server')
              setIsProcessing(false)
              setIsSubmitting(false)
              setProcessingStep(0)
              return
            }



            // Format the API response for CompanyAnalysisPanel
            const formattedResults = {
              company: {
                id: predictionData.company_symbol || formData.stockSymbol,
                name: predictionData.company_symbol || formData.stockSymbol,
                subtitle: predictionData.company_name || formData.companyName,
                sector: predictionData.input_data?.sector || predictionData.sector || formData.sector,
                defaultRate: `${((predictionData.output_data?.ensemble_probability || predictionData.ensemble_probability || predictionData.probability || 0) * 100).toFixed(2)}%`,
                riskCategory: predictionData.output_data?.risk_level || predictionData.risk_level || 'MEDIUM'
              },
              predictions: [predictionData], // Wrap single result in array
              // Include enhanced data for debugging/logging
              enhancedData: {
                inputRatios: predictionData.input_data?.financial_ratios,
                outputMetrics: predictionData.output_data,
                isEnhanced: !!predictionData.input_data
              }
            }

            setTimeout(() => {
              setAnalysisResults(formattedResults)
              setShowResults(true)
              setIsProcessing(false)
              setIsSubmitting(false)
              setIsSubmitting(false)
              setProcessingStep(0)
              // Clear edit mode after successful update
              setEditMode({ isEditing: false, predictionId: null })
            }, 500)
            toast.success('Quarterly prediction updated with complete input/output data! 🎉')
          },
          onError: (error: any) => {
            setIsProcessing(false)
            setIsSubmitting(false)
            setIsSubmitting(false)
            setProcessingStep(0)
            const rawErrorMessage = error?.response?.data?.detail || error?.message || 'Update failed. Please try again.'
            const formattedErrorMessage = formatErrorMessage(error, 'Update failed. Please try again.')
            toast.error(formattedErrorMessage)
          }
        })
      } else {
        // Create new quarterly prediction
        createQuarterlyPredictionMutation.mutate(requestData, {
          onSuccess: (results) => {
            // Check if the mutation actually succeeded (no API errors)
            if (!results?.response?.data?.prediction && !results?.response?.data) {
              // API error occurred but was not caught by onError
              const errorMsg = 'Prediction creation failed - invalid response from server'
              setIsProcessing(false)
              setIsSubmitting(false)
              setProcessingStep(0)
              toast.error(errorMsg)
              return
            }

            // Format the API response for CompanyAnalysisPanel
            // API returns: { prediction: { ... } }
            const predictionData = results.response?.data?.prediction || results.response?.data

            // Add null check to prevent errors
            if (!predictionData) {
              toast.error('No prediction data received from server')
              setIsProcessing(false)
              setIsSubmitting(false)
              setProcessingStep(0)
              return
            }

            const formattedResults = {
              company: {
                id: predictionData.company_symbol || formData.stockSymbol,
                name: predictionData.company_symbol || formData.stockSymbol,
                subtitle: predictionData.company_name || formData.companyName,
                sector: predictionData.sector || formData.sector,
                defaultRate: `${((predictionData.ensemble_probability || predictionData.probability || 0) * 100).toFixed(2)}%`,
                riskCategory: predictionData.risk_level || 'MEDIUM'
              },
              predictions: [predictionData] // Wrap single result in array
            }

            // Complete the processing - no step 5, just finish
            setTimeout(() => {
              setAnalysisResults(formattedResults)
              setShowResults(true)
              setIsProcessing(false)
              setIsSubmitting(false)
              setProcessingStep(0)

              // IMMEDIATE: Trigger dashboard refresh events (but don't switch tabs)


              // Just trigger the refresh events, user can switch tabs when they want
              window.dispatchEvent(new CustomEvent('prediction-created-stay-here'))

            }, 500)
            toast.success('Quarterly analysis completed successfully!', {
              description: 'Your prediction has been added to the dashboard and is ready to view.',
              duration: 4000
            })
          },
          onError: (error: any) => {
            setIsProcessing(false)
            setIsSubmitting(false)
            setProcessingStep(0)
            // Extract error message from API response
            const rawErrorMessage = error?.response?.data?.detail || error?.message || 'Analysis failed. Please try again.'

            // Format user-friendly error messages
            const formattedErrorMessage = formatErrorMessage(error, 'Analysis failed. Please try again.')
            toast.error(formattedErrorMessage)
          }
        })
      }
    }
  }

  // Handle file upload - Two-step process: Upload first, then confirm to run analysis
  const handleFileUpload = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ]

    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid Excel (.xlsx, .xls) or CSV file')
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    // Step 1: Just upload the file and show preview
    setCurrentUploadedFile(file)
    toast.success(`File "${file.name}" uploaded and ready for ${predictionType} analysis!`)

    // Count rows for better estimation
    if (file.type === 'text/csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim().length > 0)
          const actualCount = Math.max(1, lines.length - 1) // Subtract header row

        } catch (error) {
          console.warn('Could not parse CSV for count estimation:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  // Handle bulk upload submission - Non-blocking for concurrent uploads
  const handleBulkUpload = async (fileToUpload?: File, actualCompanyCount?: number) => {
    // If no file provided, get from current state
    const fileToUse = fileToUpload || getCurrentUploadedFile()

    if (!fileToUse) {
      toast.error(`Please select a ${predictionType} file to upload`)
      return
    }

    // Show immediate loading feedback
    toast.info(`Starting ${predictionType} analysis for ${fileToUse.name}...`, {
      id: 'bulk-upload-analysis',
      description: 'Uploading file and initializing background processing...'
    })

    try {
      // Use the bulk upload store's uploadFile method instead of direct API calls
      // This ensures proper job management and immediate UI feedback
      const { uploadFile } = useBulkUploadStore.getState()


      const jobId = await uploadFile(fileToUse, predictionType)

      // Dismiss loading toast
      toast.dismiss('bulk-upload-analysis')

      if (!jobId) {
        throw new Error('No job ID returned from bulk upload')
      }

      const estimatedTimeMinutes = useBulkUploadStore.getState().jobs.find(j => j.id === jobId)?.estimated_time_minutes

      // Success message with job details
      toast.success(`Analysis started for "${fileToUse.name}"!`, {
        description: estimatedTimeMinutes && estimatedTimeMinutes > 0
          ? `Estimated completion: ${estimatedTimeMinutes} minutes. Job ID: ${jobId.substring(0, 8)}...`
          : `Processing started. Job ID: ${jobId.substring(0, 8)}...`
      })

      // Show helpful message for large files
      if (estimatedTimeMinutes && estimatedTimeMinutes > 5) {
        toast.info(`Large file processing. Check back in ${Math.round(estimatedTimeMinutes / 2)} minutes.`)
      }

      // Clear uploaded file state to allow new uploads
      setUploadedFiles(prev => ({
        ...prev,
        [predictionType]: null
      }))



    } catch (error: any) {
      // Dismiss loading toast on error
      toast.dismiss('bulk-upload-analysis')

      console.error('Bulk upload error:', {
        error,
        message: error.message,
        detail: error.detail,
        response: error.response?.data,
        fullError: error
      })

      // Enhanced error handling for API errors - extract detailed error message
      let errorMessage = 'Unknown error'

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.detail) {
        errorMessage = error.detail
      } else if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      if (errorMessage.includes('Missing required columns')) {
        // Extract missing columns from error message
        const missingColumnsMatch = errorMessage.match(/Missing required columns: (.+)/)
        const missingColumns = missingColumnsMatch ? missingColumnsMatch[1] : 'unknown columns'

        // Determine correct file type based on missing columns
        const isQuarterlyColumns = missingColumns.includes('sga_margin') || missingColumns.includes('return_on_capital')
        const isAnnualColumns = missingColumns.includes('long_term_debt_to_total_capital') || missingColumns.includes('return_on_assets')

        let suggestedTab = 'unknown'
        let currentFileType = 'unknown'

        if (isQuarterlyColumns && predictionType === 'annual') {
          suggestedTab = 'quarterly'
          currentFileType = 'annual'
        } else if (isAnnualColumns && predictionType === 'quarterly') {
          suggestedTab = 'annual'
          currentFileType = 'quarterly'
        }

        if (suggestedTab !== 'unknown') {
          toast.error(`Wrong file type selected!`, {
            description: `You uploaded a ${currentFileType} file but selected the ${predictionType} tab. Missing columns: ${missingColumns}`,
            duration: 10000,
            action: {
              label: `Switch to ${suggestedTab}`,
              onClick: () => {
                setPredictionType(suggestedTab as 'annual' | 'quarterly')
                toast.success(`Switched to ${suggestedTab} tab. Please try uploading again.`)
              }
            }
          })
        } else {
          toast.error(`Column validation failed for "${fileToUse.name}"`, {
            description: `Missing required columns: ${missingColumns}. Please check your file format.`,
            duration: 8000
          })
        }
      } else {
        toast.error(`Analysis failed for "${fileToUse.name}": ${errorMessage}`)
      }

      // Re-throw the error so it can be caught by the caller (bulk-upload-section-new.tsx)
      throw error
    }

    // Don't set uploading state - this allows multiple concurrent uploads
  }

  // Helper function to show confirmation dialog
  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        onConfirm()
      },
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    })
  }

  // Handle job deletion
  const handleDeleteBulkJob = async (jobId: string, jobFilename: string) => {
    showConfirmDialog(
      'Delete Job',
      `Are you sure you want to delete the job for "${jobFilename}"?\n\nThis action cannot be undone.`,
      async () => {
        const success = await deleteBulkJob(jobId)
        if (success) {
          toast.success(`Job "${jobFilename}" deleted successfully`)

          // Don't reset upload modal - allow concurrent uploads
          // setCurrentUploadedFile(null) // Removed to support concurrent uploads

          // Refresh the jobs list
          await fetchBulkJobs()
        } else {
          toast.error(`Failed to delete job "${jobFilename}"`)
        }
      }
    )
  }

  // Handle job results viewing
  const handleViewResults = (jobId: string, jobName?: string) => {
    setSelectedJobId(jobId)
    setSelectedJobName(jobName || null)
    setResultsDialogOpen(true)
  }

  // Handle Excel download - frontend only with correct column mapping
  const handleDownloadExcel = async (jobId: string, jobName?: string) => {
    try {
      // Get job results first
      const response = await jobsApi.predictions.getJobResultsComplete(jobId, {
        include_predictions: true,
        include_companies: true,
        include_errors: false
      })

      if (!response.success || !response.data) {
        toast.error('Failed to fetch job results for export')
        return
      }

      const results = response.data

      if (!results.created_data?.predictions || results.created_data.predictions.length === 0) {
        toast.error('No prediction data available for export')
        return
      }



      // Determine if this is annual or quarterly based on job_type or presence of quarterly data - EXACTLY as job-results-dialog.tsx
      const isAnnual = results.job_summary.job_type === 'annual' ||
        !results.created_data?.predictions?.some((p: any) => p.reporting_quarter)

      // Define headers based on job type - EXACTLY as in job-results-dialog.tsx
      const headers = isAnnual
        ? [
          'Company Symbol',
          'Company Name',
          'Sector',
          'Reporting Year',
          'Reporting Quarter',
          'Long Term Debt to Total Capital (%)',
          'Total Debt to EBITDA',
          'Net Income Margin (%)',
          'EBIT to Interest Expense',
          'Return on Assets (%)',
          'Default Rate (%)',
          'Risk Level',
          'Confidence (%)'
        ]
        : [
          'Company Symbol',
          'Company Name',
          'Sector',
          'Reporting Year',
          'Reporting Quarter',
          'Total Debt to EBITDA',
          'SGA Margin (%)',
          'Long Term Debt to Total Capital (%)',
          'Return on Capital (%)',
          'Logistic Probability (%)',
          'Risk Level',
          'Confidence (%)',
          'GBM Probability (%)',
          'Ensemble Probability (%)',
          'Default Rate (%)'
        ]

      const rows: string[][] = []

      // Process predictions data with STRICT column mapping - EXACTLY as in job-results-dialog.tsx
      results.created_data.predictions.forEach((prediction: any) => {
        const company = prediction.company || {}
        const financialMetrics = prediction.financial_metrics || {}
        const predictionData = prediction.prediction || {}

        // Helper function to safely format numbers - same as job-results-dialog.tsx
        const formatNumber = (value: any, decimals: number = 2) => {
          if (value === null || value === undefined || isNaN(value)) return 'N/A'
          return Number(value).toFixed(decimals)
        }

        const formatPercent = (value: any, decimals: number = 2) => {
          if (value === null || value === undefined || isNaN(value)) return 'N/A'
          return (Number(value) * 100).toFixed(decimals)
        }

        // Helper function for values that are already in percentage format
        const formatPercentDirect = (value: any, decimals: number = 2) => {
          if (value === null || value === undefined || isNaN(value)) return 'N/A'
          return Number(value).toFixed(decimals)
        }

        if (isAnnual) {
          // ANNUAL: Exactly 13 columns in this exact order matching headers
          const row = [
            company.symbol || 'N/A',                                         // Company Symbol
            company.name || 'N/A',                                          // Company Name
            company.sector || 'N/A',                                        // Sector
            (prediction.reporting_year || 'N/A').toString(),               // Reporting Year
            (prediction.reporting_quarter || 'N/A').toString(),            // Reporting Quarter
            formatPercentDirect(financialMetrics.long_term_debt_to_total_capital), // Long Term Debt to Total Capital (%)
            formatNumber(financialMetrics.total_debt_to_ebitda),          // Total Debt to EBITDA
            formatPercentDirect(financialMetrics.net_income_margin),      // Net Income Margin (%)
            formatNumber(financialMetrics.ebit_to_interest_expense),      // EBIT to Interest Expense
            formatPercentDirect(financialMetrics.return_on_assets),       // Return on Assets (%)
            formatPercent(predictionData.probability),                    // Default Rate (%)
            predictionData.risk_level || 'N/A',                          // Risk Level
            formatPercent(predictionData.confidence, 1)                   // Confidence (%)
          ]
          rows.push(row)
        } else {
          // QUARTERLY: Exactly 15 columns in this exact order matching headers
          const row = [
            company.symbol || 'N/A',                                         // Company Symbol
            company.name || 'N/A',                                          // Company Name
            company.sector || 'N/A',                                        // Sector
            (prediction.reporting_year || 'N/A').toString(),               // Reporting Year
            (prediction.reporting_quarter || 'N/A').toString(),            // Reporting Quarter
            formatNumber(financialMetrics.total_debt_to_ebitda),          // Total Debt to EBITDA
            formatPercentDirect(financialMetrics.sga_margin),             // SGA Margin (%)
            formatPercentDirect(financialMetrics.long_term_debt_to_total_capital), // Long Term Debt to Total Capital (%)
            formatPercentDirect(financialMetrics.return_on_capital),      // Return on Capital (%)
            formatPercent(predictionData.logistic_probability),           // Logistic Probability (%)
            predictionData.risk_level || 'N/A',                          // Risk Level
            formatPercent(predictionData.confidence, 1),                  // Confidence (%)
            formatPercent(predictionData.gbm_probability),                // GBM Probability (%)
            formatPercent(predictionData.ensemble_probability),           // Ensemble Probability (%)
            formatPercent(predictionData.logistic_probability)            // Default Rate (%) = Logistic Probability (%)
          ]
          rows.push(row)
        }
      })

      // Validate column counts match headers - EXACTLY as job-results-dialog.tsx
      const expectedColumns = isAnnual ? 13 : 15


      if (headers.length !== expectedColumns) {
        throw new Error(`Header count mismatch: expected ${expectedColumns}, got ${headers.length}`)
      }

      if (rows.length > 0 && rows[0].length !== expectedColumns) {
        throw new Error(`Row column count mismatch: expected ${expectedColumns}, got ${rows[0].length}`)
      }

      // Create CSV content with explicit structure - EXACTLY as job-results-dialog.tsx
      const csvContent = [
        headers.join(','),
        ...rows.map(row => {
          if (row.length !== expectedColumns) {
            // Row length mismatch detected
          }
          return row.map((field: string) => `"${field}"`).join(',')
        })
      ].join('\n')



      // Download the file - EXACTLY as job-results-dialog.tsx
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const jobType = isAnnual ? 'annual' : 'quarterly'
      link.download = `${jobType}-predictions-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Analysis data exported successfully!')
    } catch (err: any) {
      console.error('Export error:', err)
      toast.error('Failed to export analysis data: ' + err.message)
    }
  }

  // Handle job cancellation
  const handleCancelBulkJob = async (jobId: string, jobFilename: string) => {
    showConfirmDialog(
      'Cancel Job',
      `Are you sure you want to cancel the processing job for "${jobFilename}"?`,
      async () => {
        const success = await cancelBulkJob(jobId)
        if (success) {
          toast.success(`Job "${jobFilename}" cancelled successfully`)

          // Don't reset upload modal - allow concurrent uploads
          // setCurrentUploadedFile(null) // Removed to support concurrent uploads

          // Refresh the jobs list
          await fetchBulkJobs()
        } else {
          toast.error(`Failed to cancel job "${jobFilename}"`)
        }
      }
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Helper functions for file management
  const getCurrentUploadedFile = () => uploadedFiles[predictionType]
  const setCurrentUploadedFile = (file: File | null) => {
    setUploadedFiles(prev => ({ ...prev, [predictionType]: file }))
  }

  // File type detection based on column headers
  const detectFileTypeFromHeaders = async (file: File): Promise<'annual' | 'quarterly' | 'unknown'> => {
    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          let headers: string[] = []

          if (file.name.toLowerCase().endsWith('.csv')) {
            // For CSV files, read first line as headers
            const firstLine = text.split('\n')[0]
            headers = firstLine.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
          } else {
            // For Excel files, we'll use a simpler approach - look for key patterns in the text
            const lowerText = text.toLowerCase()

            // Check for annual-specific columns
            const hasAnnualColumns = lowerText.includes('return_on_assets') ||
              lowerText.includes('ebit_to_interest_expense') ||
              (lowerText.includes('long_term_debt') && lowerText.includes('return_on_assets'))

            // Check for quarterly-specific columns  
            const hasQuarterlyColumns = lowerText.includes('sga_margin') ||
              lowerText.includes('return_on_capital') ||
              (lowerText.includes('sga') && lowerText.includes('return_on_capital'))

            if (hasAnnualColumns && !hasQuarterlyColumns) {
              resolve('annual')
              return
            }
            if (hasQuarterlyColumns && !hasAnnualColumns) {
              resolve('quarterly')
              return
            }
          }

          // For CSV, check actual headers
          if (headers.length > 0) {
            const hasAnnualCols = headers.some(h =>
              h.includes('return_on_assets') ||
              h.includes('ebit_to_interest_expense')
            )
            const hasQuarterlyCols = headers.some(h =>
              h.includes('sga_margin') ||
              h.includes('return_on_capital')
            )

            if (hasAnnualCols && !hasQuarterlyCols) {
              resolve('annual')
              return
            }
            if (hasQuarterlyCols && !hasAnnualCols) {
              resolve('quarterly')
              return
            }
          }

          resolve('unknown')
        } catch (error) {
          console.error('Error reading file headers:', error)
          resolve('unknown')
        }
      }

      reader.onerror = () => resolve('unknown')

      // Read as text to check headers
      reader.readAsText(file.slice(0, 2048)) // Read first 2KB to get headers
    })
  }

  // File type detection based on filename patterns (fallback)
  const detectFileType = (fileName: string): 'annual' | 'quarterly' | 'unknown' => {
    const lowerName = fileName.toLowerCase()

    // Look for keywords in filename
    if (lowerName.includes('annual') || lowerName.includes('yearly')) {
      return 'annual'
    }
    if (lowerName.includes('quarter') || lowerName.includes('q1') || lowerName.includes('q2') ||
      lowerName.includes('q3') || lowerName.includes('q4')) {
      return 'quarterly'
    }

    return 'unknown'
  }

  // Show file type mismatch warning
  const showFileTypeMismatch = (fileName: string, detectedType: string, currentTab: string) => {
    const message = `The file "${fileName}" appears to be a ${detectedType} file, but you're currently in the ${currentTab} tab. Would you like to switch tabs or verify your file?`

    toast.error(message, {
      duration: 8000,
      action: {
        label: `Switch to ${detectedType}`,
        onClick: () => {
          setPredictionType(detectedType as 'annual' | 'quarterly')
          toast.success(`Switched to ${detectedType} tab`)
        }
      }
    })
  }

  // Multi-file upload handling with automatic header detection
  const handleMultipleFileUpload = async (files: File[]) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    const maxSize = 10 * 1024 * 1024

    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Please select a CSV or Excel file.`)
        return false
      }
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name}. Maximum size is 10MB.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    const file = validFiles[0] // We only take first file now

    // Show loading toast while detecting file type
    toast.info('Analyzing file headers...', { id: 'file-analysis' })

    try {
      // Detect file type from headers first
      const detectedFromHeaders = await detectFileTypeFromHeaders(file)

      // Fallback to filename detection if header detection fails
      const detectedFromFilename = detectFileType(file.name)
      const finalDetectedType = detectedFromHeaders !== 'unknown' ? detectedFromHeaders : detectedFromFilename

      toast.dismiss('file-analysis')

      // Auto-switch tab if we detected a different type
      if (finalDetectedType !== 'unknown' && finalDetectedType !== predictionType) {
        setPredictionType(finalDetectedType)

        const detectionMethod = detectedFromHeaders !== 'unknown' ? 'file columns' : 'filename'
        toast.success(`Auto-switched to ${finalDetectedType} model`, {
          description: `Detected ${finalDetectedType} file based on ${detectionMethod}. The correct API will be used.`,
          duration: 5000
        })
      } else if (finalDetectedType === 'unknown') {
        toast.warning(`Could not auto-detect file type for "${file.name}"`, {
          description: `Using current ${predictionType} model. If upload fails, try switching tabs manually.`,
          duration: 6000
        })
      }

      // Add files to upload queue
      const newItems = validFiles.map(file => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: 'uploading' as const
      }))

      setUploadQueue(prev => [...prev, ...newItems])

      // Simulate upload progress for each file
      newItems.forEach((item, index) => {
        simulateUploadProgress(item.id, index * 500) // Stagger uploads
      })

    } catch (error) {
      toast.dismiss('file-analysis')
      console.error('Error analyzing file:', error)

      // Fallback to filename detection
      const detectedType = detectFileType(file.name)
      if (detectedType !== 'unknown' && detectedType !== predictionType) {
        showFileTypeMismatch(file.name, detectedType, predictionType)
      }

      // Continue with upload anyway
      const newItems = validFiles.map(file => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: 'uploading' as const
      }))

      setUploadQueue(prev => [...prev, ...newItems])
      newItems.forEach((item, index) => {
        simulateUploadProgress(item.id, index * 500)
      })
    }
  }

  const simulateUploadProgress = (itemId: string, delay = 0) => {
    setTimeout(() => {
      const interval = setInterval(() => {
        setUploadQueue(prev =>
          prev.map(item => {
            if (item.id === itemId && item.status === 'uploading') {
              const newProgress = Math.min(item.progress + Math.random() * 15 + 5, 100)
              if (newProgress >= 100) {
                clearInterval(interval)
                return { ...item, progress: 100, status: 'completed' }
              }
              return { ...item, progress: newProgress }
            }
            return item
          })
        )
      }, 200)
    }, delay)
  }

  const removeFromUploadQueue = (itemId: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== itemId))
  }

  // Helper functions
  const handleSampleData = () => {
    const sampleData = SAMPLE_DATA[predictionType]
    Object.entries(sampleData).forEach(([key, value]) => {
      setFormData(prev => ({ ...prev, [key]: value }))
    })
    toast.success('Sample data loaded!')
  }

  // Template download function
  const downloadTemplate = (type: 'annual' | 'quarterly') => {
    const ANNUAL_TEMPLATE_DATA = [
      {
        company_symbol: 'AAPL',
        company_name: 'Apple Inc.',
        sector: 'Technology',
        reporting_year: 2024,
        long_term_debt_to_total_capital: 18.75,
        total_debt_to_ebitda: 2.10,
        net_income_margin: 25.30,
        ebit_to_interest_expense: 15.80,
        return_on_assets: 12.50
      }
    ]

    const QUARTERLY_TEMPLATE_DATA = [
      {
        company_symbol: 'AAPL',
        company_name: 'Apple Inc.',
        sector: 'Technology',
        reporting_year: 2024,
        reporting_quarter: 'Q1',
        long_term_debt_to_total_capital: 18.75,
        total_debt_to_ebitda: 2.10,
        sga_margin: 15.25,
        return_on_capital: 18.50
      }
    ]

    const data = type === 'annual' ? ANNUAL_TEMPLATE_DATA : QUARTERLY_TEMPLATE_DATA
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${type}_prediction_template.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`${type} template downloaded successfully!`)
  }

  const handleReset = () => {
    setFormData({
      stockSymbol: '',
      marketCap: '',
      companyName: '',
      sector: '',
      reportingYear: '2024',
      reportingQuarter: 'Q1',
      ebitInterestExpense: '',
      totalDebtEbitda: '',
      returnOnAssets: '',
      netIncomeMargin: '',
      longTermDebtTotalCapital: '',
      sgaMargin: '',
      returnOnCapital: ''
    })
    setShowResults(false)
    setAnalysisResults(null)
    setProcessingStep(0)
    setIsProcessing(false)
    setIsSubmitting(false)
    setEditMode({ isEditing: false, predictionId: null }) // Clear edit mode
    toast.success('Form reset!')
  }

  const handlePredictionTypeChange = (type: 'annual' | 'quarterly') => {
    setPredictionType(type)
    // Reset results to show empty state when switching tabs
    setShowResults(false)
    setAnalysisResults(null)
    setProcessingStep(0)
    setIsProcessing(false)
    setIsSubmitting(false)
  }

  // Processing simulation
  const simulateProcessing = async () => {
    setIsProcessing(true)
    setShowResults(false)
    setAnalysisResults(null)

    // Run through steps 1-3 quickly
    const steps = [1, 2, 3]
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setProcessingStep(step)
    }

    // Move to step 4 (Final Processing) and stay there until API call completes
    setProcessingStep(4)
  }

  const isAnalysisLoading = createAnnualPredictionMutation.isPending || createQuarterlyPredictionMutation.isPending || updatePredictionMutation.isPending

  return (
    <div className="space-y-6">
      {/* Custom Analysis Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bricolage font-bold text-gray-900 dark:text-white">
            Custom Company Analysis
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Run ML default rate predictions for any company using financial ratios
          </p>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="text-blue-600">
            ML Model v2.1.3
          </Badge>
        </div>
      </div>

      {/* Analysis Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="individual">Individual Analysis</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Analysis</TabsTrigger>
        </TabsList>

        {/* Individual Analysis */}
        <TabsContent value="individual" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Analysis Form */}
            <IndividualAnalysisForm
              formData={formData}
              predictionType={predictionType}
              onInputChange={handleInputChange}
              onAnalysis={handleAnalysis}
              onSampleData={handleSampleData}
              onReset={handleReset}
              onPredictionTypeChange={handlePredictionTypeChange}
              isLoading={isAnalysisLoading}
              editMode={editMode}
              isSubmitting={isSubmitting}
            />

            {/* Analysis Results */}
            {!isProcessing && !showResults && (
              <EmptyAnalysisState predictionType={predictionType} />
            )}
            {isProcessing && (
              <ProcessingSteps
                currentStep={processingStep}
                predictionType={predictionType}
                isApiProcessing={isAnalysisLoading && processingStep === 4}
              />
            )}
            {showResults && analysisResults && (
              <CompanyAnalysisPanel
                company={analysisResults.company}
                annualPredictions={predictionType === 'annual' ? analysisResults.predictions : []}
                quarterlyPredictions={predictionType === 'quarterly' ? analysisResults.predictions : []}
                activeTab={predictionType}
                isLoading={false}
              />
            )}
          </div>
        </TabsContent>

        {/* Bulk Analysis */}
        <TabsContent value="bulk" className="mt-6 space-y-8">
          {/* Header with Model Tabs and Template Download */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Bulk Analysis Upload</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload CSV or Excel files for <span className="font-medium">{predictionType}</span> batch analysis
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Model Selection Tabs */}
              <Tabs value={predictionType} onValueChange={(value) => setPredictionType(value as 'annual' | 'quarterly')} className="w-auto">
                <TabsList className="grid grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1">
                  <TabsTrigger value="annual" className="text-sm">Annual Model</TabsTrigger>
                  <TabsTrigger value="quarterly" className="text-sm">Quarterly Model</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Template Download */}
              <Button
                variant="outline"
                onClick={() => downloadTemplate(predictionType)}
                size="sm"
                className="border-gray-300 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>

              {/* Upload Button */}
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>

          {/* Jobs Section */}
          <div className="">
            {(jobs.length > 0 || bulkJobs.length > 0) ? (
              <SimpleJobsDisplaySection
                jobs={jobs}
                bulkJobs={bulkJobs}
                hasActiveJobs={hasActiveJobs}
                onDeleteBulkJob={handleDeleteBulkJob}
                onCancelBulkJob={handleCancelBulkJob}
                canDeleteJob={canDeleteJob}
                onViewResults={handleViewResults}
                onDownloadExcel={handleDownloadExcel}
              />
            ) : (
              <div className="space-y-6">
                {/* Header - Empty State */}
                <div className="flex items-center justify-between">
                  <div className="">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Analysis Jobs
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Track progress and view results (0 total)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <FileSpreadsheet className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No Analysis Jobs Yet
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                        Upload files above to start batch analysis
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <>
          {/* Blur backdrop */}
          <div className="fixed inset-0 z-40 backdrop-blur" />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {confirmDialog.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 whitespace-pre-line">
                {confirmDialog.message}
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => confirmDialog.onCancel?.()}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => confirmDialog.onConfirm()}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <>
          {/* Blur backdrop */}
          <div className="fixed inset-0 z-40 backdrop-blur bg-black/20" />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl mx-4 shadow-2xl border-0 overflow-hidden max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Upload File for Analysis
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Upload your data file to start batch prediction analysis
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowUploadModal(false)}
                    size="sm"
                    className="text-gray-400 hover:text-gray-600 hover:bg-white/50 dark:hover:bg-gray-600/50 rounded-full h-8 w-8 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Model Selection and Template - Enhanced styling */}
                <div className="flex items-center justify-between mt-6 p-4 bg-white/60 dark:bg-gray-700/60 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Model Type:</span>
                    <Tabs value={predictionType} onValueChange={(value) => setPredictionType(value as 'annual' | 'quarterly')} className="w-auto">
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger
                          value="annual"
                          className="text-sm font-medium"
                        >
                          Annual Model
                        </TabsTrigger>
                        <TabsTrigger
                          value="quarterly"
                          className="text-sm font-medium"
                        >
                          Quarterly Model
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Smart Detection Info */}
                  <div className="flex items-center gap-4">
                    {/* <div className="text-xs text-gray-600 dark:text-gray-400 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 px-3 py-1 rounded-md border border-green-200 dark:border-green-700">
                      <span className="font-medium">✨ Smart Detection:</span> File type will be auto-detected from headers
                    </div> */}

                    {/* Template Download */}
                    <Button
                      variant="outline"
                      onClick={() => downloadTemplate(predictionType)}
                      className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-600 font-medium flex items-center gap-2 shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto flex-1">
                {/* Enhanced Upload Area */}
                <div className="space-y-6">
                  {!getCurrentUploadedFile() && uploadQueue.length === 0 ? (
                    // Upload Drop Zone
                    <div
                      className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-200 cursor-pointer group"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const files = Array.from(e.dataTransfer.files)
                        if (files[0]) {
                          const existingFile = getCurrentUploadedFile()
                          if (existingFile) {
                            toast.info(`🔄 Replacing "${existingFile.name}" with "${files[0].name}"...`)
                          }
                          handleMultipleFileUpload([files[0]]) // Only take first file
                        }
                      }}
                    >
                      <input
                        id="file-upload"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 0) {
                            const existingFile = getCurrentUploadedFile()
                            if (existingFile && files[0]) {
                              toast.info(`🔄 Changing file from "${existingFile.name}" to "${files[0].name}"...`)
                            }
                            handleMultipleFileUpload([files[0]]) // Only take first file
                            e.target.value = '' // Clear input to allow selecting same file again
                          }
                        }}
                        className="hidden"
                      />
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-800 dark:to-indigo-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileSpreadsheet className="h-8 w-8" />
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Upload {predictionType} file
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            Drop your file here or <span className="text-blue-500 font-medium">click to browse</span>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Supports CSV, XLSX files (Max 10MB) • One file at a time
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* File Upload Queue */}
                      {uploadQueue.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {uploadQueue.filter(f => f.status === 'completed').length} of {uploadQueue.length} files uploaded
                            </h4>
                            <div className="text-sm text-gray-500">
                              {uploadQueue.filter(f => f.status === 'uploading').length > 0 ? 'Uploading...' : 'Complete'}
                            </div>
                          </div>

                          {uploadQueue.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileSpreadsheet className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {item.file.name}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">
                                        {((item.file.size || 0) / 1024 / 1024).toFixed(2)} MB
                                      </span>
                                      {item.status === 'completed' && (
                                        <div className="flex items-center gap-1">
                                          <div className="w-5 h-5 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                          <button
                                            onClick={() => {
                                              removeFromUploadQueue(item.id)
                                              toast.success(`🗑️ File removed`, {
                                                description: `"${item.file.name}" has been removed from queue.`,
                                                duration: 3000
                                              })
                                            }}
                                            className="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                                            title="Remove this file"
                                          >
                                            <X className="w-3 h-3 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" />
                                          </button>
                                        </div>
                                      )}
                                      {item.status === 'error' && (
                                        <button
                                          onClick={() => removeFromUploadQueue(item.id)}
                                          className="w-5 h-5 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-700"
                                        >
                                          <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Progress bar */}
                                  {item.status === 'uploading' && (
                                    <div className="mt-2">
                                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                        <span>Uploading...</span>
                                        <span>{Math.round(item.progress)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div
                                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                          style={{ width: `${item.progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {item.status === 'error' && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                      {item.error || 'Upload failed'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}


                        </div>
                      )}

                      {/* Single file selected state (enhanced with file management) */}
                      {getCurrentUploadedFile() && uploadQueue.length === 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-green-900 dark:text-green-100">
                                ✅ {getCurrentUploadedFile()?.name}
                              </h4>
                              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                {((getCurrentUploadedFile()?.size || 0) / 1024 / 1024).toFixed(2)} MB • Ready for {predictionType} analysis
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                💡 Need to use a different file? Use the buttons below to change or remove
                              </p>
                            </div>
                          </div>

                          {/* File Management Actions */}
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-green-200 dark:border-green-600">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Trigger file input to change file
                                document.getElementById('file-upload')?.click()
                              }}
                              className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                              Change File
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const fileName = getCurrentUploadedFile()?.name || 'file'
                                setCurrentUploadedFile(null)
                                toast.success(`🗑️ File removed`, {
                                  description: `"${fileName}" has been removed. You can now upload a different file.`,
                                  duration: 3000
                                })
                              }}
                              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                            >
                              <X className="h-4 w-4" />
                              Remove File
                            </Button>
                            <div className="flex-1 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Click the drop zone to add another file
                                  document.getElementById('file-upload')?.click()
                                }}
                                className="text-gray-500 hover:text-gray-700 text-xs"
                              >
                                Or drag & drop a new file to replace
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}                  {/* Action Buttons */}
                  <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    {(getCurrentUploadedFile() || uploadQueue.some(f => f.status === 'completed')) && (
                      <>
                        {uploadQueue.length > 0 && (
                          <Button
                            onClick={async () => {
                              // Process the first completed file only
                              const completedFile = uploadQueue.find(f => f.status === 'completed')
                              if (completedFile) {
                                try {
                                  await handleBulkUpload(completedFile.file)
                                  setShowUploadModal(false)
                                  setUploadQueue([])
                                } catch (error) {
                                  // Error is already handled in handleBulkUpload, but keep modal open for retry

                                }
                              }
                            }}
                            disabled={bulkUploadMutation.isPending || uploadQueue.every(f => f.status !== 'completed')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 font-medium shadow-lg hover:shadow-xl transition-all"
                          >
                            {bulkUploadMutation.isPending ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing File...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Process File
                              </div>
                            )}
                          </Button>
                        )}

                        {getCurrentUploadedFile() && uploadQueue.length === 0 && (
                          <Button
                            onClick={async () => {
                              try {
                                await handleBulkUpload(getCurrentUploadedFile()!)
                                setShowUploadModal(false)
                              } catch (error) {
                                // Error is already handled in handleBulkUpload, but keep modal open for retry

                              }
                            }}
                            disabled={bulkUploadMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 font-medium shadow-lg hover:shadow-xl transition-all"
                          >
                            {bulkUploadMutation.isPending ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Starting Analysis...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Process File
                              </div>
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Job Results Dialog */}
      <JobResultsDialog
        jobId={selectedJobId}
        jobName={selectedJobName || undefined}
        isOpen={resultsDialogOpen}
        onClose={() => {
          setResultsDialogOpen(false)
          setSelectedJobId(null)
          setSelectedJobName(null)
        }}
      />
    </div>
  )
}
