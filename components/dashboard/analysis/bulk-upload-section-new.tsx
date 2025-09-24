'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, FileSpreadsheet, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRef } from 'react'

interface BulkUploadSectionProps {
  predictionType: 'annual' | 'quarterly'
  onFileUpload: (file: File) => void
  onBulkUpload: (file: File) => void
  uploadedFile: File | null
  setUploadedFile: (file: File | null) => void
  isUploading: boolean
  uploadProgress: number
  bulkUploadPending: boolean
  onPredictionTypeChange: (type: 'annual' | 'quarterly') => void
  showModelTabs?: boolean
  showTemplateButton?: boolean
  isCompact?: boolean
}

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
  showTemplateButton = true,
  isCompact = false
}: BulkUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (onFileUpload) {
      onFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) handleFileSelect(files[0])
  }

  const handleRunAnalysis = () => {
    if (uploadedFile && onBulkUpload) {
      onBulkUpload(uploadedFile)
      // Reset the upload modal after starting analysis
      setUploadedFile(null)
    }
  }

  // Compact mode - just buttons
  if (isCompact) {
    return (
      <div className="flex items-center gap-2">
        {uploadedFile ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700 max-w-24 truncate">
                {uploadedFile.name}
              </span>
            </div>
            <Button
              onClick={handleRunAnalysis}
              size="sm"
              disabled={isUploading || bulkUploadPending}
            >
              {isUploading || bulkUploadPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Run Analysis'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Change
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Choose File
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleFileSelect(file)
              e.target.value = ''
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header with tabs */}
      <div className="mb-4">
        {showModelTabs && (
          <Tabs value={predictionType} onValueChange={(value) => onPredictionTypeChange(value as 'annual' | 'quarterly')} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="annual" className="text-sm">Annual</TabsTrigger>
              <TabsTrigger value="quarterly" className="text-sm">Quarterly</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        {showTemplateButton && (
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={() => downloadTemplate(predictionType)} className="w-full">
              <Download className="h-3 w-3 mr-2" />
              Download Template
            </Button>
          </div>
        )}
      </div>

      {/* Upload Area - Smaller */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${uploadedFile ? 'border-green-400 bg-green-50 dark:bg-green-900/20' :
          'border-gray-300 dark:border-gray-600 hover:border-blue-400'
          }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {uploadedFile ? (
          // File uploaded - show preview with Run Analysis button
          <div className="space-y-3">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                File Ready
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 truncate">
                {uploadedFile.name}
              </p>
              <div className="space-y-2">
                <Button
                  onClick={handleRunAnalysis}
                  size="sm"
                  className="w-full"
                  disabled={isUploading || bulkUploadPending}
                >
                  {isUploading || bulkUploadPending ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    `Run ${predictionType} Analysis`
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  Choose Different File
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Default upload state
          <div className="space-y-2">
            <FileSpreadsheet className="h-8 w-8 text-gray-400 mx-auto" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Upload {predictionType} file
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                Drop file here or click to browse
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                Choose File
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleFileSelect(file)
              e.target.value = ''
            }
          }}
        />
      </div>
    </div>
  )
}
