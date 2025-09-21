'use client'

import { useMemo, useEffect } from 'react'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import {
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  Zap,
  DollarSign,
  PieChart,
  RefreshCw,
  Building2
} from 'lucide-react'

export function RiskInsightsView() {
  const {
    annualPredictions,
    isLoading,
    refetchPredictions,
    fetchPredictions
  } = usePredictionsStore()

  // Fetch predictions on component mount if not already loaded
  useEffect(() => {
    if (annualPredictions.length === 0 && !isLoading) {
      fetchPredictions()
    }
  }, [annualPredictions.length, isLoading, fetchPredictions])

  // Ensure predictions are arrays
  const safePredictions = Array.isArray(annualPredictions) ? annualPredictions : []

  // Calculate risk insights from real data
  const riskInsights = useMemo(() => {
    if (safePredictions.length === 0) return null

    // High risk companies (default rate > 5% or risk category HIGH/CRITICAL)
    const highRiskCompanies = safePredictions.filter((pred: any) =>
      pred.default_probability > 0.05 ||
      pred.risk_category === 'HIGH' ||
      pred.risk_category === 'CRITICAL'
    ).slice(0, 5)

    // Top performing companies (lowest default rates with high confidence)
    const topPerformingCompanies = safePredictions
      .filter((pred: any) => pred.confidence > 0.8)
      .sort((a: any, b: any) => a.default_probability - b.default_probability)
      .slice(0, 5)

    // Model performance metrics
    const avgConfidence = safePredictions.reduce((acc: number, pred: any) => acc + pred.confidence, 0) / safePredictions.length
    const highConfidencePredictions = safePredictions.filter((pred: any) => pred.confidence > 0.8).length
    const lowRiskCompanies = safePredictions.filter((pred: any) => pred.risk_category === 'LOW').length

    return {
      highRiskCompanies,
      topPerformingCompanies,
      avgConfidence,
      highConfidencePredictions,
      lowRiskCompanies,
      totalCompanies: safePredictions.length
    }
  }, [safePredictions])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bricolage font-bold text-gray-900 dark:text-white">
              Risk Insights
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Deep dive into risk patterns and model performance metrics
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading risk insights...</p>
        </div>
      </div>
    )
  }

  if (!riskInsights) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bricolage font-bold text-gray-900 dark:text-white">
              Risk Insights
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Deep dive into risk patterns and model performance metrics
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No data available for risk insights</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Risk Insights Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bricolage font-bold text-gray-900 dark:text-white">
            Risk Insights
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Deep dive into risk patterns and model performance metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchPredictions()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </div>

      {/* High Risk & Top Performing Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Risk S&P 500 Companies */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              High Risk S&P 500 Companies
            </h3>
          </div>

          {riskInsights.highRiskCompanies.length > 0 ? (
            <div className="space-y-4">
              {riskInsights.highRiskCompanies.map((company: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {company.company_symbol}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {company.company_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-100 text-red-800">
                      {(company.default_probability * 100).toFixed(2)}%
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {company.risk_category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">
                <AlertTriangle className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                No high-risk companies found
              </p>
            </div>
          )}
        </Card>

        {/* Top Performing Companies */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Performing Companies
            </h3>
          </div>

          {riskInsights.topPerformingCompanies.length > 0 ? (
            <div className="space-y-4">
              {riskInsights.topPerformingCompanies.map((company: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {company.company_symbol}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {company.company_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800">
                      {(company.default_probability * 100).toFixed(2)}%
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {(company.confidence * 100).toFixed(1)}% confidence
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">
                <TrendingUp className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                No top performing companies found
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Model Performance & Features */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Model Performance & Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* High Confidence Predictions */}
          <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {((riskInsights.highConfidencePredictions / riskInsights.totalCompanies) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">High Confidence Predictions</div>
          </div>

          {/* Average Confidence Score */}
          <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {riskInsights.avgConfidence.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Confidence Score</div>
          </div>

          {/* Low Risk Companies */}
          <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {((riskInsights.lowRiskCompanies / riskInsights.totalCompanies) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Low Risk Companies</div>
          </div>
        </div>
      </Card>

      {/* Key Model Features & Custom Analysis Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Model Features */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Key Model Features
          </h3>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Debt-to-Equity Ratio (25% weight)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Quick Ratio (20% weight)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Return on Equity (20% weight)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Interest Coverage (15% weight)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Return on Assets (10% weight)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Profit Margin (10% weight)
              </span>
            </div>
          </div>
        </Card>

        {/* Custom Analysis Capabilities */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Custom Analysis Capabilities
          </h3>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Analyze any company using financial ratios
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Real-time default rate predictions
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Risk category classification
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Detailed financial ratio analysis
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Building2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-gray-900 dark:text-white">S&P 500</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Dataset Coverage</div>
        </Card>

        <Card className="p-4 text-center">
          <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-gray-900 dark:text-white">Real-time</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Analysis Speed</div>
        </Card>

        <Card className="p-4 text-center">
          <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-gray-900 dark:text-white">6 Features</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Key Ratios</div>
        </Card>

        <Card className="p-4 text-center">
          <PieChart className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-gray-900 dark:text-white">ML-Powered</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Predictions</div>
        </Card>
      </div>

      {/* Risk Assessment Framework */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Risk Assessment Framework
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="w-4 h-4 bg-green-500 rounded mx-auto mb-2"></div>
            <div className="font-semibold text-green-700 mb-1">Low Risk</div>
            <div className="text-sm text-gray-600">0-1.5%</div>
            <div className="text-xs text-gray-500 mt-1">Default Rate</div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="w-4 h-4 bg-yellow-500 rounded mx-auto mb-2"></div>
            <div className="font-semibold text-yellow-700 mb-1">Medium Risk</div>
            <div className="text-sm text-gray-600">1.5-5%</div>
            <div className="text-xs text-gray-500 mt-1">Default Rate</div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="w-4 h-4 bg-orange-500 rounded mx-auto mb-2"></div>
            <div className="font-semibold text-orange-700 mb-1">High Risk</div>
            <div className="text-sm text-gray-600">5-10%</div>
            <div className="text-xs text-gray-500 mt-1">Default Rate</div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="w-4 h-4 bg-red-500 rounded mx-auto mb-2"></div>
            <div className="font-semibold text-red-700 mb-1">Critical Risk</div>
            <div className="text-sm text-gray-600">&gt;10%</div>
            <div className="text-xs text-gray-500 mt-1">Default Rate</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
