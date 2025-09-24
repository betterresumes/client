'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { AnalyticsView } from '@/components/dashboard/analytics-view'
import { CompanyDetailsView } from '@/components/dashboard/company-details-view'
import { CustomAnalysisView } from '@/components/dashboard/custom-analysis-view'
import { RiskInsightsView } from '@/components/dashboard/risk-insights-view'
import { DataSourceTabs, RefreshButton, LastUpdatedInfo, OrganizationSelector } from '@/components/dashboard/data-access-filter'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { usePredictionsStore } from '@/lib/stores/predictions-store'

export default function DashboardPage() {
  const { activeTab, setActiveTab } = useDashboardStore()
  const { user, isAdmin, isTenantAdmin, isAuthenticated } = useAuthStore()
  const { fetchPredictions, annualPredictions, quarterlyPredictions, isLoading, isInitialized } = usePredictionsStore()
  const [hasInitializedData, setHasInitializedData] = useState(false)

  // Single source of data loading - fetch predictions once when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !hasInitializedData) {
      console.log('🚀 Dashboard page - initializing data for authenticated user:', user.email)
      setHasInitializedData(true)

      // Always fetch data when dashboard loads to ensure fresh data
      // But don't show loading if we already have cached data
      fetchPredictions(false) // Don't force refresh, use cache if available
    }
  }, [isAuthenticated, user, hasInitializedData, fetchPredictions])

  // Reset initialization flag when user changes (for logout/login scenarios)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setHasInitializedData(false)
    }
  }, [isAuthenticated, user])

  return (
    <div className="space-y-6">
      {/* Header with tabs and org/tenant info */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="inline-flex rounded-lg p-1 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md flex items-center space-x-2 px-4 py-2"
            >
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md flex items-center space-x-2 px-4 py-2"
            >
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger
              value="company-details"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md flex items-center space-x-2 px-4 py-2"
            >
              <span>Company Details</span>
            </TabsTrigger>
            <TabsTrigger
              value="custom-analysis"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md flex items-center space-x-2 px-4 py-2"
            >
              <span>Custom Analysis</span>
            </TabsTrigger>
            <TabsTrigger
              value="risk-insights"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md flex items-center space-x-2 px-4 py-2"
            >
              <span>Risk Insights</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Data Source Tabs and Controls on the right side */}
        <div className="flex items-center space-x-3 ml-4">
          <DataSourceTabs />
          <RefreshButton />
        </div>
      </div>

      {/* Last updated info below header */}
      <div className="flex justify-end">
        <LastUpdatedInfo />
      </div>

      {/* Organization selector for tenant admin */}
      <OrganizationSelector />

      {/* Tab Contents - All tabs enabled */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="dashboard" className="mt-6 animate-in fade-in-0 duration-300">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 animate-in fade-in-0 duration-300">
          <AnalyticsView />
        </TabsContent>

        <TabsContent value="company-details" className="mt-6 animate-in fade-in-0 duration-300">
          <CompanyDetailsView />
        </TabsContent>

        <TabsContent value="custom-analysis" className="mt-6 animate-in fade-in-0 duration-300">
          <CustomAnalysisView />
        </TabsContent>

        <TabsContent value="risk-insights" className="mt-6 animate-in fade-in-0 duration-300">
          <RiskInsightsView />
        </TabsContent>
      </Tabs>
    </div>
  )
}