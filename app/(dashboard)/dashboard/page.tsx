'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { useDashboardStatsStore } from '@/lib/stores/dashboard-stats-store'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeTab, setActiveTab } = useDashboardStore()
  const { user, isAdmin, isTenantAdmin, isAuthenticated } = useAuthStore()
  const { fetchPredictions, fetchRemainingPredictions, annualPredictions, quarterlyPredictions, isLoading, isInitialized } = usePredictionsStore()
  const { fetchStats } = useDashboardStatsStore()
  const [hasInitializedData, setHasInitializedData] = useState(false)
  const [isNavigatingFromHistory, setIsNavigatingFromHistory] = useState(false)

  // Single source of data loading - fetch predictions once when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !hasInitializedData) {
      console.log('🚀 Dashboard page - initializing data for authenticated user:', user.email)
      setHasInitializedData(true)

      // First fetch dashboard stats (needed for accurate pagination)
      fetchStats(false).then(() => {
        // Then fetch initial predictions
        fetchPredictions(false)

        // Start background loading of remaining predictions after 10 seconds
        setTimeout(() => {
          console.log('⏳ Starting background loading of remaining predictions after 10 seconds')
          fetchRemainingPredictions()
        }, 10000)
      })
    }
  }, [isAuthenticated, user, hasInitializedData, fetchPredictions, fetchRemainingPredictions, fetchStats])

  // Reset initialization flag when user changes (for logout/login scenarios)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setHasInitializedData(false)
    }
  }, [isAuthenticated, user])

  // Initialize tab from URL parameter on mount
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl && ['summary', 'analytics', 'company-details', 'custom-analysis', 'about'].includes(tabFromUrl)) {
      console.log('🔗 Setting tab from URL:', tabFromUrl)
      // Map URL tab to internal tab value
      const internalTab = tabFromUrl === 'summary' ? 'dashboard' : tabFromUrl === 'about' ? 'risk-insights' : tabFromUrl
      setActiveTab(internalTab)
    } else if (!tabFromUrl) {
      // Ensure we have a default tab in URL - use 'summary' as default
      const defaultTab = 'summary'
      console.log('🏠 No tab in URL, setting default:', defaultTab)
      setActiveTab('dashboard') // Internal value is still 'dashboard'
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('tab', defaultTab)
      window.history.replaceState(null, '', currentUrl.toString())
    }
  }, [searchParams, setActiveTab])

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log('🔙 Browser back/forward detected')
      setIsNavigatingFromHistory(true)

      const currentUrl = new URL(window.location.href)
      const tabFromUrl = currentUrl.searchParams.get('tab')

      if (tabFromUrl && ['summary', 'analytics', 'company-details', 'custom-analysis', 'about'].includes(tabFromUrl)) {
        console.log('🔗 Navigating to tab from history:', tabFromUrl)
        // Map URL tab to internal tab value
        const internalTab = tabFromUrl === 'summary' ? 'dashboard' : tabFromUrl === 'about' ? 'risk-insights' : tabFromUrl
        setActiveTab(internalTab)
      } else {
        // If no valid tab in URL, default to summary
        console.log('🏠 No valid tab in URL, defaulting to summary')
        setActiveTab('dashboard')
        currentUrl.searchParams.set('tab', 'summary')
        window.history.replaceState(null, '', currentUrl.toString())
      }

      // Reset the flag after a brief delay
      setTimeout(() => setIsNavigatingFromHistory(false), 100)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setActiveTab])

  // Handle tab changes and update URL (but only if not navigating from history)
  const handleTabChange = (newTab: string) => {
    if (!isNavigatingFromHistory) {
      console.log('🔄 Tab changed via UI:', newTab)

      const currentUrl = new URL(window.location.href)
      const currentTab = currentUrl.searchParams.get('tab')

      // Map internal tab to URL tab
      const urlTab = newTab === 'dashboard' ? 'summary' : newTab === 'risk-insights' ? 'about' : newTab

      // Only update URL if the tab is actually different
      if (currentTab !== urlTab) {
        currentUrl.searchParams.set('tab', urlTab)

        // Smart history management:
        // - When moving FROM summary to any other tab: push to history (creates back button entry)
        // - When moving between non-summary tabs: replace history (prevents too many entries)
        // - When moving TO summary from any tab: replace history (summary is the "home" state)

        if (currentTab === 'summary' && urlTab !== 'summary') {
          // Moving FROM summary to another tab - push to history
          console.log('📌 Pushing new history entry for navigation from summary')
          window.history.pushState(null, '', currentUrl.toString())
        } else {
          // All other cases - replace current history entry
          console.log('🔄 Replacing current history entry')
          window.history.replaceState(null, '', currentUrl.toString())
        }
      }
    }

    // Always update the active tab in the store
    setActiveTab(newTab)
  }

  return (
    <div className="">
      {/* Tabs taking full width */}
      <div>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex w-full rounded-lg p-1 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md flex items-center space-x-2 px-4 py-2 flex-1 cursor-pointer"
            >
              <span>Summary</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md flex items-center space-x-2 px-4 py-2 flex-1 cursor-pointer"
            >
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger
              value="company-details"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md flex items-center space-x-2 px-4 py-2 flex-1 cursor-pointer"
            >
              <span>Company Details</span>
            </TabsTrigger>
            <TabsTrigger
              value="custom-analysis"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md flex items-center space-x-2 px-4 py-2 flex-1 cursor-pointer"
            >
              <span>Custom Analysis</span>
            </TabsTrigger>
            <TabsTrigger
              value="risk-insights"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md flex items-center space-x-2 px-4 py-2 flex-1 cursor-pointer"
            >
              <span>About</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Data Source Tabs and Controls on the right side only - Hide for custom-analysis and risk-insights tabs */}
      {activeTab !== 'custom-analysis' && activeTab !== 'risk-insights' && (
        <div className="flex flex-col items-end mt-2">
          <div className="flex items-center space-x-3">
            <DataSourceTabs />
            <RefreshButton />
          </div>
          <LastUpdatedInfo />
        </div>
      )}

      {/* Organization selector for tenant admin */}
      <OrganizationSelector />

      {/* Tab Contents - All tabs enabled */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsContent value="dashboard" className="mt-1 animate-in fade-in-0 duration-300">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="analytics" className="mt-1">
          <AnalyticsView />
        </TabsContent>

        <TabsContent value="company-details" className="mt-1 animate-in fade-in-0 duration-300">
          <CompanyDetailsView />
        </TabsContent>

        <TabsContent value="custom-analysis" className="mt-1 animate-in fade-in-0 duration-300">
          <CustomAnalysisView />
        </TabsContent>

        <TabsContent value="risk-insights" className="mt-1 animate-in fade-in-0 duration-300">
          <RiskInsightsView />
        </TabsContent>
      </Tabs>
    </div>
  )
}