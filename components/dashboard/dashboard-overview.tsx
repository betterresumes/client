'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useDashboardStatsStore } from '@/lib/stores/dashboard-stats-store'
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
  const { user, isAuthenticated } = useAuthStore()

  // Dashboard Stats API (for summary statistics)
  const {
    stats: dashboardStats,
    isLoading: isStatsLoading,
    error: statsError,
    fetchStats,
    clearError: clearStatsError
  } = useDashboardStatsStore()

  // Predictions Store (for table data with pagination)
  const {
    annualPredictions,
    quarterlyPredictions,
    systemAnnualPredictions,
    systemQuarterlyPredictions,
    isLoading: isPredictionsLoading,
    error: predictionsError,
    fetchPredictions,
    refetchPredictions,
    getPredictionProbability,
    getRiskBadgeColor,
    formatPredictionDate,
    getFilteredPredictions,
    lastFetched,
    activeDataFilter
  } = usePredictionsStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSector, setSelectedSector] = useState('all')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeAnalysisType, setActiveAnalysisType] = useState('annual')
  const [isClient, setIsClient] = useState(false)
  const [forceRefresh, setForceRefresh] = useState(0) // Force component refresh counter

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Listen for essential prediction events only
  useEffect(() => {
    const handlePredictionCreated = (event: CustomEvent) => {
      console.log('🆕 Prediction created - refreshing dashboard')
      setForceRefresh(prev => prev + 1)
      setCurrentPage(1) // Reset pagination

      // Refresh dashboard stats only
      const statsStore = useDashboardStatsStore.getState()
      statsStore.invalidateCache()
    }

    const handleNavigateToDashboard = () => {
      console.log('🚀 Navigate to dashboard - refreshing')
      setForceRefresh(prev => prev + 1)
      setCurrentPage(1)
      fetchStats(true) // Force refresh stats
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('prediction-created', handlePredictionCreated as EventListener)
      window.addEventListener('prediction-created-navigate-dashboard', handleNavigateToDashboard as EventListener)
      return () => {
        window.removeEventListener('prediction-created', handlePredictionCreated as EventListener)
        window.removeEventListener('prediction-created-navigate-dashboard', handleNavigateToDashboard as EventListener)
      }
    }
  }, [])

  // Enhanced useEffect to fetch initial data - handles auth state changes properly
  useEffect(() => {
    console.log('🔍 Dashboard useEffect triggered:', {
      isClient,
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role,
      annualCount: annualPredictions.length,
      quarterlyCount: quarterlyPredictions.length,
      lastFetched: lastFetched ? new Date(lastFetched).toISOString() : 'never'
    })

    if (isClient && isAuthenticated && user) {
      console.log('📊 Dashboard mounted - making API calls for authenticated user')

      // 1. Always fetch dashboard stats (summary statistics) - /predictions/dashboard
      fetchStats()

      // 2 & 3. Fetch predictions - force refresh if no data or stale data
      const hasNoData = annualPredictions.length === 0 && quarterlyPredictions.length === 0
      const hasStaleData = lastFetched && (Date.now() - lastFetched > 5 * 60 * 1000) // 5 minutes

      if (hasNoData || hasStaleData) {
        console.log('📊 Fetching predictions - reason:', hasNoData ? 'no data' : 'stale data')
        fetchPredictions(true) // Force refresh
      } else {
        console.log('📊 Using existing predictions data:', {
          annual: annualPredictions.length,
          quarterly: quarterlyPredictions.length,
          age: lastFetched ? `${Math.round((Date.now() - lastFetched) / 60000)}min` : 'unknown'
        })
      }
    }
  }, [isClient, isAuthenticated, user, fetchStats, fetchPredictions]) // Include fetchStats and fetchPredictions

  // Listen for auth login success to refresh data
  useEffect(() => {
    const handleAuthSuccess = () => {
      console.log('🔄 Auth login success - refreshing dashboard data')
      setTimeout(() => {
        fetchStats(true)
        fetchPredictions(true)
      }, 500) // Small delay to ensure auth is fully set
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-login-success', handleAuthSuccess)
      return () => window.removeEventListener('auth-login-success', handleAuthSuccess)
    }
  }, [fetchStats, fetchPredictions])

  // Removed excessive useEffects to prevent too many API calls

  // Ensure predictions are always arrays and get filtered data
  const safeAnnualPredictions = Array.isArray(annualPredictions) ? annualPredictions : []
  const safeQuarterlyPredictions = Array.isArray(quarterlyPredictions) ? quarterlyPredictions : []

  // Get filtered predictions based on data access settings (include forceRefresh to trigger re-evaluation)
  const filteredAnnualPredictions = useMemo(() => {
    const filtered = getFilteredPredictions('annual')
    console.log('🔄 Recalculating filtered annual predictions:', filtered.length, 'forceRefresh:', forceRefresh)
    return filtered
  }, [getFilteredPredictions, forceRefresh, annualPredictions, systemAnnualPredictions, activeDataFilter, lastFetched])

  const filteredQuarterlyPredictions = useMemo(() => {
    const filtered = getFilteredPredictions('quarterly')
    console.log('🔄 Recalculating filtered quarterly predictions:', filtered.length, 'forceRefresh:', forceRefresh)
    return filtered
  }, [getFilteredPredictions, forceRefresh, quarterlyPredictions, systemQuarterlyPredictions, activeDataFilter, lastFetched])

  // Debug logging to track prediction updates
  console.log('📊 Dashboard render - Annual predictions:', filteredAnnualPredictions.length)
  console.log('📊 Dashboard render - Quarterly predictions:', filteredQuarterlyPredictions.length)
  console.log('📊 Dashboard render - Last fetched:', lastFetched)
  console.log('📊 Dashboard render - Force refresh counter:', forceRefresh)
  console.log('📊 Dashboard render - Active Data Filter:', activeDataFilter)
  console.log('📊 Dashboard render - RAW Annual sample:', safeAnnualPredictions.slice(0, 3).map(p => ({
    company: p.company_symbol,
    access: p.organization_access,
    org_name: p.organization_name
  })))

  console.log('Annual Predictions:', safeAnnualPredictions)

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

  // Check if any data is loading
  const isLoading = isStatsLoading || isPredictionsLoading
  const error = statsError || predictionsError

  console.log('🚨 DASHBOARD RENDER CHECK:', {
    isLoading,
    error,
    filteredAnnualLength: filteredAnnualPredictions.length,
    filteredQuarterlyLength: filteredQuarterlyPredictions.length,
    rawAnnualLength: safeAnnualPredictions.length,
    rawQuarterlyLength: safeQuarterlyPredictions.length,
    activeDataFilter,
    isAuthenticated,
    hasUser: !!user
  })

  // Check if filtered data is empty (not loading)
  if (!isLoading && filteredAnnualPredictions.length === 0 && filteredQuarterlyPredictions.length === 0) {
    return (
      <div className="space-y-6 font-bricolage">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            S&P 500 Default Rate Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ML-powered default rate predictions based on annual financial ratios
          </p>
        </div>

        {/* Empty state in Card */}
        {!isLoading && (
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-center py-16 px-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                No Data Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                No prediction data is available for your current data source selection. Please check your permissions or try refreshing.
                <br />
                <small className="text-xs text-gray-500 mt-2 block">
                  Debug: Filter={activeDataFilter}, Annual={filteredAnnualPredictions.length}, Quarterly={filteredQuarterlyPredictions.length}
                </small>
              </p>
            </div>
          </Card>
        )}

      </div>
    )
  }

  return (
    <div className="space-y-6 font-bricolage">
      {/* S&P 500 Default Rate Analysis Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          S&P 500 Default Rate Analysis
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          ML-powered default rate predictions based on annual financial ratios
        </p>
      </div>



      {/* Summary Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Summary Statistics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {(() => {
            // STRICT Data Source Separation:
            // - 'system' (Platform tab) -> ONLY show platform_statistics
            // - 'personal'/'organization' (User tabs) -> ONLY show user_dashboard, NEVER platform data
            const isShowingPlatform = activeDataFilter === 'system';

            let statsToShow = null;
            let dataSourceLabel = '';

            if (isShowingPlatform) {
              // Platform tab: Only platform_statistics
              statsToShow = dashboardStats?.platform_statistics;
              dataSourceLabel = 'Platform Data';
            } else {
              // User tabs (personal/organization): Only user_dashboard, never platform data
              statsToShow = dashboardStats?.user_dashboard;
              dataSourceLabel = 'User Data';
            }

            console.log('📊 STRICT Data Separation:', {
              activeDataFilter,
              isShowingPlatform,
              userScope: dashboardStats?.scope,
              hasUserDashboard: !!dashboardStats?.user_dashboard,
              hasPlatformStats: !!dashboardStats?.platform_statistics,
              statsToShow: statsToShow ? 'Available' : 'None',
              dataSourceLabel
            });

            // Always show 5 cards with appropriate data based on selected filter
            const cardTitles = [
              { title: 'Total Companies', key: 'total_companies' },
              { title: 'Total Predictions', key: 'total_predictions' },
              { title: 'Average Default Rate', key: 'average_default_rate' },
              { title: 'High Risk Companies', key: 'high_risk_companies' },
              { title: 'Sectors Covered', key: 'sectors_covered' }
            ];

            return cardTitles.map((cardInfo, index) => (
              <Card key={index} className="p-6 text-left">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {cardInfo.title}
                  </p>
                  {isStatsLoading ? (
                    <>
                      <Skeleton className={`h-9 ${cardInfo.key === 'average_default_rate' ? 'w-16' : 'w-12'
                        }`} />
                      <Skeleton className="h-3 w-20" />
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {(() => {
                          if (!statsToShow) return '0';

                          const value = statsToShow[cardInfo.key as keyof typeof statsToShow];
                          if (cardInfo.key === 'average_default_rate') {
                            return value ? `${(Number(value) * 100).toFixed(2)}%` : '0.00%';
                          }
                          return value?.toString() || '0';
                        })()}
                      </p>
                    </>
                  )}
                </div>
              </Card>
            ));
          })()}
        </div>
      </div>

      {/* Organization Breakdown for Tenant Admins */}
      {dashboardStats?.scope === 'tenant' && dashboardStats.organizations_breakdown && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Organizations Breakdown
            </h2>
          </div>

          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Organization</th>
                    <th className="text-right py-3 px-4">Companies</th>
                    <th className="text-right py-3 px-4">Predictions</th>
                    <th className="text-right py-3 px-4">Avg Default Rate</th>
                    <th className="text-right py-3 px-4">High Risk</th>
                    <th className="text-right py-3 px-4">Sectors</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardStats.organizations_breakdown.map((org: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{org.org_name}</td>
                      <td className="py-3 px-4 text-right">{org.companies.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{org.predictions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{(org.avg_default_rate * 100).toFixed(2)}%</td>
                      <td className={`py-3 px-4 text-right font-medium ${org.high_risk_companies > 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                        {org.high_risk_companies.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">{org.sectors_covered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tenant Breakdown for Super Admins */}
      {dashboardStats?.scope === 'system' && dashboardStats.tenants_breakdown && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tenants Overview
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardStats.tenants_breakdown.map((tenant: any, index: number) => (
              <Card key={index} className="p-6">
                <h3 className="font-semibold text-lg mb-3">{tenant.tenant_name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Companies:</span>
                    <span className="font-medium">{tenant.companies.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Predictions:</span>
                    <span className="font-medium">{tenant.predictions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Organizations:</span>
                    <span className="font-medium">{tenant.organizations_count}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

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
              data={filteredAnnualPredictions}
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
              data={filteredQuarterlyPredictions}
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