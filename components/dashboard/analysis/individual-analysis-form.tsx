'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp, Loader2, Building2, Calculator, Sparkles, RotateCcw } from 'lucide-react'
import { SECTORS, SAMPLE_DATA } from '@/lib/config/sectors'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface IndividualAnalysisFormProps {
  formData: {
    stockSymbol: string
    marketCap: string
    companyName: string
    sector: string
    reportingYear: string
    reportingQuarter: string
    ebitInterestExpense: string
    totalDebtEbitda: string
    returnOnAssets: string
    netIncomeMargin: string
    longTermDebtTotalCapital: string
    sgaMargin: string
    returnOnCapital: string
  }
  predictionType: 'annual' | 'quarterly'
  onInputChange: (field: string, value: string) => void
  onAnalysis: () => void
  onSampleData: () => void
  onReset: () => void
  onPredictionTypeChange: (type: 'annual' | 'quarterly') => void
  isLoading: boolean
  errorMessage?: string
  editMode?: { isEditing: boolean; predictionId: string | null }
  isSubmitting?: boolean
}

export function IndividualAnalysisForm({
  formData,
  predictionType,
  onInputChange,
  onAnalysis,
  onSampleData,
  onReset,
  onPredictionTypeChange,
  isLoading,
  errorMessage,
  editMode,
  isSubmitting = false
}: IndividualAnalysisFormProps) {
  const isFormValid = () => {
    const requiredFields = ['stockSymbol', 'companyName', 'sector', 'marketCap']
    return requiredFields.every(field => formData[field as keyof typeof formData])
  }

  return (
    <Card className="p-6 h-full shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Individual Analysis
              </h3>
              {editMode?.isEditing && (
                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                  Edit Mode
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {editMode?.isEditing
                ? "Update existing prediction with new values"
                : "Custom company risk assessment"
              }
            </p>
          </div>
        </div>

        {/* Prediction Type Tabs */}
        <Tabs value={predictionType} onValueChange={(value) => onPredictionTypeChange(value as 'annual' | 'quarterly')} className="w-auto">
          <TabsList className="grid grid-cols-2 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="annual" className="text-sm ">
              Annual
            </TabsTrigger>
            <TabsTrigger value="quarterly" className="text-sm">
              Quarterly
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-8">
        {/* Company Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-gray-500" />
            <h4 className="font-medium text-gray-900 dark:text-white">Company Information</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stockSymbol" className="text-sm font-medium">Stock Symbol *</Label>
              <Input
                id="stockSymbol"
                placeholder="e.g., AAPL"
                value={formData.stockSymbol}
                onChange={(e) => onInputChange('stockSymbol', e.target.value.toUpperCase())}
                className="font-mono"
                disabled={editMode?.isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="e.g., Apple Inc."
                value={formData.companyName}
                onChange={(e) => onInputChange('companyName', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sector" className="text-sm font-medium">Sector *</Label>
              <Select value={formData.sector} onValueChange={(value) => onInputChange('sector', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marketCap" className="text-sm font-medium">Market Cap (Millions) *</Label>
              <Input
                id="marketCap"
                type="number"
                placeholder="e.g., 3000000"
                value={formData.marketCap}
                onChange={(e) => onInputChange('marketCap', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportingYear" className="text-sm font-medium">Reporting Year</Label>
              <Input
                id="reportingYear"
                type="number"
                placeholder="e.g., 2024"
                min="2020"
                max="2030"
                value={formData.reportingYear}
                onChange={(e) => onInputChange('reportingYear', e.target.value)}
                disabled={editMode?.isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportingQuarter" className="text-sm font-medium">Reporting Quarter</Label>
              <Select
                value={formData.reportingQuarter}
                onValueChange={(value) => onInputChange('reportingQuarter', value)}
                disabled={editMode?.isEditing}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Financial Ratios Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4 text-gray-500" />
            <h4 className="font-medium text-gray-900 dark:text-white">
              Financial Ratios
            </h4>
          </div>

          {predictionType === 'annual' ? (
            // Annual Model Ratios (5 ratios)
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ebitInterestExpense" className="text-sm font-medium">EBIT/Interest Expense</Label>
                  <Input
                    id="ebitInterestExpense"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 15.80"
                    value={formData.ebitInterestExpense}
                    onChange={(e) => onInputChange('ebitInterestExpense', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalDebtEbitda" className="text-sm font-medium">Total Debt/EBITDA</Label>
                  <Input
                    id="totalDebtEbitda"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 2.10"
                    value={formData.totalDebtEbitda}
                    onChange={(e) => onInputChange('totalDebtEbitda', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="returnOnAssets" className="text-sm font-medium">Return on Assets (%)</Label>
                  <Input
                    id="returnOnAssets"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 12.50"
                    value={formData.returnOnAssets}
                    onChange={(e) => onInputChange('returnOnAssets', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="netIncomeMargin" className="text-sm font-medium">Net Income Margin (%)</Label>
                  <Input
                    id="netIncomeMargin"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 25.30"
                    value={formData.netIncomeMargin}
                    onChange={(e) => onInputChange('netIncomeMargin', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="longTermDebtTotalCapital" className="text-sm font-medium">Long-term Debt/Total Capital (%)</Label>
                  <Input
                    id="longTermDebtTotalCapital"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 18.75"
                    value={formData.longTermDebtTotalCapital}
                    onChange={(e) => onInputChange('longTermDebtTotalCapital', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Quarterly Model Ratios (4 ratios)
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalDebtEbitda" className="text-sm font-medium">Total Debt/EBITDA</Label>
                  <Input
                    id="totalDebtEbitda"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 2.10"
                    value={formData.totalDebtEbitda}
                    onChange={(e) => onInputChange('totalDebtEbitda', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sgaMargin" className="text-sm font-medium">SG&A Margin (%)</Label>
                  <Input
                    id="sgaMargin"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 15.25"
                    value={formData.sgaMargin}
                    onChange={(e) => onInputChange('sgaMargin', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="returnOnCapital" className="text-sm font-medium">Return on Capital (%)</Label>
                  <Input
                    id="returnOnCapital"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 18.50"
                    value={formData.returnOnCapital}
                    onChange={(e) => onInputChange('returnOnCapital', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longTermDebtTotalCapital" className="text-sm font-medium">Long-term Debt/Total Capital (%)</Label>
                  <Input
                    id="longTermDebtTotalCapital"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 18.75"
                    value={formData.longTermDebtTotalCapital}
                    onChange={(e) => onInputChange('longTermDebtTotalCapital', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Error:</strong> {errorMessage}
              </p>
            </div>
          )}

          <Button
            onClick={onAnalysis}
            className={`w-full h-12 text-white font-medium cursor-pointer ${predictionType === 'annual'
              ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
              : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
              }`}
            disabled={isLoading || isSubmitting || !isFormValid()}
          >
            {(isLoading || isSubmitting) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editMode?.isEditing
                  ? `Updating ${predictionType === 'annual' ? 'Annual' : 'Quarterly'} Prediction...`
                  : `Running ${predictionType === 'annual' ? 'Annual' : 'Quarterly'} Analysis...`
                }
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                {editMode?.isEditing
                  ? `Update ${predictionType === 'annual' ? 'Annual' : 'Quarterly'} Prediction`
                  : `Run ${predictionType === 'annual' ? 'Annual' : 'Quarterly'} Analysis`
                }
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onSampleData}
              disabled={isLoading}
              className="h-10"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Sample Data
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={isLoading}
              className="h-10"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Form
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className={`p-4 rounded-lg ${predictionType === 'annual'
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : 'bg-green-50 dark:bg-green-900/20'
          }`}>
          <p className={`text-sm ${predictionType === 'annual'
            ? 'text-blue-800 dark:text-blue-200'
            : 'text-green-800 dark:text-green-200'
            }`}>
            <strong>ML Prediction Model:</strong> This form sends data to our machine learning model
            trained on S&P 500 historical data. {predictionType === 'annual' ? 'Annual' : 'Quarterly'} analysis uses
            {predictionType === 'annual' ? ' 5' : ' 4'} key financial ratios to predict default probability.
            Fields marked with * are required.
          </p>
        </div>
      </div>
    </Card>
  )
}
