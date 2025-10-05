# Dashboard Features

## Dashboard Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   DASHBOARD INTERFACE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 Overview            📈 Analytics          🏢 Company     │
│ ┌─────────────────┐   ┌─────────────────┐   ┌──────────┐   │
│ │ 📋 Key Metrics  │   │ 📊 Charts       │   │ 🔍 Search│   │
│ │ 🏢 Recent Cos   │   │ 📈 Trends       │   │ 📄 Details│  │
│ │ ⚡ Quick Actions│   │ 🎯 Filters      │   │ 📊 Risk   │   │
│ │ 📢 Notifications│   │ 📤 Export       │   │ 🔄 History│   │
│ └─────────────────┘   └─────────────────┘   └──────────┘   │
│                                                             │
│ 🎯 Custom Analysis     📤 Bulk Upload        💡 Insights    │
│ ┌─────────────────┐   ┌─────────────────┐   ┌──────────┐   │
│ │ 📝 Input Form   │   │ 📁 File Drop    │   │ 📚 Guides│   │
│ │ ⚙️ Parameters   │   │ 📊 Progress     │   │ 📊 Trends│   │
│ │ 🚀 Predict      │   │ ✅ Validation   │   │ 🎓 Learn │   │
│ │ 📋 Results      │   │ 📋 Jobs Queue   │   │ ❓ Help  │   │
│ └─────────────────┘   └─────────────────┘   └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Risk Analysis Workflow

```
Data Input ──┐
            │
            ▼
┌─────────────────────┐    ┌──────────────┐    ┌─────────────┐
│ 📤 Upload Methods   │───▶│ 🔍 Processing│───▶│ 📊 Results  │
│ • CSV/Excel Files   │    │ • Validation │    │ • Risk Score│
│ • Manual Entry      │    │ • ML Analysis│    │ • Categories│
│ • API Integration   │    │ • Risk Calc  │    │ • Reports   │
└─────────────────────┘    └──────────────┘    └─────────────┘
                                   │                    │
                                   ▼                    ▼
                          ┌──────────────┐    ┌─────────────┐
                          │ ⚠️ Error     │    │ 📤 Actions  │
                          │ Handling     │    │ • Export    │
                          │ • Validation │    │ • Share     │
                          │ • Retry      │    │ • Archive   │
                          └──────────────┘    └─────────────┘
```

## Core Business Features

### Risk Analysis Dashboard
The main dashboard provides users with comprehensive risk analysis capabilities through an intuitive interface. Users can view key performance indicators, recent analysis results, and quick access to frequently used features.

**Key Metrics Display**
- Total companies analyzed with risk distribution
- Recent predictions and their accuracy rates  
- Portfolio-level risk assessments and trends
- System performance and processing statistics

### Company Analysis Interface
Individual company analysis provides detailed risk scoring with comprehensive data visualization. Users can input company data manually or upload files for automated processing.

**Analysis Capabilities**
- Real-time risk probability calculations
- Historical performance trend analysis
- Industry benchmark comparisons
- Detailed risk factor breakdowns
- Exportable reports and documentation

### Bulk Processing System  
The bulk upload feature allows users to process multiple companies simultaneously through CSV or Excel file uploads with real-time progress monitoring.

**Processing Features**
- Drag-and-drop file upload interface
- Real-time validation and error reporting
- Background job processing with status updates
- Batch export capabilities for results
- Processing history and audit trails

## Dashboard State Management

### Tab-Based Navigation
The dashboard uses a sophisticated tab system that synchronizes with URL routing, allowing users to bookmark specific views and maintain state across browser sessions.

### Real-Time Updates
All dashboard data updates in real-time through background synchronization, ensuring users always see the most current information without manual refreshes.

