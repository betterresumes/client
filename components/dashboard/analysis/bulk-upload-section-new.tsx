'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, FileSpreadsheet, CheckCircle, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRef } from 'react'

interface BulkUploadSectionProps {
  predictionType: 'annual' | 'quarterly'
  onFileUpload: (file: File) => void
  onBulkUpload: (file: File) => Promise<void> | void
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

// Required column definitions for validation
const ANNUAL_REQUIRED_COLUMNS = [
  'company_symbol',
  'company_name',
  'sector',
  'reporting_year',
  'long_term_debt_to_total_capital',
  'total_debt_to_ebitda',
  'net_income_margin',
  'ebit_to_interest_expense',
  'return_on_assets'
]

const QUARTERLY_REQUIRED_COLUMNS = [
  'company_symbol',
  'company_name',
  'sector',
  'reporting_year',
  'reporting_quarter',
  'long_term_debt_to_total_capital',
  'total_debt_to_ebitda',
  'sga_margin',
  'return_on_capital'
]

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

// Enhanced CSV validation function
const validateCsvColumns = async (file: File, predictionType: 'annual' | 'quarterly'): Promise<{ valid: boolean, missingColumns?: string[], foundColumns?: string[], rowCount?: number, error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim() !== '')

        if (lines.length < 2) {
          resolve({
            valid: false,
            error: 'File must contain at least a header row and one data row'
          })
          return
        }

