# State Management Architecture

## Dual-Layer State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE STATE                        │
│                       (Zustand)                             │
├─────────────────────────────────────────────────────────────┤
│ 🔐 Auth Store        📊 Dashboard Store   📤 Upload Store   │
│ ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     │
│ │• User Info  │     │• UI State   │     │• File Queue │     │
│ │• Tokens     │     │• Filters    │     │• Progress   │     │
│ │• Permissions│     │• Preferences│     │• Job Status │     │
│ └─────────────┘     └─────────────┘     └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER STATE                             │
│                   (TanStack Query)                          │
├─────────────────────────────────────────────────────────────┤
│ 🌐 API Data         📈 Analytics       👥 User Management   │
│ ┌─────────────┐     ┌─────────────┐    ┌─────────────┐     │
│ │• Predictions│     │• Statistics │    │• Users List │     │
│ │• Companies  │     │• Reports    │    │• Roles      │     │
│ │• Risk Data  │     │• Metrics    │    │• Permissions│     │
│ └─────────────┘     └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## State Flow Diagram

```
User Action ──┐
              │
              ▼
┌─────────────────────┐    ┌──────────────┐    ┌─────────────┐
│   🎯 Component      │───▶│  🗄️ Zustand  │───▶│ 🎨 UI Update│
│   Event Handler     │    │   Store      │    │   Re-render │
└─────────────────────┘    └──────────────┘    └─────────────┘
              │                     │
              │                     ▼
              │            ┌──────────────┐    ┌─────────────┐
              └───────────▶│ 🌐 TanStack  │───▶│ 📊 Cache    │
                          │   Query      │    │   Update    │
                          └──────────────┘    └─────────────┘
                                   │
                                   ▼
                          ┌──────────────┐    ┌─────────────┐
                          │ 🔌 API Call  │───▶│ 🔄 Background│
                          │   Request    │    │   Sync      │
                          └──────────────┘    └─────────────┘
```

## Core Store Architecture

### 🔐 Authentication Store
```
┌─────────────────────────────────────────┐
│              Auth Store                 │
├─────────────────────────────────────────┤
│ State:                                  │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 👤 User Info    │ │ 🔑 Tokens       │ │
│ │ • Profile       │ │ • Access Token  │ │
│ │ • Role          │ │ • Refresh Token │ │
│ │ • Permissions   │ │ • Expiry Time   │ │
│ └─────────────────┘ └─────────────────┘ │
│                                         │
│ Actions:                                │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 🔓 Login        │ │ 🔄 Refresh      │ │
│ │ 🚪 Logout       │ │ ✅ Validate     │ │
│ │ 👤 Update User  │ │ 🔍 Check Perms  │ │
│ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────┘
```

### 📊 Dashboard Store  
```
┌─────────────────────────────────────────┐
│            Dashboard Store              │
├─────────────────────────────────────────┤
│ UI State:                               │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 🏷️ Active Tab   │ │ 🔍 Filters     │ │
│ │ 🏢 Selected Co  │ │ 📅 Date Range  │ │
│ │ 🎨 View Mode    │ │ ⚠️ Risk Level  │ │
│ └─────────────────┘ └─────────────────┘ │
│                                         │
│ Preferences:                            │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 📱 Layout       │ │ 💾 Persistence  │ │
│ │ 🎯 Sorting      │ │ 🔄 Auto-save    │ │
│ │ 📏 Page Size    │ │ 🎨 Theme        │ │
│ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────┘
```

### 📈 Predictions Store
```
┌─────────────────────────────────────────┐
│           Predictions Store             │
├─────────────────────────────────────────┤
│ Business Data:                          │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 📊 Annual Data  │ │ 🗓️ Quarterly    │ │
│ │ • Risk Scores   │ │ • Trends        │ │
│ │ • Company Info  │ │ • Comparisons   │ │
│ │ • Predictions   │ │ • Forecasts     │ │
│ └─────────────────┘ └─────────────────┘ │
│                                         │
│ Operations:                             │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ ➕ Create       │ │ 📤 Export       │ │
│ │ ✏️ Update       │ │ 🗑️ Delete       │ │
│ │ 🔍 Filter       │ │ 📋 Select       │ │
│ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────┘
```

