# Types & Interfaces

## Type System Overview

The application uses a comprehensive TypeScript type system that provides type safety across all layers of the application, from API responses to UI components. The types are organized by domain and functionality for better maintainability.

## Core Type Structure

```
lib/types/
├── common.ts          # Shared types and utilities
├── api.ts             # API response types
├── auth.ts            # Authentication & user types
├── user.ts            # User management types
├── tenant.ts          # Multi-tenant organization types
├── prediction.ts      # Risk prediction types
├── upload.ts          # File upload & processing types
└── index.ts           # Type exports
```

## Common Types (`common.ts`)

### Base Entity Types

```typescript
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface TimestampedEntity {
  created_at: string
  updated_at: string
}

export interface SoftDeletableEntity extends BaseEntity {
  deleted_at: string | null
  is_deleted: boolean
}
```

### API Response Types

```typescript
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
  timestamp?: string
}

export interface ApiError {
  code: string
  message: string
  field?: string
  details?: Record<string, any>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
  has_next: boolean
  has_prev: boolean
}

export interface PaginationParams {
  page?: number
  size?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
```

### Utility Types

```typescript
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type Nullable<T> = T | null

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Status enums
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

## Authentication Types (`auth.ts`)

### User Roles and Permissions

```typescript
export type UserRole = 'super_admin' | 'tenant_admin' | 'org_admin' | 'org_member' | 'user'

export interface RolePermissions {
  [key: string]: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    manage: boolean
  }
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  super_admin: {
    tenants: { create: true, read: true, update: true, delete: true, manage: true },
    organizations: { create: true, read: true, update: true, delete: true, manage: true },
    users: { create: true, read: true, update: true, delete: true, manage: true },
    predictions: { create: true, read: true, update: true, delete: true, manage: true },
  },
  tenant_admin: {
    organizations: { create: true, read: true, update: true, delete: true, manage: true },
    users: { create: true, read: true, update: true, delete: true, manage: true },
    predictions: { create: true, read: true, update: true, delete: true, manage: true },
  },
  org_admin: {
    users: { create: true, read: true, update: true, delete: false, manage: true },
    predictions: { create: true, read: true, update: true, delete: true, manage: true },
  },
  org_member: {
    predictions: { create: true, read: true, update: false, delete: false, manage: false },
  },
  user: {
    predictions: { create: false, read: true, update: false, delete: false, manage: false },
  }
}
```

### Authentication Requests

```typescript
export interface LoginRequest {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterRequest {
  email: string
  username?: string
  full_name: string
  password: string
  role?: UserRole
  first_name?: string
  last_name?: string
  organization_id?: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface UpdateProfileRequest {
  username?: string
  email?: string
  full_name?: string
  first_name?: string
  last_name?: string
  sector?: string
  phone?: string
  bio?: string
}

export interface ResetPasswordRequest {
  email: string
  reset_url?: string
}

export interface ResetPasswordConfirmRequest {
  token: string
  password: string
  confirm_password: string
}
```

### Authentication Responses

```typescript
export interface Token {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  user?: UserResponse
  scope?: string[]
}

export interface UserResponse extends BaseEntity {
  email: string
  username: string | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  role: UserRole
  is_active: boolean
  is_verified: boolean
  
  // Organization & Tenant relationships
  organization_id: string | null
  organization?: OrganizationResponse
  tenant_id: string | null
  tenant?: TenantResponse
  
  // Profile information
  sector: string | null
  phone: string | null
  bio: string | null
  avatar_url: string | null
  
  // Timestamps
  last_login: string | null
  email_verified_at: string | null
  
