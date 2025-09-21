'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { AnalyticsView } from '@/components/dashboard/analytics-view'
import { CompanyDetailsView } from '@/components/dashboard/company-details-view'
import { CustomAnalysisView } from '@/components/dashboard/custom-analysis-view'
import { RiskInsightsView } from '@/components/dashboard/risk-insights-view'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="space-y-6">
      {/* Header with title and description */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bricolage font-bold text-gray-900 dark:text-white">
              Credit Risk Assessment Platform
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Machine Learning-powered default rate analysis for S&P 500 and custom companies
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last Updated: Sep 20, 2025, 08:25 PM
            </p>
          </div>
        </div>

        {/* Stats badges */}
        <div className="flex items-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs">📊</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">5 S&P 500 Companies</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs">📈</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Average Rate: 2.18%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs">⚠️</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">High Risk: 0 Companies</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Custom Analysis Available</div>
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">ML-Powered Analysis</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="company-details" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
            Company Details
          </TabsTrigger>
          <TabsTrigger value="custom-analysis" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
            Custom Analysis
          </TabsTrigger>
          <TabsTrigger value="risk-insights" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
            Risk Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsView />
        </TabsContent>

        <TabsContent value="company-details" className="mt-6">
          <CompanyDetailsView />
        </TabsContent>

        <TabsContent value="custom-analysis" className="mt-6">
          <CustomAnalysisView />
        </TabsContent>

        <TabsContent value="risk-insights" className="mt-6">
          <RiskInsightsView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
