'use client'

import { useState, useEffect } from 'react'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  TrendingUp,
  BarChart3,
  Calendar,
  Activity,
  Loader2
} from 'lucide-react'

export function CompanyDetailsView() {
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedPrediction, setSelectedPrediction] = useState('annual')

  const {
    annualPredictions,
    quarterlyPredictions,
    isLoading,
    fetchPredictions
  } = usePredictionsStore()

  // Fetch predictions on component mount if not already loaded
  useEffect(() => {
    if (annualPredictions.length === 0 && quarterlyPredictions.length === 0 && !isLoading) {
      fetchPredictions()
    }
  }, [annualPredictions.length, quarterlyPredictions.length, isLoading, fetchPredictions])

  // Ensure predictions are arrays
  const safePredictions = Array.isArray(annualPredictions) ? annualPredictions : []
  const safeQuarterlyPredictions = Array.isArray(quarterlyPredictions) ? quarterlyPredictions : []

  // Get unique companies from predictions
  const companies = safePredictions.map((pred: any) => ({
    id: pred.company_symbol || pred.id,
    name: pred.company_symbol,
    subtitle: pred.company_name,
    sector: pred.sector,
    defaultRate: `${(pred.default_probability * 100).toFixed(2)}%`,
    riskCategory: pred.risk_category
  }))

  // Set first company as selected if none selected
  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0].id)
    }
  }, [companies, selectedCompany])

  const currentCompany = companies.find((comp: any) => comp.id === selectedCompany)
  const currentPrediction = safePredictions.find((pred: any) =>
    (pred.company_symbol || pred.id) === selectedCompany
  )

  return (
    <div className="space-y-6">
      {/* Company Details Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bricolage font-bold text-gray-900 dark:text-white">
            Company Details
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Detailed analysis and risk assessment for individual companies
          </p>
        </div>
      </div>

      {/* Company Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select S&P 500 Company
          </h3>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading companies...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {companies.map((company: any) => (
              <Card
                key={company.id}
                className={`p-4 cursor-pointer transition-colors ${selectedCompany === company.id
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                onClick={() => setSelectedCompany(company.id)}
              >
                <div className="text-center">
                  <div className="font-semibold text-sm mb-1">{company.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {company.subtitle}
                  </div>
                  {selectedCompany === company.id && (
                    <div className="mt-2">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {company.defaultRate}
                      </Badge>
                      <div className="text-xs mt-1 text-white">{company.riskCategory}</div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Company Analysis Results */}
      {currentCompany && currentPrediction && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Info Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentCompany.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentCompany.subtitle}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-600">
                {currentCompany.sector}
              </Badge>
            </div>

            {/* Prediction */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {currentPrediction.reporting_year} {currentPrediction.model_type || 'Annual'} Prediction
              </h4>

              <div className="mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Risk Assessment</div>
                <div className="text-sm text-green-600 mb-2">{currentPrediction.risk_category}</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${100 - ((currentPrediction.default_probability || 0) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {((currentPrediction.default_probability || 0) * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Default Rate
                </div>
                <div className="text-xs text-yellow-600 mt-2">
                  {currentPrediction.risk_category}
                </div>
              </div>
            </div>

          </Card>

          {/* ML Model Insights */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ML Model Insights
            </h3>

            <div className="space-y-6">
              {/* Model Confidence */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Model Confidence
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {((currentPrediction.confidence || 0) * 100).toFixed(1)}%
                </div>
              </div>

              {/* Primary Risk Factors */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Primary Risk Factors
                </div>
                <Badge className="bg-red-100 text-red-800">
                  {currentPrediction.risk_category}
                </Badge>
              </div>

              {/* Model Version */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Model Version: {currentPrediction.model_version || 'v1.0'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Last Updated: {currentPrediction.updated_at ? new Date(currentPrediction.updated_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            {/* Key Risk Factors */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Key Risk Analysis
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Model confidence: {((currentPrediction.confidence || 0) * 100).toFixed(1)}%</li>
                <li>• Risk category: {currentPrediction.risk_category}</li>
                <li>• Default probability: {((currentPrediction.default_probability || 0) * 100).toFixed(2)}%</li>
                <li>• Sector: {currentCompany.sector} analysis</li>
              </ul>
            </div>
          </Card>
        </div>
      )}

      {/* Additional Predictions Selection */}
      {currentCompany && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Prediction Type
          </h3>
          <div className="flex items-center space-x-4">
            <Select value={selectedPrediction} onValueChange={setSelectedPrediction}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select prediction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual Predictions</SelectItem>
                <SelectItem value="quarterly">Quarterly Predictions</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              Refresh Data
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