### 📤 Bulk Upload Store
```
┌─────────────────────────────────────────┐
│           Bulk Upload Store             │
├─────────────────────────────────────────┤
│ File Management:                        │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 📁 File Queue   │ │ 📊 Progress     │ │
│ │ • CSV Files     │ │ • Upload %      │ │
│ │ • Excel Files   │ │ • Processing %  │ │
│ │ • Validation    │ │ • Status        │ │
│ └─────────────────┘ └─────────────────┘ │
│                                         │
│ Job Management:                         │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ ⚙️ Active Jobs   │ │ 📋 Job History  │ │
│ │ • Processing    │ │ • Completed     │ │
│ │ • Queued        │ │ • Failed        │ │
│ │ • Monitoring    │ │ • Results       │ │
│ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────┘
```

## State Persistence Strategy

### 💾 Storage Layers
```
┌─────────────────────────────────────────────────────────────┐
│                    PERSISTENCE STRATEGY                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔒 Secure Storage        💾 Local Storage     🗄️ Session   │
│ ┌─────────────────┐     ┌─────────────────┐   ┌──────────┐  │
│ │ • Auth Tokens   │     │ • UI Preferences│   │ • Temp   │  │
│ │ • Refresh Token │     │ • Theme Settings│   │   Data   │  │
│ │ • User Session  │     │ • Dashboard     │   │ • Form   │  │
│ │               │     │   Layout        │   │   State  │  │
│ └─────────────────┘     └─────────────────┘   └──────────┘  │
│                                                             │
│        ↕️                      ↕️                  ↕️        │
│   Auto Encrypt            Persist Store        Clear on     │
│   HTTPS Only              Cross-Session         Browser     │
│                                               Close        │
└─────────────────────────────────────────────────────────────┘
```

### 2. Dashboard Store (`dashboard-store.ts`)

Manages UI state and user preferences for the dashboard interface.

```typescript
interface DashboardState {
  // UI State
  activeTab: string
  selectedCompany: Company | null
  searchTerm: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  
  // Filters
  riskFilter: string
  dateRangeFilter: DateRange | null
  organizationFilter: string | null
  
  // View Preferences
  tableView: 'compact' | 'detailed'
  chartsExpanded: boolean
  sidebarCollapsed: boolean
  
  // Actions
  setActiveTab: (tab: string) => void
  setSelectedCompany: (company: Company | null) => void
  updateFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  toggleView: (view: string) => void
}
```

**Key Features:**
- Tab management with URL synchronization
- Filter state persistence
- View preferences storage
- Company selection management

### 3. Predictions Store (`predictions-store.ts`)

Manages business data related to risk predictions and analysis.

```typescript
interface PredictionsState {
  // Data State
  annualPredictions: Prediction[]
  quarterlyPredictions: Prediction[]
  selectedPredictions: Prediction[]
  
  // Loading States
  isLoading: boolean
  isInitialized: boolean
  loadingStates: Record<string, boolean>
  
  // Cache Management  
  lastFetchTime: number | null
  dataVersion: number
  
  // Error State
  error: string | null
  
  // Actions
  fetchPredictions: (forceRefresh?: boolean) => Promise<void>
  addPrediction: (prediction: Prediction) => void
  updatePrediction: (id: string, updates: Partial<Prediction>) => void
  deletePrediction: (id: string) => void
  clearPredictions: () => void
  
  // Selection Management
  selectPrediction: (id: string) => void
  deselectPrediction: (id: string) => void
  clearSelection: () => void
  
  // Data Processing
  getPredictionsByRisk: (riskLevel: string) => Prediction[]
  getAnalyticsSummary: () => AnalyticsSummary
  exportPredictions: (format: 'csv' | 'excel') => void
}
```

