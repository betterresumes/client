'use client'

import { useState, useMemo, useEffect } from 'react'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, ScatterChart, Scatter } from "recharts"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, PieChart as PieChartIcon, BarChart3, ChartScatter, RefreshCw } from 'lucide-react'
import { CompanyAnalysisTable } from './company-analysis-table'

export function AnalyticsView() {
  const { isAuthenticated, user } = useAuthStore()
  const {
    annualPredictions,
    quarterlyPredictions,
    systemAnnualPredictions,
    systemQuarterlyPredictions,
    isLoading: isPredictionsLoading,
    error: predictionsError,
    fetchPredictions,
    getPredictionProbability,
    getRiskBadgeColor,
    formatPredictionDate,
    getFilteredPredictions,
    activeDataFilter,
    lastFetched
  } = usePredictionsStore()

  const [forceRefresh, setForceRefresh] = useState(0)

  const [activeTab, setActiveTab] = useState("annual")

  // Only fetch predictions if we don't have any data and user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && annualPredictions.length === 0 && quarterlyPredictions.length === 0 && !isPredictionsLoading) {
      console.log('📊 Analytics view - fetching predictions as none exist')
      fetchPredictions()
    }
  }, [isAuthenticated, user, annualPredictions.length, quarterlyPredictions.length, isPredictionsLoading, fetchPredictions])

  // Listen for data filter changes to refresh the view
  useEffect(() => {
    const handleDataFilterChanged = (event: CustomEvent) => {
      console.log('📊 Analytics view - data filter changed, refreshing:', event.detail)
      setForceRefresh(prev => prev + 1)
    }

    const handlePredictionCreated = (event: CustomEvent) => {
      console.log('📊 Analytics view - prediction created, refreshing view')
      setForceRefresh(prev => prev + 1)
    }

    const handlePredictionsUpdated = () => {
      console.log('📊 Analytics view - predictions updated, refreshing view')
      setForceRefresh(prev => prev + 1)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('data-filter-changed', handleDataFilterChanged as EventListener)
      window.addEventListener('prediction-created', handlePredictionCreated as EventListener)
      window.addEventListener('predictions-updated', handlePredictionsUpdated as EventListener)
      
      return () => {
        window.removeEventListener('data-filter-changed', handleDataFilterChanged as EventListener)
        window.removeEventListener('prediction-created', handlePredictionCreated as EventListener)
        window.removeEventListener('predictions-updated', handlePredictionsUpdated as EventListener)
      }
    }
  }, [])

  // Ensure predictions are arrays and get filtered data (use forceRefresh to trigger re-evaluation)
  const safePredictions = useMemo(() => Array.isArray(annualPredictions) ? annualPredictions : [], [annualPredictions, forceRefresh])
  const safeQuarterlyPredictions = useMemo(() => Array.isArray(quarterlyPredictions) ? quarterlyPredictions : [], [quarterlyPredictions, forceRefresh])

  // Get filtered predictions based on data access settings (trigger with forceRefresh)
  const filteredAnnualPredictions = useMemo(() => {
    const filtered = getFilteredPredictions('annual')
    console.log('📊 Analytics - Annual predictions filtered:', {
      activeDataFilter,
      count: filtered.length,
      sample: filtered.slice(0, 3).map(p => ({ symbol: p.company_symbol, access: p.organization_access }))
    })
    return filtered
  }, [getFilteredPredictions, forceRefresh, annualPredictions, systemAnnualPredictions, activeDataFilter])
  
  const filteredQuarterlyPredictions = useMemo(() => {
    const filtered = getFilteredPredictions('quarterly')
    console.log('📊 Analytics - Quarterly predictions filtered:', {
      activeDataFilter,
      count: filtered.length,
      systemQuarterlyCount: systemQuarterlyPredictions.length,
      userQuarterlyCount: quarterlyPredictions.length,
      sample: filtered.slice(0, 3).map(p => ({ symbol: p.company_symbol, access: p.organization_access })),
      expectedFromSystem: activeDataFilter === 'system'
    })
    return filtered
  }, [getFilteredPredictions, forceRefresh, quarterlyPredictions, systemQuarterlyPredictions, activeDataFilter])

  // Convert filtered predictions to match expected format
  const annualData = filteredAnnualPredictions.map((pred: any) => ({
    sector: pred.sector || 'Unknown',
    defaultRate: (pred.default_probability || pred.probability || 0) * 100,
    marketCap: `$${(Math.random() * 400 + 50).toFixed(1)}B`, // Random market cap for demo
    riskCategory: pred.risk_category || pred.risk_level,
    symbol: pred.company_symbol,
    reportingYear: pred.reporting_year,
    confidence: pred.confidence
  }))

  const quarterlyData = filteredQuarterlyPredictions.map((pred: any) => ({
    sector: pred.sector || 'Unknown',
    defaultRate: (pred.default_probability || pred.ensemble_probability || pred.logistic_probability || pred.gbm_probability || 0) * 100,
    marketCap: `$${(Math.random() * 400 + 50).toFixed(1)}B`, // Random market cap for demo
    riskCategory: pred.risk_category || pred.risk_level,
    symbol: pred.company_symbol,
    reportingQuarter: pred.reporting_quarter,
    reportingYear: pred.reporting_year,
    confidence: pred.confidence
  }))

  // Define analytics data interface
  interface AnalyticsDataItem {
    sector?: string;
    defaultRate: number;
    marketCap: string;
    riskCategory: string;
    symbol: string;
    reportingQuarter?: string;
    reportingYear?: string;
    confidence?: number;
  }

  const getAnalyticsData = (dataset: AnalyticsDataItem[]) => {
    if (!dataset.length) return {
      sectorData: [],
      riskDistributionData: [],
      defaultRateDistribution: [],
      scatterData: []
    }

    // Sector analysis
    const sectorMap = new Map<string, { sum: number; count: number }>()
    dataset.forEach(item => {
      if (item.sector &&
        item.sector.trim() !== '' &&
        item.sector !== 'Unknown') {
        const key = item.sector
        const entry = sectorMap.get(key) || { sum: 0, count: 0 }
        entry.sum += item.defaultRate
        entry.count += 1
        sectorMap.set(key, entry)
      }
    })

    const sectorData: Array<{ sector: string; defaultRate: number; count: number }> = Array.from(sectorMap.entries())
      .map(([sector, agg]) => ({
        sector,
        defaultRate: agg.count ? +(agg.sum / agg.count).toFixed(2) : 0,
        count: agg.count
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.defaultRate - a.defaultRate)
      .slice(0, 5)

    // Risk distribution
    const total = dataset.length || 1
    const riskCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
    dataset.forEach(item => {
      const riskKey = (item.riskCategory || 'LOW').toUpperCase()
      riskCounts[riskKey] = (riskCounts[riskKey] || 0) + 1
    })

    const riskDistributionData: Array<{ name: string; value: number; fill: string }> = [
      { name: 'Low', value: +(riskCounts.LOW * 100 / total).toFixed(1), fill: '#10b981' },
      { name: 'Medium', value: +(riskCounts.MEDIUM * 100 / total).toFixed(1), fill: '#f59e0b' },
      { name: 'High', value: +(riskCounts.HIGH * 100 / total).toFixed(1), fill: '#f97316' },
      { name: 'Critical', value: +(riskCounts.CRITICAL * 100 / total).toFixed(1), fill: '#ef4444' },
    ].filter(item => item.value > 0)

    // Default rate distribution
    const buckets = {
      '0-1%': 0,
      '1-2%': 0,
      '2-3%': 0,
      '3%+': 0,
    }
    dataset.forEach(item => {
      const p = item.defaultRate
      if (p < 1) buckets['0-1%']++
      else if (p < 2) buckets['1-2%']++
      else if (p < 3) buckets['2-3%']++
      else buckets['3%+']++
    })
    const defaultRateDistribution: Array<{ range: string; count: number }> = Object.entries(buckets).map(([range, count]) => ({ range, count }))

    // Scatter plot data - market cap vs default rate
    const scatterData: Array<{ marketCap: number; defaultRate: number; company: string }> = dataset.map(item => {
      // Parse market cap from formatted string
      let marketCapInBillions = 0
      if (item.marketCap && typeof item.marketCap === 'string') {
        const cleanStr = item.marketCap.replace(/[$,]/g, '')
        const numValue = parseFloat(cleanStr)

        if (cleanStr.includes('T')) {
          marketCapInBillions = numValue * 1000
        } else if (cleanStr.includes('B')) {
          marketCapInBillions = numValue
        } else if (cleanStr.includes('M')) {
          marketCapInBillions = numValue / 1000
        } else {
          marketCapInBillions = numValue / 1000000000
        }
      }

      return {
        marketCap: +marketCapInBillions.toFixed(1),
        defaultRate: +item.defaultRate.toFixed(2),
        company: item.symbol,
      }
    })

    return {
      sectorData,
      riskDistributionData,
      defaultRateDistribution,
      scatterData
    }
  }

  const getQuarterlyAnalyticsData = (dataset: AnalyticsDataItem[]) => {
    if (!dataset.length) return {
      sectorData: [],
      riskDistributionData: [],
      defaultRateDistribution: [],
      scatterData: [],
      quarterlyRiskTrends: [],
      quarterlySectorComparison: []
    }

    // Standard analytics using the existing function
    const standardAnalytics = getAnalyticsData(dataset)

    // Quarterly Risk Trends by Quarter (Stacked Chart)
    const quarterRiskMap = new Map<string, { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number }>()
    dataset.forEach(item => {
      const key = `${item.reportingQuarter} ${item.reportingYear}`
      const entry = quarterRiskMap.get(key) || { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
      const riskLevel = (item.riskCategory || 'LOW').toUpperCase()
      entry[riskLevel as keyof typeof entry] = (entry[riskLevel as keyof typeof entry] || 0) + 1
      quarterRiskMap.set(key, entry)
    })

    const quarterlyRiskTrends = Array.from(quarterRiskMap.entries())
      .map(([quarter, risks]) => ({
        quarter: quarter.replace(' ', ' '),
        low: risks.LOW,
        medium: risks.MEDIUM,
        high: risks.HIGH,
        critical: risks.CRITICAL
      }))
      .sort((a, b) => {
        const [quarterA, yearA] = a.quarter.split(' ')
        const [quarterB, yearB] = b.quarter.split(' ')
        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB)
        return quarterA.localeCompare(quarterB)
      })
      .slice(-6) // Show last 6 quarters

    return {
      ...standardAnalytics,
      quarterlyRiskTrends
    }
  }

  const annualAnalytics = getAnalyticsData(annualData)
  const quarterlyAnalytics = getQuarterlyAnalyticsData(quarterlyData)

  const chartConfigs = {
    sector: {
      defaultRate: {
        label: "Default Rate",
        color: "hsl(var(--chart-1))",
      },
    } satisfies ChartConfig,

    distribution: {
      count: {
        label: "Number of Companies",
        color: "hsl(var(--chart-2))",
      },
    } satisfies ChartConfig,

    scatter: {
      defaultRate: {
        label: "Default Rate",
        color: "hsl(var(--chart-3))",
      },
      marketCap: {
        label: "Market Cap",
        color: "hsl(var(--chart-4))",
      },
    } satisfies ChartConfig,

    quarterlyRiskTrends: {
      low: {
        label: "Low Risk",
        color: "hsl(var(--chart-1))",
      },
      medium: {
        label: "Medium Risk",
        color: "hsl(var(--chart-2))",
      },
      high: {
        label: "High Risk",
        color: "hsl(var(--chart-3))",
      },
      critical: {
        label: "Critical Risk",
        color: "hsl(var(--chart-4))",
      },
    } satisfies ChartConfig,
  }

  interface AnalyticsResults {
    sectorData: Array<{ sector: string; defaultRate: number; count: number }>;
    riskDistributionData: Array<{ name: string; value: number; fill: string }>;
    defaultRateDistribution: Array<{ range: string; count: number }>;
    scatterData: Array<{ defaultRate: number; marketCap: number; company: string }>;
    quarterlyRiskTrends?: Array<{ quarter: string; low: number; medium: number; high: number; critical: number }>;
  }

  const renderAnalytics = (analytics: AnalyticsResults, dataType: string) => {
    const { sectorData, riskDistributionData, defaultRateDistribution, scatterData, quarterlyRiskTrends } = analytics

    if (!sectorData.length && !riskDistributionData.length) {
      return (
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
            </p>
          </div>
        </Card>
      )
    }

    const isQuarterly = dataType === "Quarterly"
    const sectorTitle = "Top 5 Sectors by Default Rate"
    const riskTitle = "Risk Category Distribution"
    const distributionTitle = "Default Rate Distribution"
    const scatterTitle = "Default Rate vs Market Cap"

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isQuarterly && quarterlyRiskTrends && quarterlyRiskTrends.length > 0 && (
            <Card className="">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-bricolage">
                  <span>Risk Distribution by Quarter</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigs.quarterlyRiskTrends}>
                  <BarChart accessibilityLayer data={quarterlyRiskTrends}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="quarter"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.replace(' ', '\n')}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="low"
                      stackId="risk"
                      fill="#10b981"
                      radius={[0, 0, 4, 4]}
                    />
                    <Bar
                      dataKey="medium"
                      stackId="risk"
                      fill="#f59e0b"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="high"
                      stackId="risk"
                      fill="#f97316"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="critical"
                      stackId="risk"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-bricolage">
                <span>{sectorTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sectorData.length > 0 ? (
                <ChartContainer config={chartConfigs.sector}>
                  <BarChart accessibilityLayer data={sectorData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="sector"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 12)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      domain={[0, 'dataMax']}
                      tickCount={6}
                      label={{
                        value: 'Default Rate (%)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dashed" />}
                    />
                    <Bar dataKey="defaultRate" fill="#8784D8" radius={4} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 font-bricolage">
                  No sector data available
                </div>
              )}
            </CardContent>
          </Card>
          {!isQuarterly && (
            <Card className="">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-bricolage">
                  <span>{riskTitle}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
                {riskDistributionData.length > 0 ? (
                  <ChartContainer config={chartConfigs.sector} className="mx-auto aspect-square max-h-[250px]">
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={riskDistributionData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                      >
                        {riskDistributionData.map((entry, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500 font-bricolage">
                    No risk data available
                  </div>
                )}
              </CardContent>
              {riskDistributionData.length > 0 && (
                <CardFooter className="flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 font-medium leading-none font-bricolage">
                    <div className="flex gap-4 flex-wrap">
                      {riskDistributionData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.fill }}
                          ></div>
                          <span className="text-xs font-bricolage">{item.name}: {item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          )}

          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-bricolage">
                <span>{distributionTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfigs.distribution}>
                <BarChart accessibilityLayer data={defaultRateDistribution}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="range"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    label={{
                      value: 'Default Rate Range',
                      position: 'insideBottom',
                      offset: -5,
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={[0, 'dataMax']}
                    tickCount={6}
                    label={{
                      value: isQuarterly ? 'Number of Quarterly Predictions' : 'Number of Annual Predictions',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <Bar dataKey="count" fill="#80CA9D" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-bricolage">
                <span>{scatterTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfigs.scatter}>
                <ScatterChart
                  accessibilityLayer
                  data={scatterData}
                  margin={{
                    left: 20,
                    right: 12,
                    bottom: 20,
                  }}
                >
                  <XAxis
                    type="number"
                    dataKey="marketCap"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={[0, 'dataMax']}
                    label={{
                      value: 'Market Cap (Billions $)',
                      position: 'insideBottom',
                      offset: -5,
                      style: { textAnchor: 'middle' }
                    }}
                    tickFormatter={(value: number) => {
                      if (value === 0) return '0'
                      if (value < 1) return `${(value * 1000).toFixed(0)}M`
                      if (value >= 1000) return `${(value / 1000).toFixed(1)}T`
                      return `${value.toFixed(0)}B`
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="defaultRate"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={[0, Math.max(5, Math.ceil(Math.max(0, ...scatterData.map((d) => d.defaultRate)) + 1))]}
                    label={{
                      value: 'Default Rate (%)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <Scatter
                    dataKey="defaultRate"
                    fill="var(--color-defaultRate)"
                  />
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  if (isPredictionsLoading) {
    return (
      <div className="space-y-6 font-bricolage">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bricolage font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-bricolage">
              Deep dive into risk patterns and model performance metrics
            </p>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex items-center space-x-1">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* 4 Charts Grid with Skeleton Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-full w-full rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!annualAnalytics && !quarterlyAnalytics) {
    return (
      <div className="space-y-6 font-bricolage">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Deep dive into risk patterns and model performance metrics
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 font-bricolage">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-bricolage">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 font-bricolage">Comprehensive analysis of company performance and model insights</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("annual")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors font-bricolage ${activeTab === "annual"
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            Annual
          </button>
          <button
            onClick={() => setActiveTab("quarterly")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors font-bricolage ${activeTab === "quarterly"
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            Quarterly
          </button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="annual" className="font-bricolage">Annual</TabsTrigger>
            <TabsTrigger value="quarterly" className="font-bricolage">Quarterly</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="annual" className="space-y-6">
          {renderAnalytics(annualAnalytics, "Annual")}
        </TabsContent>

        <TabsContent value="quarterly" className="space-y-6">
          {renderAnalytics(quarterlyAnalytics, "Quarterly")}
        </TabsContent>
      </Tabs>
    </div>
  )
}
