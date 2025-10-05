# Components Guide

## Component Architecture Overview

The application follows a hierarchical component structure based on atomic design principles, with clear separation between UI components, feature components, and layout components.

## Component Categories

### 1. UI Components (`components/ui/`)

Basic, reusable components built on top of Radix UI primitives with Tailwind CSS styling.

#### Button Component

```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
  className?: string
}

// Usage
<Button variant="outline" size="sm" onClick={handleClick}>
  Click Me
</Button>
```

#### Card Component

```typescript
interface CardProps {
  className?: string
  children: React.ReactNode
}

// Compound component structure
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

#### Form Components

```typescript
// Form with validation
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="Enter email" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

### 2. Authentication Components (`components/auth/`)

#### AuthGuard Component

```typescript
interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requireAuth?: boolean
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  requireAuth = true,
  fallback = <LoginRedirect />
}: AuthGuardProps) {
  const { isAuthenticated, user } = useAuthStore()
  
  if (requireAuth && !isAuthenticated) {
    return fallback
  }
  
  if (requiredRole && !hasRequiredRole(user, requiredRole)) {
    return <UnauthorizedAccess />
  }
  
  return <>{children}</>
}

// Usage
<AuthGuard requiredRole="org_admin">
  <AdminPanel />
</AuthGuard>
```

#### LoginForm Component

```typescript
export function LoginForm() {
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(data)
      if (response.success && response.data) {
        setAuth(
          response.data.access_token,
          response.data.refresh_token,
          response.data.user,
          response.data.expires_in
        )
        
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard'
        sessionStorage.removeItem('redirectAfterLogin')
        router.push(redirectTo)
      }
    } catch (error) {
      toast.error('Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Form {...form}>
      {/* Form implementation */}
    </Form>
  )
}
```

### 3. Dashboard Components (`components/dashboard/`)

#### DashboardOverview Component

The main dashboard landing view showing key metrics and summaries.

```typescript
export function DashboardOverview() {
  const { user } = useAuthStore()
  const { annualPredictions, quarterlyPredictions, isLoading } = usePredictionsStore()
  const { totalCompanies, riskDistribution } = useDashboardStatsStore()
  
  const stats = useMemo(() => ({
    totalPredictions: annualPredictions.length + quarterlyPredictions.length,
    highRiskCount: [...annualPredictions, ...quarterlyPredictions]
      .filter(p => p.default_probability > RISK_THRESHOLDS.HIGH).length,
    recentUploads: getRecentUploads(annualPredictions, quarterlyPredictions)
  }), [annualPredictions, quarterlyPredictions])
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title={`Welcome back, ${user?.full_name}`}
        description="Here's what's happening with your risk analysis"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Companies"
          value={totalCompanies}
          icon={<Building2 className="h-4 w-4" />}
          trend="+12% from last month"
        />
        <MetricCard
          title="High Risk"
          value={stats.highRiskCount}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="destructive"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistributionChart data={riskDistribution} />
        <RecentActivityPanel activities={recentActivity} />
      </div>
    </div>
  )
}
```

#### CompanyAnalysisTable Component

Displays company risk data in a sortable, filterable table format.

```typescript
interface CompanyAnalysisTableProps {
  predictions: Prediction[]
  type: 'annual' | 'quarterly'
  onCompanySelect?: (company: Company) => void
  onEditPrediction?: (prediction: Prediction) => void
  onDeletePrediction?: (predictionId: string) => void
}

export function CompanyAnalysisTable({
  predictions,
  type,
  onCompanySelect,
  onEditPrediction,
  onDeletePrediction
}: CompanyAnalysisTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const { canEditPredictions, canDeletePredictions } = useAuthStore()
  
  const columns: ColumnDef<Prediction>[] = [
    {
      accessorKey: "company_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Company Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("company_name")}</div>
      ),
    },
    {
      accessorKey: "default_probability",
      header: "Risk Score",
      cell: ({ row }) => {
        const probability = row.getValue("default_probability") as number
        return <RiskBadge probability={probability} />
      },
    },
    {
      accessorKey: "created_at",
      header: "Analysis Date",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string
        return format(new Date(date), "MMM dd, yyyy")
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const prediction = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCompanySelect?.(prediction)}>
                View Details
              </DropdownMenuItem>
              {canEditPredictions() && (
                <DropdownMenuItem onClick={() => onEditPrediction?.(prediction)}>
                  Edit Prediction
                </DropdownMenuItem>
              )}
              {canDeletePredictions() && (
                <DropdownMenuItem 
                  onClick={() => onDeletePrediction?.(prediction.id)}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
  
  const table = useReactTable({
    data: predictions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter companies..."
          value={(table.getColumn("company_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("company_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <ExportButton data={predictions} type={type} />
          <ColumnToggle table={table} />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <DataTablePagination table={table} />
    </div>
  )
}
```

#### BulkUploadManager Component

Handles file upload and batch processing workflows.

