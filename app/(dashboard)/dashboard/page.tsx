'use client'

import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { AnalyticsView } from '@/components/dashboard/analytics-view'
import { CompanyDetailsView } from '@/components/dashboard/company-details-view'
import { CustomAnalysisView } from '@/components/dashboard/custom-analysis-view'
import { RiskInsightsView } from '@/components/dashboard/risk-insights-view'
import { useDashboardStore } from '@/lib/stores/dashboard-store'

export default function DashboardPage() {
  const { activeTab, setActiveTab } = useDashboardStore()

  return (
    <div className="space-y-6">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