**Key Features:**
- Intelligent caching with cache invalidation
- Optimistic updates for better UX
- Batch operations support
- Analytics data computation
- Export functionality

### 4. Bulk Upload Store (`bulk-upload-store.ts`)

Manages file upload, processing jobs, and batch operations.

```typescript
interface BulkUploadState {
  // Upload State
  isUploading: boolean
  uploadProgress: number
  uploadedFiles: UploadedFile[]
  
  // Job Management
  jobs: BulkUploadJob[]
  activeJobs: string[]
  completedJobs: string[]
  failedJobs: string[]
  
  // Processing State
  isProcessing: boolean
  processingStep: ProcessingStep
  
  // Actions
  uploadFile: (file: File) => Promise<UploadResponse>
  createJob: (jobData: JobCreationData) => Promise<string>
  startJobProcessing: (jobId: string) => Promise<void>
  cancelJob: (jobId: string) => Promise<void>
  
  // Job Monitoring
  pollJobStatus: (jobId: string) => void
  stopPolling: (jobId: string) => void
  getJobResults: (jobId: string) => Promise<JobResults>
  
  // Cleanup
  clearCompletedJobs: () => void
  clearAllJobs: () => void
}
```

**Key Features:**
- File upload with progress tracking
- Job lifecycle management
- Real-time status polling
- Error handling and retry logic
- Resource cleanup

### 5. Dashboard Stats Store (`dashboard-stats-store.ts`)

Manages dashboard metrics and analytics data.

```typescript
interface DashboardStatsState {
  // Statistics
  totalCompanies: number
  totalPredictions: number
  riskDistribution: RiskDistribution
  recentActivity: ActivityItem[]
  
  // Loading State
  isLoadingStats: boolean
  lastStatsUpdate: number | null
  
  // Actions
  fetchDashboardStats: () => Promise<void>
  updateStats: (stats: Partial<DashboardStats>) => void
  addActivityItem: (item: ActivityItem) => void
  clearStats: () => void
  
  // Real-time Updates
  subscribeToUpdates: () => void
  unsubscribeFromUpdates: () => void
}
```

## Store Patterns & Best Practices

### 1. Store Creation Pattern

```typescript
export const useExampleStore = create<ExampleState>()(
  persist(
    (set, get) => ({
      // Initial state
      data: null,
      loading: false,
      
      // Actions
      fetchData: async () => {
        set({ loading: true })
        try {
          const data = await api.getData()
          set({ data, loading: false })
        } catch (error) {
          set({ loading: false, error: error.message })
        }
      },
      
      // Computed values (selectors)
      getFilteredData: () => {
        const { data, filters } = get()
        return data?.filter(item => matchesFilters(item, filters))
      }
    }),
    {
      name: 'example-store', // localStorage key
      partialize: (state) => ({ 
        // Only persist specific fields
        data: state.data,
        preferences: state.preferences
      })
    }
  )
)
```

### 2. Optimistic Updates Pattern

```typescript
// Optimistic update with rollback on error
updatePrediction: async (id: string, updates: Partial<Prediction>) => {
  const { annualPredictions } = get()
  const originalPrediction = annualPredictions.find(p => p.id === id)
  
  // Optimistically update UI
  set({
    annualPredictions: annualPredictions.map(p =>
      p.id === id ? { ...p, ...updates } : p
    )
  })
  
  try {
    await predictionsApi.updatePrediction(id, updates)
  } catch (error) {
    // Rollback on error
    set({
      annualPredictions: annualPredictions.map(p =>
        p.id === id ? originalPrediction : p
      )
    })
    toast.error('Failed to update prediction')
  }
}
```

### 3. Loading State Management