  // Computed properties
  display_name: string
  initials: string
}

export interface UserProfile extends UserResponse {
  preferences: UserPreferences
  permissions: RolePermissions
  organizations: OrganizationResponse[]
  activity_summary: UserActivitySummary
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  date_format: string
  currency: string
  notifications: NotificationPreferences
  dashboard: DashboardPreferences
}

export interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  notification_types: {
    risk_alerts: boolean
    job_completion: boolean
    system_updates: boolean
    security_alerts: boolean
  }
}

export interface DashboardPreferences {
  default_view: string
  charts_expanded: boolean
  table_density: 'compact' | 'comfortable' | 'spacious'
  auto_refresh: boolean
  refresh_interval: number
}
```

## Tenant & Organization Types (`tenant.ts`)

### Tenant Management

```typescript
export interface TenantResponse extends BaseEntity {
  name: string
  description: string | null
  domain: string | null
  
  // Configuration
  settings: TenantSettings
  limits: TenantLimits
  features: string[]
  
  // Status
  status: EntityStatus
  is_active: boolean
  
  // Relationships
  admin_user_id: string
  admin_user?: UserResponse
  organizations?: OrganizationResponse[]
  
  // Statistics
  stats?: TenantStats
}

export interface TenantSettings {
  branding: {
    logo_url?: string
    primary_color?: string
    secondary_color?: string
    custom_css?: string
  }
  security: {
    require_2fa: boolean
    password_policy: PasswordPolicy
    session_timeout: number
    max_login_attempts: number
  }
  features: {
    analytics_enabled: boolean
    export_enabled: boolean
    api_access_enabled: boolean
    custom_reports_enabled: boolean
  }
}

export interface TenantLimits {
  max_organizations: number
  max_users_per_organization: number
  max_predictions_per_month: number
  max_storage_gb: number
  max_api_calls_per_day: number
}

export interface TenantStats {
  total_organizations: number
  total_users: number
  active_users: number
  total_predictions: number
  storage_used_gb: number
  api_calls_today: number
}

export interface TenantCreate {
  name: string
  description?: string
  domain?: string
  admin_email: string
  admin_password: string
  admin_full_name: string
  settings?: Partial<TenantSettings>
  limits?: Partial<TenantLimits>
}
```

### Organization Management

```typescript
export interface OrganizationResponse extends BaseEntity {
  name: string
  description: string | null
  sector: string | null
  
  // Hierarchy
  tenant_id: string
  tenant?: TenantResponse
  parent_organization_id: string | null
  parent_organization?: OrganizationResponse
  
  // Settings
  settings: OrganizationSettings
  
  // Status
  status: EntityStatus
  is_active: boolean
  
  // Relationships
  admin_users?: UserResponse[]
  members?: UserResponse[]
  
  // Statistics
  stats?: OrganizationStats
}

export interface OrganizationSettings {
  risk_thresholds: {
    low: number
    medium: number
    high: number
    critical: number
  }
  default_analysis_type: 'annual' | 'quarterly'
  auto_notifications: boolean
  data_retention_days: number
}

export interface OrganizationStats {
  total_users: number
  active_users: number
  total_predictions: number
  high_risk_companies: number
  last_activity: string
}

export interface OrganizationCreate {
  name: string
  description?: string
  sector?: string
  tenant_id: string
  parent_organization_id?: string
  admin_email?: string
  settings?: Partial<OrganizationSettings>
}
```

## Prediction Types (`prediction.ts`)

### Risk Prediction Models

```typescript
export interface Prediction extends BaseEntity {
  // Company Information
  company_name: string
  company_id?: string
  sector?: string
  country?: string
  
  // Prediction Details
  prediction_type: 'annual' | 'quarterly'
  default_probability: number
  risk_category: RiskCategory
  confidence_score: number
  
  // Financial Data (Input)
  financial_data: FinancialData
  
  // Model Information
  model_version: string
  model_name: string
  features_used: string[]
  
  // Risk Factors
  risk_factors: RiskFactor[]
  key_metrics: KeyMetric[]
  
  // Metadata
  source: 'file_upload' | 'manual_input' | 'api_import'
  job_id?: string
  user_id: string
  organization_id: string
  
  // Status
  status: 'active' | 'archived' | 'deleted'
  
