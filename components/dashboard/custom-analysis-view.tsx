'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnnualPredictionRequest, QuarterlyPredictionRequest } from '@/lib/types/prediction'
import { useCreatePredictionMutations } from '@/hooks/use-prediction-mutations'
import { IndividualAnalysisForm } from './analysis/individual-analysis-form'
import { CompanyAnalysisPanel } from './company-analysis-panel'
import { ProcessingSteps } from './processing-steps'
import { EmptyAnalysisState } from './empty-analysis-state'
import { SAMPLE_DATA } from '@/lib/config/sectors'
import { BulkUploadSection } from './analysis/bulk-upload-section'

export function CustomAnalysisView() {
  const [activeTab, setActiveTab] = useState('individual')
  const [predictionType, setPredictionType] = useState<'annual' | 'quarterly'>('annual')
  const [showResults, setShowResults] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

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

  // Handle form submission for individual analysis
  const handleAnalysis = async () => {
    if (!formData.stockSymbol || !formData.companyName || !formData.sector || !formData.marketCap) {
      toast.error('Please fill in all required fields')
      return
    }

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

      createAnnualPredictionMutation.mutate(requestData, {
        onSuccess: (results) => {
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
            setProcessingStep(0)
          }, 500)
          toast.success('Annual analysis completed successfully!')
        },
        onError: (error: any) => {
          setIsProcessing(false)
          setProcessingStep(0)
          // Extract error message from API response
          const errorMessage = error?.response?.data?.detail || error?.message || 'Analysis failed. Please try again.'
          toast.error(errorMessage)
        }
      })
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

      createQuarterlyPredictionMutation.mutate(requestData, {
        onSuccess: (results) => {
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
            setProcessingStep(0)
          }, 500)
          toast.success('Quarterly analysis completed successfully!')
        },
        onError: (error: any) => {
          setIsProcessing(false)
          setProcessingStep(0)
          // Extract error message from API response
          const errorMessage = error?.response?.data?.detail || error?.message || 'Analysis failed. Please try again.'
          toast.error(errorMessage)
        }
      })
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
    toast.success(`File "${file.name}" uploaded successfully!`)
  }

  // Handle bulk upload submission
  const handleBulkUpload = () => {
    if (!uploadedFile) {
      toast.error('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    bulkUploadMutation.mutate(
      { file: uploadedFile, type: predictionType },
      {
        onSuccess: (results) => {
          setUploadResults(results)
        },
        onError: (error) => {
          setUploadResults({
            success: false,
            error: error.message || 'Upload failed'
          })
        },
        onSettled: () => {
          clearInterval(progressInterval)
          setUploadProgress(100)
          setIsUploading(false)
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

  // Helper functions
  const handleSampleData = () => {
    const sampleData = SAMPLE_DATA[predictionType]
    Object.entries(sampleData).forEach(([key, value]) => {
      setFormData(prev => ({ ...prev, [key]: value }))
    })
    toast.success('Sample data loaded!')
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
    toast.success('Form reset!')
  }

  const handlePredictionTypeChange = (type: 'annual' | 'quarterly') => {
    setPredictionType(type)
    // Reset results to show empty state when switching tabs
    setShowResults(false)
    setAnalysisResults(null)
    setProcessingStep(0)
    setIsProcessing(false)
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

  const isAnalysisLoading = createAnnualPredictionMutation.isPending || createQuarterlyPredictionMutation.isPending

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
          <BulkUploadSection
            predictionType={predictionType}
            onFileUpload={handleFileUpload}
            onBulkUpload={handleBulkUpload}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            bulkUploadPending={bulkUploadMutation.isPending}
            uploadResults={uploadResults}
            onPredictionTypeChange={setPredictionType}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