```typescript
interface BulkUploadManagerProps {
  className?: string
}

export function BulkUploadManager({ className }: BulkUploadManagerProps) {
  const {
    isUploading,
    uploadProgress,
    jobs,
    activeJobs,
    uploadFile,
    createJob,
    pollJobStatus
  } = useBulkUploadStore()
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [predictionType, setPredictionType] = useState<'annual' | 'quarterly'>('annual')
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles)
  }, [])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: FILE_UPLOAD.MAX_SIZE,
    multiple: false
  })
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    
    const file = selectedFiles[0]
    
    try {
      // Upload file
      const uploadResponse = await uploadFile(file)
      
      if (uploadResponse.success) {
        // Create processing job
        const jobId = await createJob({
          file_id: uploadResponse.data.file_id,
          prediction_type: predictionType,
          filename: file.name
        })
        
        // Start polling job status
        pollJobStatus(jobId)
        
        // Clear selected files
        setSelectedFiles([])
        
        toast.success('File uploaded successfully! Processing started.')
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.')
    }
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Bulk Upload</CardTitle>
        <CardDescription>
          Upload CSV or Excel files to analyze multiple companies at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          {isDragActive ? (
            <p>Drop the file here...</p>
          ) : (
            <div>
              <p>Drag & drop a file here, or click to select</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports CSV, XLS, XLSX files (max {FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB)
              </p>
            </div>
          )}
        </div>
        
        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Selected File:</Label>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Prediction Type Selection */}
        <div className="space-y-2">
          <Label>Prediction Type</Label>
          <Select value={predictionType} onValueChange={setPredictionType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annual">Annual Predictions</SelectItem>
              <SelectItem value="quarterly">Quarterly Predictions</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Process
            </>
          )}
        </Button>
      </CardFooter>
      
      {/* Active Jobs Display */}
      {activeJobs.length > 0 && (
        <div className="border-t p-4">
          <h4 className="font-medium mb-2">Processing Jobs</h4>
          {activeJobs.map(jobId => (
            <JobStatusDisplay key={jobId} jobId={jobId} />
          ))}
        </div>
      )}
    </Card>
  )
}
```

### 4. Admin Components (`components/admin/`)

#### UserManagementTab Component

Comprehensive user management interface for administrators.

```typescript
export function UserManagementTab({ onStatsUpdate }: UserManagementTabProps) {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active)
      
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])
  
  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await authApi.getUsers({ page: 1, size: 100 })
      
      if (response.success && response.data) {
        setUsers(response.data.items || [])
        
        // Update parent stats
        if (onStatsUpdate && response.data) {
          const stats = calculateUserStats(response.data.items || [])
          onStatsUpdate(stats)
        }
      }
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadUsers()
  }, [])
  
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
              <SelectItem value="org_admin">Org Admin</SelectItem>
              <SelectItem value="org_member">Org Member</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadUsers}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>
      
      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <UserTable 
              users={filteredUsers}
              onUserUpdate={loadUsers}
              onUserDelete={loadUsers}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Create User Dialog */}
      <CreateUserDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onUserCreated={loadUsers}
      />
    </div>
  )
}
```

## Component Patterns & Best Practices

### 1. Compound Components Pattern

```typescript
// Card compound component
export function Card({ className, ...props }: CardProps) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
  )
}

Card.Header = CardHeader
Card.Content = CardContent
Card.Footer = CardFooter
Card.Title = CardTitle
Card.Description = CardDescription

// Usage
<Card>
  <Card.Header>
    <Card.Title>Settings</Card.Title>
    <Card.Description>Manage your account settings</Card.Description>
  </Card.Header>
  <Card.Content>
    {/* Content */}
  </Card.Content>
</Card>
```

### 2. Render Props Pattern

```typescript
interface DataFetcherProps<T> {
  url: string
  children: (data: T | null, loading: boolean, error: string | null) => React.ReactNode
}

export function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchData()
  }, [url])
  
  return <>{children(data, loading, error)}</>
}

// Usage
<DataFetcher<User[]> url="/api/users">
  {(users, loading, error) => {
    if (loading) return <Spinner />
    if (error) return <ErrorMessage error={error} />
    return <UserList users={users} />
  }}
</DataFetcher>
```

### 3. Custom Hooks for Logic Sharing

```typescript
// Custom hook for data fetching
export function useApiData<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<T>(url)
      setData(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [url])
  
  useEffect(() => {
    refetch()
  }, [refetch])
  
  return { data, loading, error, refetch }
}

// Usage in components
export function UserProfile() {
  const { data: user, loading, error, refetch } = useApiData<User>('/api/profile')
  
  if (loading) return <ProfileSkeleton />
  if (error) return <ErrorBoundary error={error} retry={refetch} />
  
  return <ProfileCard user={user} />
}
```

This component architecture provides a robust, scalable foundation for building complex user interfaces while maintaining consistency and reusability across the application.