```typescript
// Centralized loading state management
setLoading: (key: string, loading: boolean) => {
  set((state) => ({
    loadingStates: {
      ...state.loadingStates,
      [key]: loading
    }
  }))
}

// Usage
const { loadingStates, setLoading } = useStore()

const fetchData = async () => {
  setLoading('fetchData', true)
  try {
    // API call
  } finally {
    setLoading('fetchData', false)
  }
}
```

### 4. Event-Driven Updates

```typescript
// Listen for cross-store events
useEffect(() => {
  const handlePredictionCreated = () => {
    // Refresh predictions when new ones are created
    fetchPredictions(true)
  }
  
  window.addEventListener('prediction-created', handlePredictionCreated)
  return () => window.removeEventListener('prediction-created', handlePredictionCreated)
}, [fetchPredictions])

// Dispatch events from other stores
window.dispatchEvent(new CustomEvent('prediction-created', { 
  detail: { predictionId: newPrediction.id }
}))
```

## State Persistence Strategy

### 1. Persistent Stores
```typescript
// Auth store - persisted for login sessions
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({ /* store implementation */ }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        tokenExpiresAt: state.tokenExpiresAt
      })
    }
  )
)

// Dashboard store - persisted for user preferences  
export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({ /* store implementation */ }),
    {
      name: 'dashboard-preferences',
      partialize: (state) => ({
        activeTab: state.activeTab,
        tableView: state.tableView,
        sidebarCollapsed: state.sidebarCollapsed
      })
    }
  )
)
```

### 2. Session-Only Stores
```typescript
// Predictions store - not persisted (fresh data on reload)
export const usePredictionsStore = create<PredictionsState>(
  (set, get) => ({
    // Implementation without persistence
  })
)
```

## Store Integration Patterns

### 1. Cross-Store Communication

```typescript
// Store A notifies Store B of changes
export const useStoreA = create<StoreAState>((set, get) => ({
  updateData: async (data) => {
    set({ data })
    
    // Notify other stores
    useStoreB.getState().onStoreAUpdate(data)
    
    // Or use events
    window.dispatchEvent(new CustomEvent('store-a-updated', { detail: data }))
  }
}))
```

### 2. Computed Values Across Stores

```typescript
// Custom hook combining multiple stores
export function useDashboardData() {
  const { user } = useAuthStore()
  const { predictions } = usePredictionsStore()
  const { activeTab } = useDashboardStore()
  
  return useMemo(() => ({
    filteredPredictions: predictions.filter(p => p.userId === user?.id),
    userPermissions: getUserPermissions(user),
    activeData: getActiveTabData(activeTab, predictions)
  }), [user, predictions, activeTab])
}
```

### 3. Store Cleanup on Logout

```typescript
// Clear all stores on logout
clearAuth: () => {
  set({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    user: null
  })
  
  // Clear other stores
  usePredictionsStore.getState().clearPredictions()
  useDashboardStore.getState().resetToDefaults()
  useBulkUploadStore.getState().clearAllJobs()
}
```

## Performance Optimization

### 1. Selective Subscriptions
```typescript
// Only subscribe to specific parts of the store
const predictions = usePredictionsStore(state => state.annualPredictions)
const isLoading = usePredictionsStore(state => state.isLoading)

// Avoid subscribing to entire store
// const store = usePredictionsStore() // ❌ Re-renders on any change
```

### 2. Memoized Selectors
```typescript
// Memoize expensive computations
const getAnalyticsSummary = useMemo(() => 
  createSelector(
    (state: PredictionsState) => state.annualPredictions,
    (predictions) => computeAnalytics(predictions)
  ), []
)
```

### 3. Batch Updates
```typescript
// Batch multiple updates
batchUpdatePredictions: (updates: PredictionUpdate[]) => {
  set((state) => {
    const newPredictions = [...state.annualPredictions]
    
    updates.forEach(update => {
      const index = newPredictions.findIndex(p => p.id === update.id)
      if (index !== -1) {
        newPredictions[index] = { ...newPredictions[index], ...update.data }
      }
    })
    
    return { annualPredictions: newPredictions }
  })
}
```