  // Relationships
  user?: UserResponse
  organization?: OrganizationResponse
}

export type RiskCategory = 'low' | 'medium' | 'high' | 'critical'

export interface FinancialData {
  // Balance Sheet
  total_assets?: number
  current_assets?: number
  fixed_assets?: number
  total_liabilities?: number
  current_liabilities?: number
  long_term_liabilities?: number
  shareholders_equity?: number
  
  // Income Statement
  revenue?: number
  gross_profit?: number
  operating_income?: number
  net_income?: number
  ebitda?: number
  
  // Cash Flow
  operating_cash_flow?: number
  investing_cash_flow?: number
  financing_cash_flow?: number
  free_cash_flow?: number
  
  // Ratios (Calculated)
  current_ratio?: number
  debt_to_equity_ratio?: number
  return_on_assets?: number
  return_on_equity?: number
  profit_margin?: number
  
  // Additional Data
  employee_count?: number
  market_cap?: number
  years_in_business?: number
  credit_rating?: string
}

export interface RiskFactor {
  factor: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  weight: number
  value: number
}

export interface KeyMetric {
  name: string
  value: number
  unit?: string
  benchmark?: number
  trend: 'improving' | 'declining' | 'stable'
}

export interface CreatePredictionRequest {
  company_name: string
  prediction_type: 'annual' | 'quarterly'
  financial_data: FinancialData
  sector?: string
  country?: string
  organization_id?: string
}

export interface UpdatePredictionRequest {
  company_name?: string
  financial_data?: Partial<FinancialData>
  sector?: string
  country?: string
  notes?: string
}

export interface PredictionFilters {
  risk_category?: RiskCategory | 'all'
  prediction_type?: 'annual' | 'quarterly' | 'all'
  sector?: string
  date_range?: {
    start: string
    end: string
  }
  organization_id?: string
  search?: string
}
```

### Analytics Types

```typescript
export interface AnalyticsSummary {
  total_predictions: number
  risk_distribution: RiskDistribution
  sector_analysis: SectorAnalysis[]
  trend_analysis: TrendData[]
  top_risks: TopRiskCompany[]
  performance_metrics: PerformanceMetrics
}

export interface RiskDistribution {
  low: number
  medium: number
  high: number
  critical: number
}

export interface SectorAnalysis {
  sector: string
  company_count: number
  average_risk: number
  risk_distribution: RiskDistribution
}

export interface TrendData {
  date: string
  total_companies: number
  average_risk: number
  risk_distribution: RiskDistribution
}

export interface TopRiskCompany {
  company_name: string
  risk_probability: number
  risk_category: RiskCategory
  sector: string
  last_updated: string
}

export interface PerformanceMetrics {
  model_accuracy: number
  prediction_confidence: number
  false_positive_rate: number
  false_negative_rate: number
  last_model_update: string
}
```

## File Upload Types (`upload.ts`)

### Upload Management

```typescript
export interface UploadedFile extends BaseEntity {
  filename: string
  original_name: string
  file_type: string
  file_size: number
  file_path: string
  upload_url?: string
  
  // Processing Status
  status: 'uploaded' | 'processing' | 'processed' | 'failed'
  processing_progress: number
  error_message?: string
  
  // Validation Results
  validation_results?: FileValidationResult
  
  // Metadata
  user_id: string
  organization_id: string
  job_id?: string
  
  // Relationships
  user?: UserResponse
  organization?: OrganizationResponse
  job?: BulkUploadJob
}

export interface FileValidationResult {
  is_valid: boolean
  total_rows: number
  valid_rows: number
  invalid_rows: number
  errors: ValidationError[]
  warnings: ValidationWarning[]
  preview_data: any[]
  column_mapping: ColumnMapping[]
}

export interface ValidationError {
  row: number
  column: string
  value: any
  error_type: string
  message: string
}

export interface ValidationWarning {
  row: number
  column: string
  value: any
  warning_type: string
  message: string
}

export interface ColumnMapping {
  source_column: string
  target_field: string
  data_type: string
  required: boolean
  mapped: boolean
}

export interface BulkUploadJob extends BaseEntity {
  // Job Information
  job_name: string
  description?: string
  
