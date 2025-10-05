# Authentication & Authorization

## Authentication System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 👤 User Login ──┐                                          │
│                │                                           │
│                ▼                                           │
│       ┌──────────────┐     ┌──────────────┐               │
│       │ 📝 Credentials│────▶│ 🔐 Validate  │               │
│       │ • Email       │     │ • Password   │               │
│       │ • Password    │     │ • 2FA (opt)  │               │
│       └──────────────┘     └──────────────┘               │
│                                     │                      │
│                             Success │                      │
│                                     ▼                      │
│       ┌──────────────┐     ┌──────────────┐               │
│       │ 🎯 Dashboard │◀────│ 🔑 JWT Tokens│               │
│       │ • Welcome     │     │ • Access (1h)│               │
│       │ • Load Data   │     │ • Refresh    │               │
│       └──────────────┘     │   (30d)      │               │
│                            └──────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Token Lifecycle Management

```
┌─────────────────────────────────────────────────────────────┐
│                     TOKEN MANAGEMENT                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Request with Token ──┐                                      │
│                     │                                      │
│                     ▼                                      │
│            ┌──────────────┐      ┌──────────────┐          │
│            │ Check Expiry │─Yes──▶│ 🚀 Continue  │          │
│            │ Valid Token? │      │ API Request  │          │
│            └──────────────┘      └──────────────┘          │
│                     │                                      │
│                     │ Expired                              │
│                     ▼                                      │
│            ┌──────────────┐      ┌──────────────┐          │
│            │ 🔄 Refresh   │─Yes──▶│ ✅ Update    │          │
│            │ Token Call   │      │ Store & Retry│          │
│            └──────────────┘      └──────────────┘          │
│                     │                                      │
│                     │ Failed                               │
│                     ▼                                      │
│            ┌──────────────┐                                │
│            │ 🚪 Logout    │                                │
│            │ Redirect     │                                │
│            └──────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

## Role-Based Access Control

```
┌─────────────────────────────────────────────────────────────┐
│                 PERMISSION HIERARCHY                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    👑 Super Admin                          │
│                    ┌─────────────┐                         │
│                    │• All Access │                         │
│                    │• Platform   │                         │
│                    │  Management │                         │
│                    └─────────────┘                         │
│                           │                                │
│                           ▼                                │
│              🏢 Tenant Admin    🏛️ Organization Admin      │
│              ┌─────────────┐    ┌─────────────┐            │
│              │• Tenant     │    │• Org Users  │            │
│              │  Management │    │• Org Data   │            │
│              │• User Admin │    │• Settings   │            │
│              └─────────────┘    └─────────────┘            │
│                     │                   │                  │
│                     └─────┬─────────────┘                  │
│                           ▼                                │
│                    👤 Regular User                         │
│                    ┌─────────────┐                         │
│                    │• Dashboard  │                         │
│                    │• Own Data   │                         │
│                    │• Analysis   │                         │
│                    └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## Auth Store Implementation

### State Structure

```typescript
interface AuthState {
  // Authentication state
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  user: UserResponse | null
  tokenExpiresAt: number | null
  isRefreshing: boolean
  isLoadingProfile: boolean
  profileCacheTime: number | null

  // Actions
  setAuth: (accessToken: string, refreshToken: string, user: UserResponse, expiresIn?: number) => void
  clearAuth: () => void
  updateUser: (user: Partial<UserResponse>) => void
  refreshAccessToken: () => Promise<boolean>
  refreshUserProfile: () => Promise<UserResponse | null>

  // Authorization helpers
  isAdmin: () => boolean
  isTenantAdmin: () => boolean
  isOrgAdmin: () => boolean
  canManageUsers: () => boolean
  canManageOrganizations: () => boolean
}
```

### Key Methods

#### setAuth()
Sets authentication state and configures API client:

```typescript
setAuth: (accessToken, refreshToken, user, expiresIn = 3600) => {
  apiClient.setAuthToken(accessToken, refreshToken)
  
  const expiresAt = Date.now() + (expiresIn * 1000)
  
  set({
    isAuthenticated: true,
    accessToken,
    refreshToken,
    user,
    tokenExpiresAt: expiresAt,
    profileCacheTime: Date.now(),
  })
}
```

#### refreshAccessToken()
Handles automatic token refresh with concurrency protection:

```typescript
refreshAccessToken: async () => {
  // Prevent multiple concurrent refresh attempts
  if (state.isRefreshing) {
    return new Promise((resolve) => {
      const checkRefresh = () => {
        const currentState = get()
        if (!currentState.isRefreshing) {
          resolve(currentState.isAuthenticated)
        } else {
          setTimeout(checkRefresh, 100)
        }
      }
      checkRefresh()
    })
  }

  // Perform token refresh
  set({ isRefreshing: true })
  // ... refresh logic
}
```

