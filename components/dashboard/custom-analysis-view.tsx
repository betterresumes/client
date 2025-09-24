'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnnualPredictionRequest, QuarterlyPredictionRequest } from '@/lib/types/prediction'
import { useCreatePredictionMutations } from '@/hooks/use-prediction-mutations'
import { usePredictionMutations } from '@/hooks/use-prediction-edit-mutations'
import { predictionsApi } from '@/lib/api/predictions'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { useJobStore } from '@/lib/stores/job-store'
import { IndividualAnalysisForm } from './analysis/individual-analysis-form'
import { CompanyAnalysisPanel } from './company-analysis-panel'
import { ProcessingSteps } from './processing-steps'
import { EmptyAnalysisState } from './empty-analysis-state'
import { SAMPLE_DATA } from '@/lib/config/sectors'
import { BulkUploadSection } from './analysis/bulk-upload-section'
import { JobStatusContainer } from './job-status-display'
import { Loader2, Download } from 'lucide-react'
import { Button } from '../ui/button'

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

  // File upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState<any>(null)

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

  // Handle file upload
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

    setUploadedFile(file)
    toast.success(`File "${file.name}" selected for analysis!`)

    // Try to read file and count rows for better estimation
    if (file.type === 'text/csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim().length > 0)
          const actualCount = Math.max(1, lines.length - 1) // Subtract header row
          console.log(`Detected ${actualCount} companies in CSV file`)

          // Update the job with actual count
          setTimeout(() => handleBulkUpload(file, actualCount), 100)
        } catch (error) {
          console.warn('Could not parse CSV for count estimation:', error)
          handleBulkUpload(file)
        }
      }
      reader.readAsText(file)
    } else {
      // For Excel files, trigger upload immediately
      handleBulkUpload(file)
    }
  }

  // Handle bulk upload submission
  const handleBulkUpload = async (fileToUpload?: File, actualCompanyCount?: number) => {
    const fileToUse = fileToUpload || uploadedFile

    if (!fileToUse) {
      toast.error('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

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

      // Smart polling based on estimated time from server
      let pollingInterval: number
      let initialDelay: number

      if (estimatedTimeMinutes && estimatedTimeMinutes > 0) {
        // Use server estimation - poll at 1/4 intervals of estimated time, minimum 10 seconds
        pollingInterval = Math.max(10000, (estimatedTimeMinutes * 60000) / 4)
        // Wait for 1/3 of estimated time before first poll
        initialDelay = Math.max(5000, (estimatedTimeMinutes * 60000) / 3)

        if (estimatedTimeMinutes > 5) {
          toast.info(`Large file processing. Check back in ${Math.round(estimatedTimeMinutes / 2)} minutes.`)
        }
      } else {
        // Fallback to row-based estimation
        pollingInterval = totalRows < 20 ? 5000 : // 5 seconds for small files
          totalRows < 1000 ? 15000 : // 15 seconds for medium files  
            300000; // 5 minutes for large files
        initialDelay = 3000; // 3 seconds initial delay
      }

      // Start smart polling with initial delay
      const pollJob = async () => {
        try {
          await updateJobFromAPI(jobId)

          const job = useJobStore.getState().jobs.find(j => j.id === jobId)
          if (job && (job.status === 'pending' || job.status === 'processing')) {
            setTimeout(pollJob, pollingInterval)
          } else if (job?.status === 'completed') {
            toast.success(`Analysis completed for ${fileToUse.name}!`)
          } else if (job?.status === 'failed') {
            toast.error(`Analysis failed for ${fileToUse.name}`)
          }
        } catch (error) {
          console.error('Failed to poll job status:', error)
          // Retry with longer interval on error
          setTimeout(pollJob, pollingInterval * 2)
        }
      }

      // Do immediate status check and then start polling
      setTimeout(async () => {
        await updateJobFromAPI(jobId) // Immediate check
        setTimeout(pollJob, Math.min(initialDelay, 5000)) // Then start regular polling
      }, 2000) // Wait 2 seconds for server to register the job

      toast.success(`Analysis started! ${estimatedTimeMinutes && estimatedTimeMinutes > 0 ? `Estimated completion: ${estimatedTimeMinutes} minutes.` : `Processing ${totalRows} rows...`}`)

    } catch (error: any) {
      console.error('Bulk upload error:', error)
      toast.error(`Analysis failed: ${error.message}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
        <TabsContent value="bulk" className="mt-6 space-y-6">
          {/* Header with Model Tabs and Template Download */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk Analysis Upload</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Upload CSV or Excel files for batch analysis</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Model Selection Tabs */}
              <Tabs value={predictionType} onValueChange={(value) => setPredictionType(value as 'annual' | 'quarterly')} className="w-auto">
                <TabsList className="grid grid-cols-2 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger value="annual" className="text-sm">Annual Model</TabsTrigger>
                  <TabsTrigger value="quarterly" className="text-sm">Quarterly Model</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Template Download */}
              <Button
                variant="outline"
                onClick={() => downloadTemplate(predictionType)}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download {predictionType === 'annual' ? 'Annual' : 'Quarterly'} Template
              </Button>
            </div>
          </div>

          {/* Upload Section and Jobs Side by Side */}
          <div className="space-y-4">
            {/* Upload Section */}
            <BulkUploadSection
              predictionType={predictionType}
              onFileUpload={handleFileUpload}
              onBulkUpload={handleBulkUpload}
              uploadedFile={uploadedFile}
              setUploadedFile={setUploadedFile}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              bulkUploadPending={bulkUploadMutation.isPending}
              onPredictionTypeChange={setPredictionType}
              showModelTabs={false} // Hide tabs from upload section
              showTemplateButton={false} // Hide template button from upload section
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Persistent Jobs Section - Outside of tabs */}
      {jobs.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Analysis Jobs {hasActiveJobs() && <span className="text-blue-600">• Active</span>}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track progress and download results from all your analysis jobs
              </p>
            </div>
            {hasActiveJobs() && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Processing...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <JobStatusContainer />

            {/* Current Status Info */}
            {hasActiveJobs() && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="text-xs font-medium text-yellow-900 dark:text-yellow-100 mb-2">Current Status</h4>
                {(() => {
                  const activeJob = jobs.find(j => j.status === 'processing' || j.status === 'pending')
                  if (activeJob) {
                    return (
                      <div className="space-y-1 text-xs text-yellow-700 dark:text-yellow-300">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Status: {activeJob.status === 'pending' ? 'Pending' : 'Processing'}
                          </span>
                        </div>
                        <div className="truncate" title={activeJob.fileName}>
                          Processing: {activeJob.fileName}
                        </div>
                        {activeJob.estimatedTimeMinutes && (
                          <div>Est. Time: {activeJob.estimatedTimeMinutes} minutes</div>
                        )}
                        {activeJob.totalRows && (
                          <div>Total Predictions: {activeJob.totalRows}</div>
                        )}
                        <div>Progress: {activeJob.progress}%</div>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
