'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  AlertCircle,
  BarChart3,
  Activity
} from 'lucide-react'
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
  uploadResults
}: BulkUploadSectionProps) {
  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileUpload(files[0])
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* File Upload */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📤 File Upload
          </h3>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* Drag & Drop Upload Area */}
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center mb-6 hover:border-blue-400 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {uploadedFile ? uploadedFile.name : 'Drop your Excel file here or'}
            {!uploadedFile && (
              <label className="cursor-pointer">
                <span className="text-blue-600 underline ml-1">browse</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onFileUpload(file)
                  }}
                />
              </label>
            )}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Supports .xlsx, .xls, and .csv files up to 10MB
          </p>
          {uploadedFile && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-700 font-medium">
                  File ready for upload: {uploadedFile.name}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setUploadedFile(null)}
              >
                Remove File
              </Button>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Uploading...</span>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={onBulkUpload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={!uploadedFile || isUploading || bulkUploadPending}
        >
          {isUploading || bulkUploadPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Upload...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Analyze {predictionType === 'annual' ? 'Annual' : 'Quarterly'} Data
            </>
          )}
        </Button>

        {/* Required Columns Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Required Columns for {predictionType === 'annual' ? 'Annual' : 'Quarterly'} Model:
          </h5>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• company_symbol, company_name, sector, market_cap</li>
            <li>• reporting_year{predictionType === 'quarterly' ? ', reporting_quarter' : ''}</li>
            {predictionType === 'annual' ? (
              <>
                <li>• long_term_debt_to_total_capital, total_debt_to_ebitda</li>
                <li>• net_income_margin, ebit_to_interest_expense, return_on_assets</li>
              </>
            ) : (
              <>
                <li>• long_term_debt_to_total_capital, total_debt_to_ebitda</li>
                <li>• sga_margin, return_on_capital</li>
              </>
            )}
          </ul>
        </div>
      </Card>

      {/* Upload Results */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          📊 Upload Results
        </h3>

        {uploadResults ? (
          uploadResults.success ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                      Upload Successful!
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-200">
                      Your bulk analysis job has been started
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700 dark:text-green-200">Job ID:</span>
                    <span className="font-mono ml-2">{uploadResults.jobId}</span>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-200">Companies:</span>
                    <span className="font-bold ml-2">{uploadResults.totalCompanies}</span>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-200">Est. Duration:</span>
                    <span className="ml-2">{Math.round(uploadResults.estimatedDuration / 60)} min</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <Activity className="mr-2 h-4 w-4" />
                Track Job Progress
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-100">
                    Upload Failed
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-200">
                    {uploadResults.error}
                  </p>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Upload a file to see analysis results here
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