### Responsive Design
The dashboard adapts to different screen sizes and devices, providing optimal user experience whether accessed on desktop, tablet, or mobile devices.
      totalPredictions: allPredictions.length,
      highRiskCount: allPredictions.filter(p => 
        p.default_probability > RISK_THRESHOLDS.HIGH
      ).length,
      recentUploads: getRecentUploads(allPredictions),
      avgRiskScore: calculateAverageRisk(allPredictions),
      trendsData: calculateTrends(allPredictions)
    }
  }, [annualPredictions, quarterlyPredictions])
  
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.full_name}</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your risk analysis
          </p>
        </div>
        <RefreshButton />
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Companies"
          value={totalCompanies}
          change="+12% from last month"
          icon={<Building2 className="h-5 w-5" />}
        />
        <MetricCard
          title="High Risk"
          value={stats.highRiskCount}
          change="2 new this week"
          variant="destructive"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <MetricCard
          title="Avg Risk Score"
          value={`${(stats.avgRiskScore * 100).toFixed(1)}%`}
          change="-2.3% improvement"
          variant="success"
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <MetricCard
          title="Active Jobs"
          value={activeJobs.length}
          icon={<Activity className="h-5 w-5" />}
        />
      </div>
      
      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistributionChart data={riskDistribution} />
        <TrendAnalysisChart data={stats.trendsData} />
      </div>
      
      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivityPanel />
        </div>
        <QuickActionsPanel />
      </div>
    </div>
  )
}
```

#### Metric Card Component

```typescript
interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  variant?: 'default' | 'destructive' | 'success'
  icon?: React.ReactNode
}

