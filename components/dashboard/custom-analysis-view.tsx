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
import { SAMPLE_DATA } from '@/lib/config/sectors'
import { BulkUploadSection } from './analysis/bulk-upload-section-new'
import { JobStatusContainer } from './job-status-display'
import { Loader2, Download, Trash2, X, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react'

// Simple Jobs Display Component - Just jobs, no upload widget integration
function SimpleJobsDisplaySection({
  jobs,
  bulkJobs,
  hasActiveJobs,
  onDeleteBulkJob,
  onCancelBulkJob,
  canDeleteJob,
  onUploadClick
}: {
  jobs: any[]
  bulkJobs: any[]
  hasActiveJobs: () => boolean
  onDeleteBulkJob: (jobId: string, filename: string) => void
  onCancelBulkJob: (jobId: string, filename: string) => void
  canDeleteJob: (job: any) => boolean
  onUploadClick?: () => void
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
          {/* Upload Button */}
          {onUploadClick && (
            <Button
              onClick={onUploadClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Upload
            </Button>
          )}

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
  isCompact
}: {
  job: any
  onDelete: (jobId: string, filename: string) => void
  onCancel: (jobId: string, filename: string) => void
  canDelete: (job: any) => boolean
  isCompact: boolean
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

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {job.status === 'processing' && (
              <Button
                onClick={() => onCancel(job.id, job.original_filename)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                title="Cancel processing"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {canDelete(job) && (
              <Button
                onClick={() => onDelete(job.id, job.original_filename)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="Delete job"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
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
          <div className="text-xs text-gray-400">
            {new Date(job.created_at || job.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
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
const formatErrorMessage = (rawMessage: string): string => {
  if (!rawMessage) return 'An unexpected error occurred. Please try again.'

  // Handle common API error patterns
  if (rawMessage.includes('already exists in your global scope')) {
    const match = rawMessage.match(/Annual prediction for (\w+) in (\d+) Q(\d+) already exists/)
    if (match) {
      const [, symbol, year, quarter] = match
      return `A prediction for ${symbol} already exists for ${year} Q${quarter}. Please try a different company or time period.`
    }
  }

  if (rawMessage.includes('Quarterly prediction for')) {
    const match = rawMessage.match(/Quarterly prediction for (\w+) in (\d+) Q(\d+) already exists/)
    if (match) {
      const [, symbol, year, quarter] = match
      return `A quarterly prediction for ${symbol} already exists for ${year} Q${quarter}. Please try a different company or time period.`
    }
  }

  // Handle validation errors
  if (rawMessage.toLowerCase().includes('validation')) {
    return 'Please check your input data. Some fields may have invalid values.'
  }

  if (rawMessage.toLowerCase().includes('unauthorized')) {
    return 'You are not authorized to perform this action. Please check your permissions.'
  }

  if (rawMessage.toLowerCase().includes('not found')) {
    return 'The requested resource was not found. Please try again.'
  }

  // Return original message if no specific pattern matched, but limit length
  return rawMessage.length > 100 ? rawMessage.substring(0, 100) + '...' : rawMessage
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
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
    setErrorMessage('')    // Start processing simulation
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
            const formattedResults = {
              company: {
                id: predictionData.company_symbol || formData.stockSymbol,
                name: predictionData.company_symbol || formData.stockSymbol,
                subtitle: predictionData.company_name || formData.companyName,
                sector: predictionData.sector || formData.sector,
                defaultRate: `${((predictionData.ensemble_probability || predictionData.probability || 0) * 100).toFixed(2)}%`,
                riskCategory: predictionData.risk_level || 'MEDIUM'
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
            const formattedErrorMessage = formatErrorMessage(rawErrorMessage)
            setErrorMessage(formattedErrorMessage)
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
              setErrorMessage(errorMsg)
              toast.error(errorMsg)
              return
            }

            // Format the API response for CompanyAnalysisPanel
            // API returns: { prediction: { ... } }
            const predictionData = results.response?.data?.prediction || results.response?.data
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
              console.log('🎯 Annual prediction created - dashboard will update automatically')

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
            const formattedErrorMessage = formatErrorMessage(rawErrorMessage)
            setErrorMessage(formattedErrorMessage)
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

            // Log the enhanced response
            console.log('✅ Enhanced Quarterly Prediction Update Response:', {
              basicInfo: {
                id: predictionData.id,
                symbol: predictionData.company_symbol,
                updated: predictionData.updated_at
              },
              inputData: predictionData.input_data,
              outputData: predictionData.output_data
            })

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
            const formattedErrorMessage = formatErrorMessage(rawErrorMessage)
            setErrorMessage(formattedErrorMessage)
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
              setErrorMessage(errorMsg)
              toast.error(errorMsg)
              return
            }

            // Format the API response for CompanyAnalysisPanel
            // API returns: { prediction: { ... } }
            const predictionData = results.response?.data?.prediction || results.response?.data
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
              console.log('🎯 Quarterly prediction created - dashboard will update automatically')

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
            const formattedErrorMessage = formatErrorMessage(rawErrorMessage)
            setErrorMessage(formattedErrorMessage)
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
          console.log(`Detected ${actualCount} companies in CSV file`)
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

    try {
      // Use the correct predictionsApi endpoints
      let result
      if (predictionType === 'annual') {
        result = await predictionsApi.annual.bulkUploadAnnualAsync(fileToUse)
      } else {
        result = await predictionsApi.quarterly.bulkUploadQuarterlyAsync(fileToUse)
      }

      const jobId = result.data?.job_id
      if (!jobId) {
        throw new Error('No job ID returned from server')
      }

      const estimatedTimeMinutes = result.data?.estimated_time_minutes
      const totalRows = actualCompanyCount || Math.floor(fileToUse.size / 100) // Rough estimate

      // Create ONE job with the server job ID and estimated time
      useJobStore.setState((state) => ({
        jobs: [...state.jobs, {
          id: jobId,
          fileName: fileToUse.name,
          startTime: new Date(),
          status: 'pending' as const,
          progress: 0,
          estimatedTimeMinutes: estimatedTimeMinutes,
          totalRows: actualCompanyCount,
        }]
      }));

      // Standardized 10-second polling interval for all jobs
      const pollingInterval = 10000; // Always 10 seconds as requested
      const initialDelay = 10000; // 10 seconds initial delay

      if (estimatedTimeMinutes && estimatedTimeMinutes > 5) {
        toast.info(`Large file processing. Check back in ${Math.round(estimatedTimeMinutes / 2)} minutes.`)
      }

      // Start 10-second interval polling
      const pollJob = async () => {
        try {
          await updateJobFromAPI(jobId)

          const job = useJobStore.getState().jobs.find(j => j.id === jobId)
          if (job && (job.status === 'pending' || job.status === 'processing')) {
            setTimeout(pollJob, pollingInterval) // Always 10 seconds
          } else if (job?.status === 'completed') {
            toast.success(`Analysis completed for ${fileToUse.name}!`)
          } else if (job?.status === 'failed') {
            toast.error(`Analysis failed for ${fileToUse.name}`)
          }
        } catch (error) {
          console.error('Failed to poll job status:', error)
          // Retry with same 10-second interval on error
          setTimeout(pollJob, pollingInterval)
        }
      }

      // Start polling after initial delay (10 seconds)
      setTimeout(async () => {
        await updateJobFromAPI(jobId) // Immediate check
        setTimeout(pollJob, initialDelay) // Then start 10-second polling
      }, 2000) // Wait 2 seconds for server to register the job

      toast.success(`Analysis started for "${fileToUse.name}"! ${estimatedTimeMinutes && estimatedTimeMinutes > 0 ? `Estimated completion: ${estimatedTimeMinutes} minutes.` : `Processing ${totalRows} rows...`}`)

    } catch (error: any) {
      console.error('Bulk upload error:', error)
      toast.error(`Analysis failed for "${fileToUse.name}": ${error.message}`)
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

  // Multi-file upload handling
  const handleMultipleFileUpload = (files: File[]) => {
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

    toast.success(`${validFiles.length} file(s) added to upload queue`)
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
    setErrorMessage('') // Clear any previous error
    toast.success('Sample data loaded!')
  }

  // Template download function
  const downloadTemplate = (type: 'annual' | 'quarterly') => {
    const ANNUAL_TEMPLATE_DATA = [
      {
        company_symbol: 'AAPL',
        company_name: 'Apple Inc.',
        sector: 'Technology',
        market_cap: 3000000,
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
        market_cap: 3000000,
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
    setErrorMessage('') // Clear any previous error
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
    setErrorMessage('') // Clear any previous error
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
              errorMessage={errorMessage}
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
            </div>
          </div>

          {/* Jobs Section with Upload Button */}
          <div className="">
            {(jobs.length > 0 || bulkJobs.length > 0) ? (
              <SimpleJobsDisplaySection
                jobs={jobs}
                bulkJobs={bulkJobs}
                hasActiveJobs={hasActiveJobs}
                onDeleteBulkJob={handleDeleteBulkJob}
                onCancelBulkJob={handleCancelBulkJob}
                canDeleteJob={canDeleteJob}
                onUploadClick={() => setShowUploadModal(true)}
              />
            ) : (
              <div className="space-y-6">
                {/* Header with Upload Button - Empty State */}
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Analysis Jobs
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Track progress and view results (0 total)
                    </p>
                  </div>

                  {/* Upload Button - Square shape */}
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Upload
                  </Button>
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
                        Click "Upload" button above to start batch analysis
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
                        if (files[0]) handleMultipleFileUpload(files)
                      }}
                    >
                      <input
                        id="file-upload"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 0) handleMultipleFileUpload(files)
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
                            Drop files here or <span className="text-blue-500 font-medium">click to browse</span>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Supports CSV, XLSX files (Max 10MB each)
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
                                        <div className="w-5 h-5 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                                          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
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

                          {/* Add more files button */}
                          <button
                            onClick={() => document.getElementById('file-upload-additional')?.click()}
                            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all"
                          >
                            <input
                              id="file-upload-additional"
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || [])
                                if (files.length > 0) handleMultipleFileUpload(files)
                              }}
                              className="hidden"
                            />
                            <div className="flex items-center justify-center gap-2">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span className="text-sm text-gray-600 dark:text-gray-400">Add more files</span>
                            </div>
                          </button>
                        </div>
                      )}

                      {/* Single file selected state (legacy) */}
                      {getCurrentUploadedFile() && uploadQueue.length === 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-green-900 dark:text-green-100">
                                {getCurrentUploadedFile()?.name}
                              </h4>
                              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                {((getCurrentUploadedFile()?.size || 0) / 1024 / 1024).toFixed(2)} MB • Ready for {predictionType} analysis
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentUploadedFile(null)}
                              className="text-green-600 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* <Button
                      variant="outline"
                      onClick={() => {
                        setShowUploadModal(false)
                        setUploadQueue([])
                      }}
                      className="px-6"
                    >
                      Cancel
                    </Button> */}

                    {(getCurrentUploadedFile() || uploadQueue.some(f => f.status === 'completed')) && (
                      <div className="flex items-center gap-3">
                        {uploadQueue.length > 0 && (
                          <Button
                            onClick={() => {
                              // Process all completed files
                              const completedFiles = uploadQueue.filter(f => f.status === 'completed')
                              completedFiles.forEach(item => {
                                handleBulkUpload(item.file)
                              })
                              setShowUploadModal(false)
                              setUploadQueue([])
                            }}
                            disabled={bulkUploadMutation.isPending || uploadQueue.every(f => f.status !== 'completed')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 font-medium shadow-lg hover:shadow-xl transition-all"
                          >
                            {bulkUploadMutation.isPending ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing {uploadQueue.filter(f => f.status === 'completed').length} files...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Process {uploadQueue.filter(f => f.status === 'completed').length} Files
                              </div>
                            )}
                          </Button>
                        )}

                        {getCurrentUploadedFile() && uploadQueue.length === 0 && (
                          <Button
                            onClick={() => {
                              handleBulkUpload(getCurrentUploadedFile()!)
                              setShowUploadModal(false)
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
                                Run Analysis
                              </div>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
