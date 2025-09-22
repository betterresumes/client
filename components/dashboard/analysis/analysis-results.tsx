'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart3, CheckCircle, Building2 } from 'lucide-react'

interface AnalysisResult {
  company: string
  symbol: string
  sector: string
  defaultRate: string
  riskLevel: string
  modelConfidence: string
  financialRatios: any
  reportingPeriod: string
  marketCap: string
}

interface AnalysisResultsProps {
  showResults: boolean
  analysisResults: AnalysisResult | null
}

export function AnalysisResults({ showResults, analysisResults }: AnalysisResultsProps) {
  if (!showResults) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Ready for Analysis
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Enter company financial data and click "Run ML Analysis" to get started
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* ML Analysis Complete Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-700">ML Analysis Complete</span>
          </div>
          <Badge className="bg-green-100 text-green-800">97.0%</Badge>
        </div>

        {/* Company Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {analysisResults?.symbol} <span className="text-sm text-gray-500">{analysisResults?.sector}</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{analysisResults?.company}</p>
          </div>
        </div>

        {/* Prediction Results */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {analysisResults?.reportingPeriod} Prediction
          </h4>

          <div className="mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Risk Assessment</div>
            <div className="text-sm text-green-600 mb-2">{analysisResults?.riskLevel}</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${analysisResults?.riskLevel === 'LOW' ? 'bg-green-500' :
                  analysisResults?.riskLevel === 'MEDIUM' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                style={{
                  width: `${analysisResults?.riskLevel === 'LOW' ? '25' :
                    analysisResults?.riskLevel === 'MEDIUM' ? '50' : '75'}%`
                }}
              ></div>
            </div>
          </div>

          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
            <div className="text-3xl font-bold text-green-600 mb-1">{analysisResults?.defaultRate}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Default Rate</div>
            <div className="text-xs text-green-600 mt-2">{analysisResults?.riskLevel}</div>
          </div>
        </div>

        {/* Financial Ratios */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Financial Ratios
          </h4>
          <div className="space-y-3">
            {analysisResults?.financialRatios && (
              <>
                {analysisResults.financialRatios.total_debt_to_ebitda && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Debt/EBITDA</span>
                    </div>
                    <span className="text-sm font-medium">{analysisResults.financialRatios.total_debt_to_ebitda}</span>
                  </div>
                )}
                {analysisResults.financialRatios.net_income_margin && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Net Income Margin</span>
                    </div>
                    <span className="text-sm font-medium">{analysisResults.financialRatios.net_income_margin}%</span>
                  </div>
                )}
                {analysisResults.financialRatios.long_term_debt_to_total_capital && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Long-term Debt/Total Capital</span>
                    </div>
                    <span className="text-sm font-medium">{analysisResults.financialRatios.long_term_debt_to_total_capital}%</span>
                  </div>
                )}
                {analysisResults.financialRatios.ebit_to_interest_expense && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">EBIT/Interest Expense</span>
                    </div>
                    <span className="text-sm font-medium">{analysisResults.financialRatios.ebit_to_interest_expense}</span>
                  </div>
                )}
                {analysisResults.financialRatios.return_on_assets && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Return on Assets</span>
                    </div>
                    <span className="text-sm font-medium">{analysisResults.financialRatios.return_on_assets}%</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ML Model Insights */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            ML Model Insights
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Model Confidence</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{analysisResults?.modelConfidence}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Market Cap</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{analysisResults?.marketCap}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Risk Category</span>
              <Badge className={`text-xs ${analysisResults?.riskLevel === 'LOW' ? 'bg-green-100 text-green-800' :
                analysisResults?.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                {analysisResults?.riskLevel} Risk
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