export function MetricCard({ title, value, change, variant = 'default', icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p className={cn(
                "text-xs",
                variant === 'destructive' && "text-destructive",
                variant === 'success' && "text-green-600",
                variant === 'default' && "text-muted-foreground"
              )}>
                {change}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "p-2 rounded-lg",
              variant === 'destructive' && "bg-destructive/10 text-destructive",
              variant === 'success' && "bg-green-100 text-green-600",
              variant === 'default' && "bg-primary/10 text-primary"
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 2. Analytics View (`AnalyticsView`)

Comprehensive data analysis interface with advanced filtering and visualization capabilities.

```typescript
export function AnalyticsView() {
  const { annualPredictions, quarterlyPredictions, isLoading } = usePredictionsStore()
  const { activeDataSource } = useDashboardStore()
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  
  // Data processing
  const processedData = useMemo(() => {
    const data = activeDataSource === 'annual' ? annualPredictions : quarterlyPredictions
    
    return {
      riskDistribution: calculateRiskDistribution(data),
      sectorAnalysis: analyzeBySector(data),
      timeSeriesData: createTimeSeriesData(data),
      correlationMatrix: calculateCorrelations(data),
      topRisks: getTopRiskCompanies(data, 10)
    }
  }, [annualPredictions, quarterlyPredictions, activeDataSource])
  
  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Risk Analytics</h2>
          <p className="text-muted-foreground">
            Deep dive into your portfolio risk metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DataSourceTabs />
          <ExportAnalyticsButton data={processedData} />
        </div>
      </div>
      
      {/* Filter Controls */}
      <AnalyticsFilters />
      
      {/* Main Analytics Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Primary Chart Area */}
        <div className="xl:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <TimeSeriesChart 
                data={processedData.timeSeriesData}
                onDataPointClick={setSelectedCompany}
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sector Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <SectorChart data={processedData.sectorAnalysis} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Risk Correlation Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <CorrelationHeatmap data={processedData.correlationMatrix} />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Side Panel */}
        <div className="space-y-6">
          <TopRisksPanel risks={processedData.topRisks} />
          {selectedCompany && (
            <CompanyDetailsPanel 
              company={selectedCompany}
              onClose={() => setSelectedCompany(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

### 3. Company Details View (`CompanyDetailsView`)

Individual company analysis with detailed risk breakdown and historical data.

```typescript
export function CompanyDetailsView() {
  const { selectedCompany, setSelectedCompany } = useDashboardStore()
  const { annualPredictions, quarterlyPredictions } = usePredictionsStore()
  
  // Find company data across both prediction types
  const companyData = useMemo(() => {
    if (!selectedCompany) return null
    
    const annualData = annualPredictions.filter(p => 
      p.company_name === selectedCompany.company_name
    )
    const quarterlyData = quarterlyPredictions.filter(p =>
      p.company_name === selectedCompany.company_name
    )
    
    return {
      company: selectedCompany,
      annualPredictions: annualData,
      quarterlyPredictions: quarterlyData,
      historicalData: [...annualData, ...quarterlyData].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }
  }, [selectedCompany, annualPredictions, quarterlyPredictions])
  
  if (!companyData) {
    return <EmptyCompanyState onSelectCompany={setSelectedCompany} />
  }
  
  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCompany(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{companyData.company.company_name}</h2>
            <p className="text-muted-foreground">
              Detailed risk analysis and historical data
            </p>
          </div>
        </div>
        <CompanyActionMenu company={companyData.company} />
      </div>
      
      {/* Company Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Current Risk</p>
                <p className="text-2xl font-bold">
                  {(companyData.company.default_probability * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Risk Category</p>
                <RiskBadge probability={companyData.company.default_probability} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">
                  {format(new Date(companyData.company.created_at), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CompanyRiskChart data={companyData.historicalData} />
          <CompanyFinancialMetrics company={companyData.company} />
        </div>
        
        <div className="space-y-6">
          <CompanyRiskFactors company={companyData.company} />
          <CompanyRecommendations company={companyData.company} />
        </div>
      </div>
    </div>
  )
}
```

### 4. Custom Analysis View (`CustomAnalysisView`)

Manual prediction input interface for ad-hoc risk analysis.

```typescript
export function CustomAnalysisView() {
  const { createPrediction } = usePredictionsStore()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<Prediction | null>(null)
  
  const form = useForm<CustomAnalysisForm>({
    resolver: zodResolver(customAnalysisSchema),
    defaultValues: {
      company_name: '',
      prediction_type: 'annual',
      financial_data: {
        revenue: '',
        assets: '',
        liabilities: '',
        equity: '',
        // ... other financial fields
      }
    }
  })
  
  const onSubmit = async (data: CustomAnalysisForm) => {
    setIsAnalyzing(true)
    try {
      const prediction = await predictionsApi.createPrediction({
        ...data,
        source: 'manual_input'
      })
      
      if (prediction.success) {
        setAnalysisResult(prediction.data)
        toast.success('Analysis completed successfully!')
        
        // Update predictions store
        createPrediction(prediction.data)
      }
    } catch (error) {
      toast.error('Analysis failed. Please check your input and try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Custom Risk Analysis</h2>
        <p className="text-muted-foreground">
          Enter company financial data to generate a custom risk prediction
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Enter the financial data for risk analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="prediction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prediction Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Financial Data Fields */}
                <div className="space-y-4">
                  <h4 className="font-medium">Financial Data</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="financial_data.revenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Revenue</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="financial_data.assets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Assets</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={isAnalyzing} className="w-full">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Generate Risk Prediction'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Analysis Result */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Analyzing financial data...</p>
                  <p className="text-sm text-muted-foreground">
                    This may take a few moments
                  </p>
                </div>
              </div>
            ) : analysisResult ? (
              <AnalysisResultDisplay result={analysisResult} />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Enter company data to see analysis results</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### 5. Data Management Features

#### Data Source Tabs

```typescript
export function DataSourceTabs() {
  const { activeDataSource, setActiveDataSource } = useDashboardStore()
  const { annualPredictions, quarterlyPredictions } = usePredictionsStore()
  
  return (
    <Tabs value={activeDataSource} onValueChange={setActiveDataSource}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="annual" className="flex items-center space-x-2">
          <span>Annual</span>
          <Badge variant="secondary">{annualPredictions.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="quarterly" className="flex items-center space-x-2">
          <span>Quarterly</span>
          <Badge variant="secondary">{quarterlyPredictions.length}</Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
```

#### Organization Selector

```typescript
export function OrganizationSelector() {
  const { user, canManageOrganizations } = useAuthStore()
  const { selectedOrganization, setSelectedOrganization } = useDashboardStore()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  
  useEffect(() => {
    if (canManageOrganizations()) {
      loadOrganizations()
    }
  }, [canManageOrganizations])
  
  if (!canManageOrganizations() || organizations.length <= 1) {
    return null
  }
  
  return (
    <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select organization" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Organizations</SelectItem>
        {organizations.map(org => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

## Dashboard State Management

The dashboard uses a combination of Zustand stores and React Query for state management:

- **Dashboard Store**: UI state, filters, selected items
- **Predictions Store**: Business data and caching
- **Bulk Upload Store**: File processing status
- **Dashboard Stats Store**: Analytics and metrics

## Performance Optimization

### 1. Data Virtualization
Large datasets are virtualized to improve rendering performance:

```typescript
// Virtual table for large datasets
<VirtualizedTable
  data={predictions}
  rowHeight={60}
  height={400}
  columns={columns}
/>
```

### 2. Memoization
Expensive computations are memoized:

```typescript
const processedAnalytics = useMemo(() => 
  computeAnalytics(predictions), 
  [predictions]
)
```

### 3. Code Splitting
Dashboard components are lazy-loaded:

```typescript
const AnalyticsView = lazy(() => import('./analytics-view'))
const CustomAnalysisView = lazy(() => import('./custom-analysis-view'))
```

This comprehensive dashboard architecture provides users with powerful tools for financial risk analysis while maintaining excellent performance and user experience.
