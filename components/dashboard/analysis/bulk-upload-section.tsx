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
  onBulkUpload: () => void
  uploadedFile: File | null
  setUploadedFile: (file: File | null) => void
  isUploading: boolean
  uploadProgress: number
  bulkUploadPending: boolean
  uploadResults: any
  onPredictionTypeChange: (type: 'annual' | 'quarterly') => void
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
  uploadResults,
  onPredictionTypeChange
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

    onFileUpload(file)
    setTimeout(() => onBulkUpload(), 500)
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
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk Analysis Upload</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Upload CSV or Excel files for batch analysis</p>
        </div>



        <div className="flex justify-center gap-4">
          <Tabs value={predictionType} onValueChange={(value) => onPredictionTypeChange(value as 'annual' | 'quarterly')} className="w-auto">
            <TabsList className="grid grid-cols-2 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="annual" className="text-sm">Annual Model</TabsTrigger>
              <TabsTrigger value="quarterly" className="text-sm">Quarterly Model</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={() => downloadTemplate(predictionType)}>
            <Download className="h-4 w-4 mr-2" />
            Download {predictionType === 'annual' ? 'Annual' : 'Quarterly'} Template
          </Button>
        </div>

      </div>

      <Card className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isUploading || bulkUploadPending ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' :
            uploadedFile ? 'border-green-400 bg-green-50 dark:bg-green-900/20' :
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
                  {isUploading ? 'Uploading File...' : 'Processing Analysis...'}
                </h4>
                <p className="text-blue-700 dark:text-blue-200">
                  {isUploading ? `${uploadProgress}% complete` : 'Running ML predictions on your data'}
                </p>
              </div>
            </div>
          ) : uploadedFile ? (
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h4 className="text-xl font-medium text-green-900 dark:text-green-100 mb-2">File Ready: {uploadedFile.name}</h4>
                <p className="text-green-700 dark:text-green-200 mb-4">File validated successfully and analysis started</p>
                <Button variant="outline" size="sm" onClick={() => setUploadedFile(null)} className="border-green-300 text-green-700">
                  Upload Different File
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
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