## User Roles & Permissions

### Role Hierarchy

```
Super Admin (Highest Level)
├── Platform-wide access
├── Tenant management
├── System configuration
└── Global user management

Tenant Admin
├── Tenant-specific access
├── Organization management within tenant
├── Tenant user management
└── Tenant analytics

Organization Admin  
├── Organization-specific access
├── Organization user management
├── Organization settings
└── Organization data access

Organization Member (Basic Level)
├── Organization data access
├── Risk analysis tools
├── Report generation
└── Data upload capabilities
```

### Permission Matrix

| Action | Super Admin | Tenant Admin | Org Admin | Org Member |
|--------|-------------|--------------|-----------|------------|
| Create Tenants | ✅ | ❌ | ❌ | ❌ |
| Manage Tenants | ✅ | ✅ (Own) | ❌ | ❌ |
| Create Organizations | ✅ | ✅ | ❌ | ❌ |
| Manage Organizations | ✅ | ✅ (Own Tenant) | ✅ (Own) | ❌ |
| Invite Users | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ✅ (Tenant) | ✅ (Org) | ❌ |
| Access Analytics | ✅ | ✅ | ✅ | ✅ |
| Upload Data | ✅ | ✅ | ✅ | ✅ |
| Generate Reports | ✅ | ✅ | ✅ | ✅ |

## Authorization Implementation

### Role-Based Helper Methods

```typescript
// Check if user has admin privileges
isAdmin: () => {
  const user = get().user
  return user?.role === 'super_admin'
}

// Check if user can manage organizations
canManageOrganizations: () => {
  const user = get().user
  return ['super_admin', 'tenant_admin'].includes(user?.role || '')
}

// Check if user can manage users
canManageUsers: () => {
  const user = get().user
  return ['super_admin', 'tenant_admin', 'org_admin'].includes(user?.role || '')
}
```

### Route Protection

#### AuthGuard Component

```typescript
export function AuthGuard({ 
  children, 
  requiredRole,
  requireAuth = true 
}: AuthGuardProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (requiredRole && !hasRequiredRole(user, requiredRole)) {
    return <UnauthorizedAccess />
  }

  return <>{children}</>
}
```

#### Usage in Layouts

```typescript
// Dashboard layout with auth protection
export default function DashboardLayout({ children }) {
  return (
    <AuthGuard requireAuth={true}>
      <DashboardProvider>
        <div className="min-h-screen bg-background">
          <DashboardHeader />
          <main>{children}</main>
        </div>
      </DashboardProvider>
    </AuthGuard>
  )
}
```

### Component-Level Authorization

#### Conditional Rendering

```typescript
export function UserManagement() {
  const { canManageUsers, isAdmin } = useAuthStore()

  return (
    <div>
      {canManageUsers() && (
        <Button onClick={createUser}>
          Create User
        </Button>
      )}
      
      {isAdmin() && (
        <AdminSettings />
      )}
    </div>
  )
}
```

## Login Form Implementation

### Form Structure

```typescript
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

export function LoginForm() {
  const { setAuth, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })

  // Handle form submission
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
        // Redirect handled by auth guard
      }
    } catch (error) {
      toast.error('Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }
}
```

## Registration System

### User Registration Flow

1. User fills registration form
2. Form validation with Zod schema
3. API call to create user account  
4. Email verification (if enabled)
5. Automatic login or redirect to login

### Organization Joining

```typescript
// Users can join organizations via invite links
export function JoinOrganization() {
  const inviteCode = useParams().code
  
  const handleJoinOrganization = async () => {
    const response = await adminApi.joinOrganizationByInvite(inviteCode)
    if (response.success) {
      toast.success('Successfully joined organization!')
      router.push('/dashboard')
    }
  }
}
```

## Token Refresh Strategy

### Automatic Refresh

```typescript
// API client automatically handles token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshSuccessful = await useAuthStore.getState().refreshAccessToken()
      if (refreshSuccessful) {
        // Retry original request
        return apiClient(error.config)
      } else {
        // Redirect to login
        useAuthStore.getState().clearAuth()
      }
    }
    return Promise.reject(error)
  }
)
```

### Manual Refresh Hook

```typescript
export function useTokenRefresh() {
  const { refreshAccessToken, isTokenExpired } = useAuthStore()
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTokenExpired()) {
        refreshAccessToken()
      }
    }, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [])
}
```