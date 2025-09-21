'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, FileSpreadsheet, CheckCircle, Loader2, AlertCircle, Activity } from 'lucide-react'
import { toast } from 'sonner'

interface BulkUploadSectionProps {
  predictionType: 'annual' | 'quarterly'
  onFileUpload: (file: File) => void
  onBulkUpload: (file?: File) => void
  uploadedFile: File | null
  setUploadedFile: (file: File | null) => void
  isUploading: boolean
  uploadProgress: number
  bulkUploadPending: boolean
  onPredictionTypeChange: (type: 'annual' | 'quarterly') => void
  showModelTabs?: boolean
  showTemplateButton?: boolean
}

const ANNUAL_TEMPLATE_DATA = [
  {
    company_symbol: 'AAPL',
    company_name: 'Apple Inc.',
    sector: 'Technology',
    market_cap: 3000000,
    reporting_year: 2024,
    reporting_quarter: 'Q1',
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

export function BulkUploadSection({
  predictionType,
  onFileUpload,
  onBulkUpload,
  uploadedFile,
  setUploadedFile,
  isUploading,
  uploadProgress,
  bulkUploadPending,
  onPredictionTypeChange,
  showModelTabs = true,
  showTemplateButton = true
}: BulkUploadSectionProps) {
  const downloadTemplate = (type: 'annual' | 'quarterly') => {
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

  // Template validation function
  const validateTemplate = async (file: File, predictionType: 'annual' | 'quarterly'): Promise<{ valid: boolean, rowCount?: number, error?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim() !== '')

          if (lines.length < 2) {
            resolve({ valid: false, error: 'File must contain at least a header row and one data row' })
            return
          }

          const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
          const requiredHeaders = predictionType === 'annual'
            ? ['company_symbol', 'reporting_year']
            : ['company_symbol', 'reporting_year', 'reporting_quarter']

          const missingHeaders = requiredHeaders.filter(req =>
            !headers.some(h => h === req || h.includes(req.replace('_', '')))
          )

          if (missingHeaders.length > 0) {
            resolve({ valid: false, error: `Missing required columns: ${missingHeaders.join(', ')}` })
            return
          }

          resolve({ valid: true, rowCount: lines.length - 1 })
        } catch (error) {
          resolve({ valid: false, error: 'Failed to read file content' })
        }
      }

      reader.onerror = () => resolve({ valid: false, error: 'Failed to read file' })
      reader.readAsText(file)
    })
  }

  const handleFileSelect = async (file: File) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Please upload a valid CSV or Excel file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    // Validate CSV template structure
    if (file.name.endsWith('.csv')) {
      try {
        const validation = await validateTemplate(file, predictionType)
        if (!validation.valid) {
          toast.error(`Template validation failed: ${validation.error}`)
          return
        }

        if (validation.rowCount && validation.rowCount > 0) {
          toast.success(`Template validated! Found ${validation.rowCount} rows ready for analysis.`)
        }
      } catch (error) {
        toast.error('Failed to validate template structure')
        return
      }
    }

    // Set the file and mark as ready for analysis
    setUploadedFile(file)
    onFileUpload(file)

    // Toast success message
    toast.success(`File "${file.name}" uploaded successfully! Click "Start Analysis" to begin.`)
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) handleFileSelect(files[0])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">

        {(showModelTabs || showTemplateButton) && (
          <div className="flex justify-center gap-4">
            {showModelTabs && (
              <Tabs value={predictionType} onValueChange={(value) => onPredictionTypeChange(value as 'annual' | 'quarterly')} className="w-auto">
                <TabsList className="grid grid-cols-2 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger value="annual" className="text-sm">Annual Model</TabsTrigger>
                  <TabsTrigger value="quarterly" className="text-sm">Quarterly Model</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            {showTemplateButton && (
              <Button variant="outline" onClick={() => downloadTemplate(predictionType)}>
                <Download className="h-4 w-4 mr-2" />
                Download {predictionType === 'annual' ? 'Annual' : 'Quarterly'} Template
              </Button>
            )}
          </div>
        )}

      </div>

      <Card className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isUploading || bulkUploadPending ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' :
            uploadedFile && !isUploading ? 'border-green-400 bg-green-50 dark:bg-green-900/20' :
              'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isUploading || bulkUploadPending ? (
            <div className="space-y-4">
              <Loader2 className="h-16 w-16 text-blue-500 mx-auto animate-spin" />
              <div>
                <h4 className="text-xl font-medium text-blue-900 dark:text-blue-100 mb-2">
                  {isUploading ? 'Processing File...' : 'Running Analysis...'}
                </h4>
                <p className="text-blue-700 dark:text-blue-200">
                  {isUploading ? `${uploadProgress}% complete` : 'Running ML predictions on your data'}
                </p>
                {uploadedFile && (
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">
                    File: {uploadedFile.name}
                  </p>
                )}
              </div>
            </div>
          ) : uploadedFile && !isUploading && !bulkUploadPending ? (
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">File Ready for Analysis</h4>
                <p className="text-gray-700 dark:text-gray-200 mb-2">File: {uploadedFile.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  File uploaded successfully. Click the button below to start analysis.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => onBulkUpload(uploadedFile)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isUploading || bulkUploadPending}
                  >
                    {isUploading || bulkUploadPending ? 'Starting...' : 'Start Analysis'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setUploadedFile(null)} className="border-gray-300 text-gray-700">
                    Upload Different File
                  </Button>
                </div>
              </div>
            </div>
          ) : uploadedFile && !isUploading ? (
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h4 className="text-xl font-medium text-green-900 dark:text-green-100 mb-2">Analysis Complete!</h4>
                <p className="text-green-700 dark:text-green-200 mb-2">File: {uploadedFile.name}</p>
                <p className="text-sm text-green-600 dark:text-green-300 mb-4">
                  Analysis completed successfully. Check the results below.
                </p>
                <Button variant="outline" size="sm" onClick={() => setUploadedFile(null)} className="border-green-300 text-green-700">
                  Upload New File
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto" />
              <div>
                <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Drop your {predictionType} analysis file here</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  or{' '}
                  <label className="cursor-pointer text-blue-600 hover:text-blue-700 underline">
                    browse to upload
                    <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }} />
                  </label>
                </p>
                <p className="text-sm text-gray-500">Supports CSV, XLSX, XLS files up to 10MB</p>
                <p className="text-xs text-gray-400 mt-2">File will be processed immediately after upload</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