  // File Reference
  file_id: string
  file?: UploadedFile
  
  // Processing Configuration
  prediction_type: 'annual' | 'quarterly'
  organization_id: string
  
  // Status Tracking
  status: ProcessingStatus
  progress: number
  current_step?: ProcessingStep
  
  // Results
  total_rows?: number
  processed_rows?: number
  successful_predictions?: number
  failed_predictions?: number
  
  // Error Handling
  error_message?: string
  error_details?: any
  retry_count: number
  
  // Timing
  started_at?: string
  completed_at?: string
  processing_duration?: number
  
  // Relationships
  user_id: string
  user?: UserResponse
  organization?: OrganizationResponse
  predictions?: Prediction[]
}

export interface ProcessingStep {
  step_name: string
  step_description: string
  step_number: number
  total_steps: number
  started_at: string
  completed_at?: string
  status: ProcessingStatus
}

export interface CreateBulkJobRequest {
  file_id: string
  job_name?: string
  prediction_type: 'annual' | 'quarterly'
  organization_id?: string
  configuration?: JobConfiguration
}

export interface JobConfiguration {
  batch_size: number
  parallel_processing: boolean
  validation_strict: boolean
  skip_duplicates: boolean
  update_existing: boolean
}
```

## Form Types

### Form Schemas and Validation

```typescript
// Zod schemas for form validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional()
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

export const createPredictionSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  prediction_type: z.enum(['annual', 'quarterly']),
  financial_data: z.object({
    revenue: z.number().min(0).optional(),
    total_assets: z.number().min(0).optional(),
    total_liabilities: z.number().min(0).optional(),
    // ... other financial fields
  }),
  sector: z.string().optional(),
  country: z.string().optional()
})

// Inferred types from schemas
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type CreatePredictionFormData = z.infer<typeof createPredictionSchema>
```

## UI State Types

### Dashboard State

```typescript
export interface DashboardState {
  // Active states
  activeTab: string
  selectedCompany: Prediction | null
  selectedOrganization: string | null
  
  // View preferences
  tableView: 'compact' | 'comfortable' | 'spacious'
  chartsExpanded: boolean
  sidebarCollapsed: boolean
  
  // Filters
  searchTerm: string
  riskFilter: RiskCategory | 'all'
  sectorFilter: string | 'all'
  dateRangeFilter: DateRange | null
  
  // Data source
  activeDataSource: 'annual' | 'quarterly'
  
  // Loading states
  isLoadingData: boolean
  isRefreshing: boolean
  
  // Error states
  error: string | null
}

export interface DateRange {
  start: Date
  end: Date
}

export interface FilterOptions {
  search?: string
  risk_level?: RiskCategory | 'all'
  sector?: string | 'all'
  date_range?: DateRange
  organization?: string | 'all'
  status?: EntityStatus | 'all'
}
```

## Type Guards and Utilities

### Type Guards

```typescript
export function isUserResponse(obj: any): obj is UserResponse {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string'
}

export function isPrediction(obj: any): obj is Prediction {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.company_name === 'string' &&
    typeof obj.default_probability === 'number'
}

export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return obj && typeof obj.success === 'boolean'
}

export function hasRequiredRole(user: UserResponse | null, requiredRole: UserRole): boolean {
  if (!user) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    user: 0,
    org_member: 1,
    org_admin: 2,
    tenant_admin: 3,
    super_admin: 4
  }
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}
```

### Type Utilities

```typescript
export function getRiskLevel(probability: number): RiskCategory {
  if (probability <= RISK_THRESHOLDS.LOW) return 'low'
  if (probability <= RISK_THRESHOLDS.MEDIUM) return 'medium'
  if (probability <= RISK_THRESHOLDS.HIGH) return 'high'
  return 'critical'
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function createEmptyPrediction(): Partial<Prediction> {
  return {
    company_name: '',
    prediction_type: 'annual',
    financial_data: {},
    source: 'manual_input'
  }
}
```
