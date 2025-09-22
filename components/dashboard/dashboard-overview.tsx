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

  // Listen for prediction creation events to force dashboard refresh
  useEffect(() => {
    const handlePredictionCreated = (event: CustomEvent) => {
      console.log('🆕 Prediction created event received:', event.detail)

      // IMMEDIATE: Force component to re-evaluate filtered predictions
      setForceRefresh(prev => prev + 1)

      // IMMEDIATE: Force store to recalculate (trigger all subscribers)
      const store = usePredictionsStore.getState()
      store.lastFetched = Date.now()

      // IMMEDIATE: Force a complete re-render by updating multiple state values
      setCurrentPage(1) // Reset pagination

      // IMMEDIATE: Invalidate dashboard stats cache to get fresh summary data
      const statsStore = useDashboardStatsStore.getState()
      statsStore.invalidateCache()

      console.log('🚀 Dashboard forced to refresh immediately after prediction creation')
    }

    const handlePredictionsUpdated = () => {
      console.log('🔄 Predictions updated event received')
      setForceRefresh(prev => prev + 1)

      // Also refresh dashboard stats
      const statsStore = useDashboardStatsStore.getState()
      statsStore.invalidateCache()
    }

    const handleNavigateToDashboard = () => {
      console.log('🚀 Navigate to dashboard event - forcing immediate refresh')
      setForceRefresh(prev => prev + 1)
      // Also force pagination reset and filters
      setCurrentPage(1)
      setSearchTerm('')
      setSelectedSector('all')
      setSelectedRiskLevel('all')

      // Refresh dashboard stats
      const statsStore = useDashboardStatsStore.getState()
      statsStore.fetchStats(true)
    }

    const handleStayHereRefresh = () => {
      console.log('🔄 Prediction created - refreshing dashboard data (user stays on current tab)')
      setForceRefresh(prev => prev + 1)

      // Refresh dashboard stats
      const statsStore = useDashboardStatsStore.getState()
      statsStore.invalidateCache()
    }

    const handleOptimisticAdd = (event: CustomEvent) => {
      console.log('⚡ Optimistic prediction added:', event.detail)
      setForceRefresh(prev => prev + 1)
    }

    const handleRealReplace = (event: CustomEvent) => {
      console.log('✅ Real prediction replaced:', event.detail)
      setForceRefresh(prev => prev + 1)

      // Refresh dashboard stats since we now have real data
      const statsStore = useDashboardStatsStore.getState()
      statsStore.invalidateCache()
    }

    const handleDataFilterChanged = (event: CustomEvent) => {
      console.log('🔄 Data filter changed - refreshing dashboard:', event.detail)
      setForceRefresh(prev => prev + 1)
      // Reset pagination to first page when filter changes
      setCurrentPage(1)
      // Note: Dashboard stats are role-based, not filter-based, so no need to refresh stats
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('prediction-created', handlePredictionCreated as EventListener)
      window.addEventListener('predictions-updated', handlePredictionsUpdated as EventListener)
      window.addEventListener('prediction-created-navigate-dashboard', handleNavigateToDashboard as EventListener)
      window.addEventListener('prediction-created-stay-here', handleStayHereRefresh as EventListener)
      window.addEventListener('prediction-added-optimistic', handleOptimisticAdd as EventListener)
      window.addEventListener('prediction-replaced-real', handleRealReplace as EventListener)
      window.addEventListener('data-filter-changed', handleDataFilterChanged as EventListener)
      return () => {
        window.removeEventListener('prediction-created', handlePredictionCreated as EventListener)
        window.removeEventListener('predictions-updated', handlePredictionsUpdated as EventListener)
        window.removeEventListener('prediction-created-navigate-dashboard', handleNavigateToDashboard as EventListener)
        window.removeEventListener('prediction-created-stay-here', handleStayHereRefresh as EventListener)
        window.removeEventListener('prediction-added-optimistic', handleOptimisticAdd as EventListener)
        window.removeEventListener('prediction-replaced-real', handleRealReplace as EventListener)
        window.removeEventListener('data-filter-changed', handleDataFilterChanged as EventListener)
      }
    }
  }, [])

  // Fetch dashboard stats and predictions when client-side and authenticated
  useEffect(() => {
    if (isClient && isAuthenticated && user) {
      console.log('📊 Dashboard mounted - fetching stats and predictions')

      // Always fetch dashboard stats (cached for 5 minutes)
      fetchStats()

      // Only fetch predictions if we don't have any data for the table
      if (annualPredictions.length === 0 && quarterlyPredictions.length === 0 && !isPredictionsLoading) {
        fetchPredictions()
      }
    }
  }, [isClient, isAuthenticated, user])

  // No need for additional auth state change listener - the store handles this

  // Set up periodic token check to prevent expiration issues
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const checkTokenAndRefresh = () => {
      const { shouldRefreshToken, refreshAccessToken, isRefreshing } = useAuthStore.getState()

      if (shouldRefreshToken() && !isRefreshing) {
        console.log('🔄 Proactively refreshing token to prevent expiration')
        refreshAccessToken()
      }
    }

    // Check token every minute
    const tokenCheckInterval = setInterval(checkTokenAndRefresh, 60000)

    return () => clearInterval(tokenCheckInterval)
  }, [isAuthenticated, user])

  // Monitor for data disappearing and auto-refetch
  useEffect(() => {
    if (!isAuthenticated || !user || isLoading) return

    const checkDataAndRefetch = () => {
      const currentPredictions = usePredictionsStore.getState()

      // If we're logged in but have no data and there's no loading/error, refetch
      if (currentPredictions.isInitialized &&
        currentPredictions.annualPredictions.length === 0 &&
        currentPredictions.quarterlyPredictions.length === 0 &&
        !currentPredictions.isLoading &&
        !currentPredictions.error) {
        console.log('⚠️ Data disappeared - auto-refetching predictions')
        fetchPredictions(true)
      }
    }

    // Check data every 30 seconds
    const dataCheckInterval = setInterval(checkDataAndRefetch, 30000)

    return () => clearInterval(dataCheckInterval)
  }, [isAuthenticated, user, isPredictionsLoading, fetchPredictions])

  // Ensure predictions are always arrays and get filtered data
  const safeAnnualPredictions = Array.isArray(annualPredictions) ? annualPredictions : []
  const safeQuarterlyPredictions = Array.isArray(quarterlyPredictions) ? quarterlyPredictions : []

  // Get filtered predictions based on data access settings (include forceRefresh to trigger re-evaluation)
  const filteredAnnualPredictions = useMemo(() => {
    const filtered = getFilteredPredictions('annual')
    console.log('🔄 Recalculating filtered annual predictions:', filtered.length, 'forceRefresh:', forceRefresh)
    return filtered
  }, [getFilteredPredictions, forceRefresh, annualPredictions, lastFetched])

  const filteredQuarterlyPredictions = useMemo(() => {
    const filtered = getFilteredPredictions('quarterly')
    console.log('🔄 Recalculating filtered quarterly predictions:', filtered.length, 'forceRefresh:', forceRefresh)
    return filtered
  }, [getFilteredPredictions, forceRefresh, quarterlyPredictions, lastFetched])

  // Debug logging to track prediction updates
  console.log('📊 Dashboard render - Annual predictions:', filteredAnnualPredictions.length)
  console.log('📊 Dashboard render - Quarterly predictions:', filteredQuarterlyPredictions.length)
  console.log('📊 Dashboard render - Last fetched:', lastFetched)
  console.log('📊 Dashboard render - Force refresh counter:', forceRefresh)

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
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-center py-16 px-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              No Data Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {error ? `Error: ${error}` : 'No prediction data is available for your current data source selection. Please check your permissions or try refreshing.'}
            </p>
            {error && (
              <Button
                onClick={() => {
                  clearStatsError()
                  fetchStats(true)
                  refetchPredictions()
                }}
                className="mb-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </Card>

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
            // Determine which stats to show based on active filter
            const isShowingPlatform = activeDataFilter === 'system' || (dashboardStats?.platform_statistics && activeDataFilter === 'platform');
            const statsToShow = isShowingPlatform ? dashboardStats?.platform_statistics : dashboardStats;

            if (!statsToShow) return null;

            const currentStats = [
              {
                title: isShowingPlatform ? 'Platform Companies' : 'Total Companies',
                value: statsToShow.total_companies?.toString() || '0',
                icon: Building2,
                color: 'text-blue-600',
                subtitle: isShowingPlatform ? 'Platform data' : (dashboardStats?.scope !== 'system' ? 'Your access' : 'System-wide')
              },
              {
                title: isShowingPlatform ? 'Platform Predictions' : 'Total Predictions',
                value: statsToShow.total_predictions?.toString() || '0',
                icon: BarChart3,
                color: 'text-green-600',
                subtitle: isShowingPlatform ? 'Platform data' : (dashboardStats?.scope !== 'system' ? 'Your access' : 'System-wide')
              },
              {
                title: isShowingPlatform ? 'Platform Avg Rate' : 'Average Default Rate',
                value: statsToShow.average_default_rate
                  ? `${(statsToShow.average_default_rate * 100).toFixed(2)}%`
                  : '0%',
                icon: TrendingUp,
                color: 'text-purple-600',
                subtitle: isShowingPlatform ? 'Platform data' : (dashboardStats?.scope !== 'system' ? 'Your data' : 'System-wide')
              },
              {
                title: isShowingPlatform ? 'Platform High Risk' : 'High Risk Companies',
                value: statsToShow.high_risk_companies?.toString() || '0',
                icon: TrendingDown,
                color: 'text-red-600',
                subtitle: isShowingPlatform ? 'Platform data' : (dashboardStats?.scope !== 'system' ? 'Your access' : 'System-wide')
              },
              {
                title: isShowingPlatform ? 'Platform Sectors' : 'Sectors Covered',
                value: statsToShow.sectors_covered?.toString() || '0',
                icon: Activity,
                color: 'text-indigo-600',
                subtitle: isShowingPlatform ? 'Platform data' : (dashboardStats?.scope !== 'system' ? 'Your access' : 'System-wide')
              }
            ];

            return currentStats.map((stat, index) => (
              <Card key={index} className="p-6 text-left">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      {stat.subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {stat.subtitle}
                        </p>
                      )}
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
                  {dashboardStats.organizations_breakdown.map((org, index) => (
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
            {dashboardStats.tenants_breakdown.map((tenant, index) => (
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
