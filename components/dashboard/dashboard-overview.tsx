'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
    <div className="space-y-6">
      {/* S&P 500 Default Rate Analysis Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bricolage font-bold text-gray-900 dark:text-white">
            S&P 500 Default Rate Analysis
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            ML-powered default rate predictions based on annual financial ratios
          </p>
        </div>
        <div className="flex items-center space-x-3">
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
      </div>

      {/* Summary Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {summaryStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="text-center">
                <div className="mb-2">
                  <Icon className={`h-8 w-8 mx-auto ${stat.color}`} />
                </div>
                <div className="text-2xl font-bricolage font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {stat.title}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Company Analysis with Annual/Quarterly Tabs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Company Analysis</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">Annual</Badge>
            <Badge variant="secondary">Quarterly</Badge>
          </div>
        </div>

        <Tabs value={activeAnalysisType} onValueChange={setActiveAnalysisType} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="annual">Annual</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          </TabsList>

          <TabsContent value="annual" className="space-y-4">
            {/* Filters and Search */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search companies or symbols..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger className="w-[180px]">
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
                <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                  <SelectTrigger className="w-[180px]">
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
              <div className="text-sm text-gray-500">
                Show <Select defaultValue="10">
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select> per page
              </div>
            </div>

            {/* Annual Analysis Table */}
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading annual predictions...</p>
              </div>
            ) : safeAnnualPredictions.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Reporting Period</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Default Rate ↑</TableHead>
                      <TableHead>Risk Category</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Key Ratios</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyData.map((company: any) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-blue-600">{company.company}</div>
                            <div className="text-sm text-gray-500">{company.subtitle}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-blue-600">
                            {company.reportingPeriod}
                          </Badge>
                        </TableCell>
                        <TableCell>{company.sector}</TableCell>
                        <TableCell>
                          <Badge className={company.riskColor}>
                            {company.defaultRate}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRiskBadgeColor(company.riskCategory)}>
                            {company.riskCategory}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {company.confidence ? `${(company.confidence * 100).toFixed(1)}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {company.keyRatios ? (
                              <>
                                <div>LTD/TC: {company.keyRatios.ltdtc || 'N/A'}</div>
                                <div>ROA: {company.keyRatios.roa || 'N/A'}</div>
                                <div>EBIT/Int: {company.keyRatios.ebitint || 'N/A'}</div>
                              </>
                            ) : (
                              <div>No ratios available</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <BarChart3 className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Annual Predictions Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No annual prediction data found. Please check your authentication or try refreshing the data.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetchPredictions}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Loading Data
                </Button>
              </div>
            )}

            {/* Pagination */}
            {safeAnnualPredictions.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing 1-{companyData.length} of {companyData.length} companies with annual predictions
                </p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quarterly" className="space-y-4">
            {/* Filters and Search for Quarterly */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search companies or symbols..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger className="w-[180px]">
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
                <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                  <SelectTrigger className="w-[180px]">
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
            </div>

            {/* Quarterly Analysis Table */}
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading quarterly predictions...</p>
              </div>
            ) : safeQuarterlyPredictions.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Quarter</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Default Rate ↑</TableHead>
                      <TableHead>Risk Category</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Key Ratios</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeQuarterlyPredictions.map((pred: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-blue-600">{pred.company_symbol}</div>
                            <div className="text-sm text-gray-500">{pred.company_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-blue-600">
                            {formatPredictionDate(pred)}
                          </Badge>
                        </TableCell>
                        <TableCell>{pred.sector || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getRiskBadgeColor(pred.risk_level || pred.risk_category || 'unknown')}>
                            {(getPredictionProbability(pred) * 100).toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRiskBadgeColor(pred.risk_level || pred.risk_category || 'unknown')}>
                            {pred.risk_level || pred.risk_category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {pred.confidence ? `${(pred.confidence * 100).toFixed(1)}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {pred.financial_ratios ? (
                              <>
                                <div>LTD/TC: {pred.financial_ratios.ltdtc || 'N/A'}</div>
                                <div>ROA: {pred.financial_ratios.roa || 'N/A'}</div>
                                <div>EBIT/Int: {pred.financial_ratios.ebitint || 'N/A'}</div>
                              </>
                            ) : (
                              <div>No ratios available</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <BarChart3 className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Quarterly Predictions Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No quarterly prediction data found. Please check your authentication or try refreshing the data.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetchPredictions}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Loading Data
                </Button>
              </div>
            )}

            {/* Pagination for Quarterly */}
            {safeQuarterlyPredictions.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing 1-{safeQuarterlyPredictions.length} of {safeQuarterlyPredictions.length} companies with quarterly predictions
                </p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