        // Parse CSV headers more carefully
        const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''))
        const headers = rawHeaders.map(h => h.toLowerCase())
        const requiredColumns = predictionType === 'annual' ? ANNUAL_REQUIRED_COLUMNS : QUARTERLY_REQUIRED_COLUMNS

        console.log(`🔍 CSV Validation for ${predictionType}:`, {
          fileName: file.name,
          foundHeaders: headers,
          rawHeaders: rawHeaders,
          requiredColumns,
          fileRowCount: lines.length - 1,
          headerCount: headers.length,
          requiredCount: requiredColumns.length
        })

        // Check for missing columns (exact match required)
        const missingColumns = requiredColumns.filter(req =>
          !headers.includes(req.toLowerCase())
        )

        if (missingColumns.length > 0) {
          resolve({
            valid: false,
            missingColumns,
            foundColumns: headers,
            error: `Missing required columns: ${missingColumns.join(', ')}. Found columns: ${rawHeaders.join(', ')}`
          })
          return
        }

        // Check for extra unexpected columns that might indicate wrong file type
        const expectedColumns = requiredColumns.map(col => col.toLowerCase())
        const extraColumns = headers.filter(h => !expectedColumns.includes(h))

        if (extraColumns.length > 0) {
          console.log(`⚠️ Found unexpected columns: ${extraColumns.join(', ')}`)
        }

        // Check row count
        const rowCount = lines.length - 1
        if (rowCount > 10000) {
          resolve({
            valid: false,
            error: 'File contains too many rows. Maximum allowed is 10,000 rows.'
          })
          return
        }

        resolve({ valid: true, rowCount, foundColumns: headers })
      } catch (error) {
        resolve({
          valid: false,
          error: 'Failed to parse CSV file. Please ensure it\'s properly formatted.'
        })
      }
    }

    reader.onerror = () => resolve({
      valid: false,
      error: 'Failed to read file. Please try again.'
    })

    reader.readAsText(file)
  })
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

  const handleFileSelect = async (file: File) => {
    // File type validation
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Please upload a valid CSV or Excel file')
      return
    }

    // File size validation (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB')
      return
    }

    // STRICT CSV validation - prevent invalid files from being uploaded
    if (file.name.toLowerCase().endsWith('.csv')) {
      try {
        toast.loading('🔍 Validating CSV structure...', { id: 'csv-validation' })

        const validation = await validateCsvColumns(file, predictionType)
        toast.dismiss('csv-validation')

        if (!validation.valid) {
          // REJECT the file - don't allow upload of invalid CSV
          if (validation.missingColumns && validation.missingColumns.length > 0) {
            const requiredCount = predictionType === 'annual' ? ANNUAL_REQUIRED_COLUMNS.length : QUARTERLY_REQUIRED_COLUMNS.length

            toast.error(`🚫 Invalid ${predictionType.toUpperCase()} CSV File`, {
              description: `Cannot upload "${file.name}". Missing ${validation.missingColumns.length} required columns: ${validation.missingColumns.join(', ')}. Please use the correct template.`,
              duration: 12000,
              action: {
                label: `Download ${predictionType} Template`,
                onClick: () => downloadTemplate(predictionType)
              }
            })
          } else {
            toast.error(`🚫 Invalid CSV File`, {
              description: `Cannot upload "${file.name}". ${validation.error}`,
              duration: 10000,
            })
          }
          return // BLOCK the file upload completely
        }

        // CSV is valid - allow upload and show success
        if (validation.rowCount) {
          toast.success(`✅ Valid ${predictionType.toUpperCase()} CSV!`, {
            description: `"${file.name}" has all required columns. Found ${validation.rowCount} data rows.`,
            duration: 5000,
          })
        }

      } catch (error) {
        toast.dismiss('csv-validation')
        toast.error('❌ CSV Validation Error', {
          description: `Cannot validate "${file.name}". Please ensure it's a properly formatted CSV file.`,
          duration: 8000
        })
        return // BLOCK the file upload
      }
    } else {
      // For Excel files, show warning about server-side validation
      toast.info(`📋 Excel File Selected`, {
        description: `"${file.name}" will be validated on the server. Ensure it has all required ${predictionType} columns.`,
        duration: 4000,
      })
    }

    // If validation passed or it's an Excel file, proceed with upload
    if (onFileUpload) {
      onFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await handleFileSelect(files[0])
    }
  }

  const handleRunAnalysis = async () => {
    if (!uploadedFile) {
      toast.error('No file selected. Please upload a file first.')
      return
    }

    // Show validation in progress
    toast.loading('🔍 Validating file structure...', { id: 'validation-check' })

    try {
      // MANDATORY validation for ALL files (CSV and Excel)
      let isValid = false
      let validationError = ''
      let missingCols: string[] = []

      if (uploadedFile.name.toLowerCase().endsWith('.csv')) {
        // Enhanced CSV validation
        const validation = await validateCsvColumns(uploadedFile, predictionType)
        isValid = validation.valid
        missingCols = validation.missingColumns || []
        validationError = validation.error || ''

        console.log('🔍 CSV Validation Result:', {
          fileName: uploadedFile.name,
          predictionType,
          isValid,
          missingColumns: missingCols,
          foundColumns: validation.foundColumns
        })
      } else {
        // For Excel files, we can't validate structure client-side, but we should warn users
        console.log('📋 Excel file detected - server-side validation will occur')

        toast.info(`📋 Excel File - Server Validation Required`, {
          description: `"${uploadedFile.name}" will be validated on the server. If columns are missing, you'll get a detailed error message.`,
          duration: 5000,
        })

        isValid = true // Allow Excel files to proceed (server will validate and show proper errors)
      }

      // Dismiss validation loading
      toast.dismiss('validation-check')

      // Block analysis if validation failed
      if (!isValid) {
        if (missingCols.length > 0) {
          const requiredCount = predictionType === 'annual' ? ANNUAL_REQUIRED_COLUMNS.length : QUARTERLY_REQUIRED_COLUMNS.length
          toast.error(`🚫 Analysis Blocked - Invalid ${predictionType.toUpperCase()} File`, {
            description: `Missing ${missingCols.length} required columns: ${missingCols.join(', ')}. Your file has invalid structure for ${predictionType} predictions.`,
            duration: 15000,
            action: {
              label: `Download ${predictionType} Template`,
              onClick: () => downloadTemplate(predictionType)
            }
          })
        } else {
          toast.error(`🚫 Analysis Blocked - ${validationError}`, {
            description: 'Please fix the file issues before starting analysis.',
            duration: 10000
          })
        }
        return // STOP HERE - Don't proceed with analysis
      }

      // File is valid - show confirmation before starting
      toast.success(`✅ File validated successfully!`, {
        description: `Starting ${predictionType} analysis for ${uploadedFile.name}...`,
        duration: 3000
      })

      // Proceed with analysis only after successful validation
      if (onBulkUpload) {
        console.log(`🚀 Starting ${predictionType} analysis for validated file:`, uploadedFile.name)

        try {
          // Call the bulk upload function and handle any API errors
          await onBulkUpload(uploadedFile)

          // Reset the upload modal after successful start
          setUploadedFile(null)

        } catch (uploadError: any) {
          // Handle API errors from the upload process
          console.error('📤 Bulk upload API error:', {
            uploadError,
            response: uploadError?.response?.data,
            detail: uploadError?.detail,
            message: uploadError?.message
          })

          // Extract detailed error message from various possible sources
          let errorMessage = 'Unknown upload error'

          if (uploadError?.response?.data?.detail) {
            errorMessage = uploadError.response.data.detail
          } else if (uploadError?.detail) {
            errorMessage = uploadError.detail
          } else if (uploadError?.message) {
            errorMessage = uploadError.message
          } else if (typeof uploadError === 'string') {
            errorMessage = uploadError
          }

          console.log('🔍 Extracted error message:', errorMessage)

          // Check if it's a missing columns error
          if (errorMessage.includes('Missing required columns')) {
            const missingColumnsMatch = errorMessage.match(/Missing required columns: (.+)/)
            const missingColumns = missingColumnsMatch ? missingColumnsMatch[1] : 'unknown columns'

            toast.error(`🚫 Server Validation Failed`, {
              description: `"${uploadedFile.name}" is missing required ${predictionType} columns: ${missingColumns}. Please download the correct template and ensure your file has all required columns.`,
              duration: 15000,
              action: {
                label: `Download ${predictionType} Template`,
                onClick: () => downloadTemplate(predictionType)
              }
            })
          } else if (errorMessage.toLowerCase().includes('column')) {
            // Generic column-related error
            toast.error(`🚫 Column Validation Failed`, {
              description: `${errorMessage}. Please check your file structure and use the correct ${predictionType} template.`,
              duration: 12000,
              action: {
                label: `Download ${predictionType} Template`,
                onClick: () => downloadTemplate(predictionType)
              }
            })
          } else {
            // Show other API errors with full detail
            toast.error(`❌ Upload Failed`, {
              description: `Server error: ${errorMessage}`,
              duration: 10000
            })
          }
          return // Don't reset file on error so user can fix and retry
        }
      }

    } catch (error) {
      toast.dismiss('validation-check')
      toast.error('❌ Validation Failed', {
        description: 'Unable to validate file structure. Please check your file format and try again.',
        duration: 8000
      })
      console.error('File validation error:', error)
      return // Don't proceed with analysis
    }
  }

  const handleRemoveFile = () => {
    const removedFileName = uploadedFile?.name || 'file'
    setUploadedFile(null)
    toast.success(`🗑️ File removed`, {
      description: `"${removedFileName}" has been removed. You can now upload a different file.`,
      duration: 3000
    })
  }

  // Compact mode - just buttons
  if (isCompact) {
    return (
      <div className="flex items-center gap-2">
        {uploadedFile ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700 max-w-32 truncate" title={uploadedFile.name}>
                {uploadedFile.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-red-500 hover:bg-red-100 rounded-full"
                onClick={handleRemoveFile}
                title="Remove file"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Button
              onClick={handleRunAnalysis}
              size="sm"
              disabled={isUploading || bulkUploadPending}
              className="bg-blue-600 hover:bg-blue-700"
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
              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
              title="Select a different file"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
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
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) {
              const previousFile = uploadedFile
              if (previousFile) {
                toast.info(`🔄 Changing file from "${previousFile.name}" to "${file.name}"...`)
              }
              await handleFileSelect(file)
              e.target.value = '' // Clear input to allow selecting same file again
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
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${uploadedFile ? 'border-green-400 bg-green-50 dark:bg-green-900/20 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' :
          'border-gray-300 dark:border-gray-600 hover:border-blue-400'
          }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        title={uploadedFile ? 'Drop a new file here to replace the current one' : 'Drop your file here or click to browse'}
      >
        {uploadedFile ? (
          // File uploaded - show preview with Run Analysis button
          <div className="space-y-3">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                ✅ File Ready for {predictionType.charAt(0).toUpperCase() + predictionType.slice(1)} Analysis
              </h4>
              <div className="bg-white dark:bg-gray-800 border rounded px-2 py-1 mb-2 max-w-xs mx-auto">
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate font-medium" title={uploadedFile.name}>
                  📄 {uploadedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                💡 Need to use a different file? Use the buttons below to change or remove
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
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Clear current file first, then open file selector
                      fileInputRef.current?.click()
                    }}
                    className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                  >
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    Change File
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                    title="Remove this file and start over"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove File
                  </Button>
                </div>
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
                📂 Drop file here or click to browse
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                Supports CSV, Excel (.xlsx, .xls) files
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
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
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) {
              await handleFileSelect(file)
              e.target.value = ''
            }
          }}
        />
      </div>
    </div>
  )
}
