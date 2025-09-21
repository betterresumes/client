'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CompanyAnalysisTable } from './company-analysis-table'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Loader2
} from 'lucide-react'

export function DashboardOverview() {
  const { user } = useAuthStore()
  const {
    annualPredictions,
    quarterlyPredictions,
    isLoading,
    error,
    fetchPredictions,
    refetchPredictions,
    getPredictionProbability,
    getRiskBadgeColor,
    formatPredictionDate
  } = usePredictionsStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSector, setSelectedSector] = useState('all')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeAnalysisType, setActiveAnalysisType] = useState('annual')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch predictions on component mount
  useEffect(() => {
    if (isClient) {
      fetchPredictions()
    }
  }, [isClient, fetchPredictions])

  // Ensure predictions are always arrays
  const safeAnnualPredictions = Array.isArray(annualPredictions) ? annualPredictions : []
  const safeQuarterlyPredictions = Array.isArray(quarterlyPredictions) ? quarterlyPredictions : []

  // Calculate dashboard summary stats from real data
  const summaryStats = [
    {
      title: 'Total Companies',
      value: safeAnnualPredictions.length.toString(),
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      title: 'Total Predictions',
      value: (safeAnnualPredictions.length + safeQuarterlyPredictions.length).toString(),
      icon: BarChart3,
      color: 'text-green-600'
    },
    {
      title: 'Average Default Rate',
      value: safeAnnualPredictions.length > 0 ?
        `${(safeAnnualPredictions.reduce((acc: number, pred: any) => acc + getPredictionProbability(pred), 0) / safeAnnualPredictions.length * 100).toFixed(2)}%` :
        '0%',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      title: 'High Risk Companies',
      value: safeAnnualPredictions.filter((pred: any) => (pred.risk_level || pred.risk_category || '').toUpperCase() === 'HIGH').length.toString(),
      icon: TrendingDown,
      color: 'text-red-600'
    },
    {
      title: 'Sectors Covered',
      value: safeAnnualPredictions.length > 0 ? new Set(safeAnnualPredictions.map((pred: any) => pred.sector || 'Unknown')).size.toString() : '0',
      icon: Activity,
      color: 'text-indigo-600'
    }
  ]

  // Format company data for display
  const companyData = safeAnnualPredictions.map((pred: any, index: number) => ({
    id: index + 1,
    company: pred.company_symbol,
    subtitle: pred.company_name,
    reportingPeriod: formatPredictionDate(pred),
    sector: pred.sector || 'N/A',
    defaultRate: `${(getPredictionProbability(pred) * 100).toFixed(2)}%`,
    riskCategory: pred.risk_level || pred.risk_category,
    confidence: pred.confidence,
    keyRatios: pred.financial_ratios,
    riskColor: getRiskBadgeColor(pred.risk_level || pred.risk_category || 'unknown')
  }))

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  } return (
    <div className="space-y-6 font-bricolage">
      {/* S&P 500 Default Rate Analysis Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            S&P 500 Default Rate Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ML-powered default rate predictions based on annual financial ratios
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last Updated: {new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}, {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Summary Statistics</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={refetchPredictions}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {summaryStats.map((stat, index) => (
            <Card key={index} className="p-6 text-left">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Company Analysis with Annual/Quarterly Tabs */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Company Analysis</h2>
        </div>

        {/* Filters and Search with Tabs */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search companies or symbols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Select value={selectedSector} onValueChange={setSelectedSector} disabled={isLoading}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Health Care</SelectItem>
                <SelectItem value="financials">Financials</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="consumer">Consumer Discretionary</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel} disabled={isLoading}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Annual/Quarterly Tabs moved here with gap */}
          <div className="ml-8">
            <Tabs value={activeAnalysisType} onValueChange={setActiveAnalysisType} className="w-auto">
              <TabsList className="inline-flex rounded-lg p-1 bg-gray-50 dark:bg-gray-800">
                <TabsTrigger
                  value="annual"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm"
                  disabled={isLoading}
                >
                  Annual
                </TabsTrigger>
                <TabsTrigger
                  value="quarterly"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm"
                  disabled={isLoading}
                >
                  Quarterly
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>        <Tabs value={activeAnalysisType} onValueChange={setActiveAnalysisType} className="w-full">
          <TabsContent value="annual" className="space-y-4">
            <CompanyAnalysisTable
              data={safeAnnualPredictions}
              type="annual"
              searchTerm={searchTerm}
              selectedSector={selectedSector}
              selectedRiskLevel={selectedRiskLevel}
              isLoading={isLoading}
              onRefetch={refetchPredictions}
            />
          </TabsContent>

          <TabsContent value="quarterly" className="space-y-4">
            <CompanyAnalysisTable
              data={safeQuarterlyPredictions}
              type="quarterly"
              searchTerm={searchTerm}
              selectedSector={selectedSector}
              selectedRiskLevel={selectedRiskLevel}
              isLoading={isLoading}
              onRefetch={refetchPredictions}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
