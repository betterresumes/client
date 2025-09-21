'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Loader2 } from 'lucide-react'
import { CompanyDetailsForm } from './company-details-form'
import { FinancialRatiosForm } from './financial-ratios-form'

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
  isLoading: boolean
}

export function IndividualAnalysisForm({
  formData,
  predictionType,
  onInputChange,
  onAnalysis,
  isLoading
}: IndividualAnalysisFormProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {predictionType === 'annual' ? '📅 Annual' : '📊 Quarterly'} Company Analysis
        </h3>
        <Badge variant="outline" className={predictionType === 'annual' ? 'text-blue-600' : 'text-green-600'}>
          {predictionType === 'annual' ? 'Annual Model' : 'Quarterly Model'}
        </Badge>
      </div>

      <CompanyDetailsForm
        formData={formData}
        predictionType={predictionType}
        onInputChange={onInputChange}
      />

      <FinancialRatiosForm
        formData={formData}
        predictionType={predictionType}
        onInputChange={onInputChange}
      />

      {/* Submit Button */}
      <Button
        onClick={onAnalysis}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running Analysis...
          </>
        ) : (
          <>
            <TrendingUp className="mr-2 h-4 w-4" />
            Run {predictionType === 'annual' ? 'Annual' : 'Quarterly'} Analysis
          </>
        )}
      </Button>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Real ML Predictions:</strong> This form sends data to our machine learning model
          trained on S&P 500 historical data. {predictionType === 'annual' ? 'Annual' : 'Quarterly'} analysis provides
          predictions using {predictionType === 'annual' ? '5' : '4'} key ratios. Results for companies outside this
          dataset should be interpreted with caution. Required fields are marked with *.
        </p>
      </div>
    </Card>
  )
}
