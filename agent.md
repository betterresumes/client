# 🤖 Agent Understanding & Analysis

## 🏗️ Backend System Architecture Analysis

### Core System Overview
The Financial Default Risk Prediction System is a sophisticated **multi-tenant SaaS platform** designed for enterprise-level financial risk assessment using advanced machine learning algorithms.

### 🔑 Key Technical Components

#### 1. **Multi-Tenant Architecture**
- **Hierarchical Structure**: Tenants → Organizations → Users
- **Complete Data Isolation**: Each tenant operates independently
- **5-Tier Role System**: super_admin → tenant_admin → org_admin → org_member → user
- **Global Data Sharing**: Configurable cross-organization access

#### 2. **Technology Stack**
- **Backend**: FastAPI (Python 3.13) with async/await
- **Database**: PostgreSQL 15 with SQLAlchemy 2.0
- **Caching**: Redis 7 for sessions and ML model caching
- **Background Jobs**: Celery with Redis broker
- **Security**: JWT with RS256, bcrypt, RBAC
- **ML Pipeline**: Ensemble models (Random Forest + Gradient Boosting + Logistic Regression)

#### 3. **Authentication & Authorization**
```
┌─────────────────────────────────────────────────────────────────────┐
│                     ROLE HIERARCHY PYRAMID                         │
│                                                                     │
│                         👑 SUPER ADMIN                              │
│                      (System Owner - Level 4)                      │
│                    ┌─────────────────────────┐                     │
│                    │   🏢 TENANT ADMIN       │                     │
│                    │  (Multi-Org - Level 3)  │                     │
│                ┌───┴──────────────────────────┴───┐                 │
│                │      🏛️ ORG ADMIN              │                 │
│                │   (Single Org - Level 2)       │                 │
│            ┌───┴─────────────────────────────────┴───┐             │
│            │         👥 ORG MEMBER                   │             │
│            │      (Team Access - Level 1)           │             │
│        ┌───┴─────────────────────────────────────────┴───┐         │
│        │               👤 USER                           │         │
│        │         (Individual - Level 0)                 │         │
│        └─────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4. **Database Schema**
```
TENANTS (1:N) → ORGANIZATIONS (1:N) → USERS
    ↓                ↓                   ↓
COMPANIES        PREDICTIONS      USER_SESSIONS
    ↓                ↓
FINANCIAL_DATA   BULK_JOBS
```

#### 5. **ML Prediction Models**
- **Annual Model**: 5 financial ratios for long-term risk
- **Quarterly Model**: 4 financial ratios for short-term risk
- **Risk Categories**: Low (0-3%), Medium (3-7%), High (7%+)
- **Performance**: 94.2% accuracy, 0.89 AUC score

### 🎯 Core Features Analysis

#### 1. **Prediction Capabilities**
- Real-time individual company analysis
- Bulk processing (CSV/Excel upload)
- Background job processing with progress tracking
- Historical prediction tracking

#### 2. **User Management**
- Email-based invitations with join tokens
- Whitelist security for organizations
- Role-based access control
- Multi-organization membership

#### 3. **Data Management**
- Organization-scoped data isolation
- Optional global data sharing
- S&P 500 pre-loaded dataset
- Custom company creation

#### 4. **Enterprise Features**
- Multi-tenant data isolation
- Organization join tokens
- Audit logging
- Performance monitoring

### 📊 API Structure Analysis

#### Core API Endpoints (62+ total):
1. **Authentication**: `/api/v1/auth/*` (login, register, refresh, join)
2. **User Management**: `/api/v1/users/*` (profile, management)
3. **Tenant Management**: `/api/v1/tenants/*` (super admin only)
4. **Organization Management**: `/api/v1/organizations/*`
5. **Company Management**: `/api/v1/companies/*`
6. **Predictions**: `/api/v1/predictions/*`
7. **Bulk Operations**: `/api/v1/bulk/*`
8. **Jobs**: `/api/v1/jobs/*`

### 🔐 Security Features
- JWT with RS256 asymmetric encryption
- Multi-factor authentication support
- Role-based permissions matrix
- Data encryption at rest
- Audit logging for compliance

### ⚡ Performance Characteristics
- **API Response Times**: p50: 45-156ms, p95: 120-380ms
- **Throughput**: 2500 RPS peak, 450K predictions/hour
- **Caching**: Multi-layer Redis caching
- **Background Processing**: Celery for bulk operations

## 🎨 Frontend Dashboard UI Analysis

Based on the provided dashboard screenshots, I can see:

### 📱 Current UI Components
1. **Header Navigation**: Clean navigation with user profile, auth status
2. **Sidebar Menu**: Dashboard, Analytics, Company Details, Custom Analysis, Risk Insights
3. **Dashboard Cards**: Metrics overview (S&P 500 companies, average rate, high risk count)
4. **Company Selection**: Dropdown with risk scores and categories
5. **Prediction Results**: Risk assessment with confidence scores
6. **Financial Ratios Display**: Clean ratio visualization
7. **ML Model Insights**: Model confidence and primary risk factors
8. **Custom Analysis Forms**: Both individual and bulk analysis
9. **File Upload**: Drag-and-drop for Excel/CSV files
10. **Job Processing**: Real-time job status and progress tracking

### 🎨 UI Design Patterns
- **Clean, modern design** with good spacing
- **Card-based layout** for different sections
- **Color-coded risk levels** (green=low, yellow=medium, red=high)
- **Progress indicators** for async operations
- **Responsive design** elements
- **Professional color scheme** (blues, grays, accent colors)

## ✅ **Clarified Requirements**

### 1. **User Experience Flows** ✅
- **Same dashboard UI for all roles** - only data access differs based on role permissions
- Role-based data filtering handled by backend API responses

### 2. **Data Visualization Requirements** ✅  
- **Analytics dashboard with charts** (sector analysis, risk distribution, market cap vs default rate)
- **Advanced data visualization** for sector comparisons and trends
- **Chart types needed**: Bar charts, Pie charts, Scatter plots, Distribution histograms

### 3. **Real-time Features** ✅
- **Live progress updates** for bulk job processing (no notifications needed)
- **Real-time job status tracking** in the UI

### 4. **Multi-tenant Access Control** ✅
```
🔐 DATA ACCESS HIERARCHY:
├── 👑 Super Admin → Everything (all tenants, orgs, users)
├── 🏢 Tenant Admin → Everything within their tenant (multiple orgs)
├── 🏛️ Org Admin → Only their organization data
├── 👥 Org Member → Only their organization data  
└── 👤 User (no org) → Global data + personal predictions only
```

### 5. **Platform Priorities** ✅
- **Desktop-first approach** (mobile responsive nice-to-have, not priority)

### 6. **Integration & Export** ✅
- **Not needed currently** (PDF reports, Excel exports, third-party integrations)

## 🎨 **Enhanced UI Analysis** 

### **Analytics Dashboard Features** (from new screenshot):
- **Sector-wise default rate analysis** with interactive bar charts
- **Risk category distribution** with donut/pie charts  
- **Default rate distribution histogram**
- **Market cap vs default rate scatter plot**
- **Tabbed navigation** (S&P 500 Dashboard, Analytics, Company Details, etc.)
- **Hover tooltips** and interactive chart elements
- **Color-coded risk categories** consistently throughout

## 🚀 **Frontend Technology Planning**

### 🎯 **Recommended Technology Stack**

#### **Core Framework: Next.js 14 (App Router)**
```
✅ Why Next.js 14?
• Server-side rendering for better SEO and performance
• Built-in API routes for backend integration
• App Router for better file-based routing
• Excellent TypeScript support
• Built-in optimization (images, fonts, etc.)
• Great developer experience
• Enterprise-ready with good performance
```

#### **Language: TypeScript**
```
✅ Why TypeScript?
• Type safety for complex data structures (ML predictions, financial data)
• Better IDE support and code completion
• Easier refactoring for large codebase
• Excellent integration with Next.js
• Better collaboration in team development
```

#### **State Management: Zustand + TanStack Query**
```
✅ Zustand for Client State:
• Lightweight and simple
• Great TypeScript support
• No boilerplate like Redux
• Perfect for user auth, UI state

✅ TanStack Query for Server State:
• Powerful data fetching and caching
• Background refetching
• Optimistic updates
• Perfect for API integration
• Built-in loading/error states
```

#### **UI Framework: Tailwind CSS + shadcn/ui**
```
✅ Tailwind CSS:
• Utility-first for rapid development
• Consistent design system
• Small bundle size
• Easy responsive design

✅ shadcn/ui:
• Beautiful, accessible components
• Built on Radix UI primitives
• Copy-paste components (no library dependency)
• Excellent TypeScript support
• Matches your current design aesthetic
```

#### **Charts & Data Visualization: Recharts**
```
✅ Why Recharts?
• React-native charts library
• Perfect for financial data visualization
• Bar charts, pie charts, scatter plots support
• Good TypeScript support
• Responsive charts
• Matches your analytics dashboard needs
```

#### **Form Handling: React Hook Form + Zod**
```
✅ React Hook Form:
• Excellent performance (minimal re-renders)
• Great validation support
• Perfect for financial data forms

✅ Zod:
• TypeScript-first schema validation
• Runtime type checking
• Seamless integration with React Hook Form
```

#### **File Uploads: react-dropzone**
```
✅ For bulk CSV/Excel uploads:
• Drag and drop functionality
• File type validation
• Progress tracking support
• Great user experience
```

#### **Background Job Polling: TanStack Query**
```
✅ For job progress tracking:
• Polling-based job status updates using existing APIs
• Built-in refetch intervals in TanStack Query
• Background refetching for real-time feel
• Uses existing /api/v1/jobs/* endpoints
```

### 📁 **Complete File Structure**

```
default-rate-frontend/
├── 📁 app/                          # Next.js 14 App Router
│   ├── 📁 (auth)/                   # Auth route group
│   │   ├── 📁 login/
│   │   │   └── page.tsx
│   │   ├── 📁 register/
│   │   │   └── page.tsx
│   │   └── 📁 join/
│   │       └── page.tsx
│   │
│   ├── 📁 (dashboard)/              # Main dashboard routes
│   │   ├── 📁 dashboard/            # S&P 500 Dashboard
│   │   │   └── page.tsx
│   │   ├── 📁 analytics/            # Analytics with charts
│   │   │   └── page.tsx
│   │   ├── 📁 companies/            # Company Details
│   │   │   ├── page.tsx
│   │   │   └── 📁 [id]/
│   │   │       └── page.tsx
│   │   ├── 📁 analysis/             # Custom Analysis
│   │   │   ├── 📁 individual/
│   │   │   │   └── page.tsx
│   │   │   └── 📁 bulk/
│   │   │       └── page.tsx
│   │   ├── 📁 insights/             # Risk Insights
│   │   │   └── page.tsx
│   │   └── 📁 jobs/                 # Job Status Tracking
│   │       ├── page.tsx
│   │       └── 📁 [id]/
│   │           └── page.tsx
│   │
│   ├── 📁 (admin)/                  # Admin-only routes
│   │   ├── 📁 tenants/              # Tenant Management (Super Admin)
│   │   │   └── page.tsx
│   │   ├── 📁 organizations/        # Org Management (Tenant Admin)
│   │   │   └── page.tsx
│   │   └── 📁 users/                # User Management
│   │       └── page.tsx
│   │
│   ├── 📁 api/                      # Next.js API routes (proxy to FastAPI)
│   │   └── 📁 auth/
│   │       └── [...nextauth].ts
│   │
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Landing page
│   ├── loading.tsx                  # Global loading UI
│   ├── error.tsx                    # Global error UI
│   └── not-found.tsx               # 404 page
│
├── 📁 components/                   # Reusable UI components
│   ├── 📁 ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── tabs.tsx
│   │
│   ├── 📁 layout/                  # Layout components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── navigation.tsx
│   │   └── user-menu.tsx
│   │
│   ├── 📁 charts/                  # Chart components
│   │   ├── bar-chart.tsx
│   │   ├── pie-chart.tsx
│   │   ├── scatter-plot.tsx
│   │   └── risk-distribution.tsx
│   │
│   ├── 📁 dashboard/               # Dashboard-specific components
│   │   ├── metric-card.tsx
│   │   ├── company-selector.tsx
│   │   ├── prediction-result.tsx
│   │   ├── financial-ratios.tsx
│   │   └── ml-insights.tsx
│   │
│   ├── 📁 analysis/                # Analysis components
│   │   ├── individual-form.tsx
│   │   ├── bulk-upload.tsx
│   │   ├── job-progress.tsx
│   │   └── results-table.tsx
│   │
│   ├── 📁 auth/                    # Authentication components
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   ├── join-form.tsx
│   │   └── role-guard.tsx
│   │
│   └── 📁 admin/                   # Admin components
│       ├── tenant-management.tsx
│       ├── org-management.tsx
│       └── user-management.tsx
│
├── 📁 lib/                         # Utility libraries
│   ├── 📁 api/                     # API integration
│   │   ├── client.ts               # Axios/fetch client setup
│   │   ├── auth.ts                 # Auth API calls
│   │   ├── companies.ts            # Company API calls
│   │   ├── predictions.ts          # Prediction API calls
│   │   ├── jobs.ts                 # Job API calls
│   │   └── admin.ts                # Admin API calls
│   │
│   ├── 📁 stores/                  # Zustand stores
│   │   ├── auth-store.ts           # Authentication state
│   │   ├── user-store.ts           # User profile and permissions
│   │   ├── ui-store.ts             # UI state (sidebar, modals)
│   │   └── job-store.ts            # Real-time job tracking
│   │
│   ├── 📁 hooks/                   # Custom React hooks
│   │   ├── use-auth.ts             # Authentication hook
│   │   ├── use-permissions.ts      # Role-based permissions
│   │   ├── use-websocket.ts        # Real-time updates
│   │   └── use-api.ts              # TanStack Query hooks
│   │
│   ├── 📁 types/                   # TypeScript type definitions
│   │   ├── auth.ts                 # Auth types
│   │   ├── user.ts                 # User and role types
│   │   ├── company.ts              # Company data types
│   │   ├── prediction.ts           # ML prediction types
│   │   ├── job.ts                  # Job processing types
│   │   └── api.ts                  # API response types
│   │
│   ├── 📁 utils/                   # Utility functions
│   │   ├── cn.ts                   # Class name utility
│   │   ├── format.ts               # Number/date formatting
│   │   ├── validation.ts           # Form validation schemas
│   │   ├── permissions.ts          # Permission checking utils
│   │   └── constants.ts            # App constants
│   │
│   └── 📁 config/                  # Configuration
│       ├── env.ts                  # Environment variables
│       ├── api.ts                  # API endpoints config
│       └── charts.ts               # Chart configuration
│
├── 📁 styles/                      # Styling
│   ├── globals.css                 # Global styles + Tailwind
│   └── components.css              # Component-specific styles
│
├── 📁 public/                      # Static assets
│   ├── icons/
│   ├── images/
│   └── favicon.ico
│
├── 📁 docs/                        # Documentation
│   ├── SETUP.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── .env.local                      # Environment variables
├── .env.example                    # Environment template
├── next.config.js                  # Next.js configuration
├── tailwind.config.js              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies
└── README.md                       # Project documentation
```

### 🔄 **State Management Architecture**

#### **Auth Store (Zustand)**
```typescript
interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}
```

#### **User Store (Zustand)**  
```typescript
interface UserStore {
  profile: UserProfile | null
  permissions: Permission[]
  currentRole: UserRole
  organizations: Organization[]
  currentOrg: Organization | null
  switchOrganization: (orgId: string) => void
}
```

#### **Server State (TanStack Query)**
```typescript
// Company data queries
useCompanies()
useCompany(id)
usePredictions()
useBulkJobs()

// Real-time job updates
useJobStatus(jobId)
useJobProgress(jobId)
```

### 🎨 **Component Architecture Strategy**

#### **1. Layout Components**
- **Responsive sidebar** with role-based navigation
- **Header** with user menu and organization switcher
- **Breadcrumb navigation** for deep pages

#### **2. Dashboard Components**
- **Metric cards** with loading states
- **Interactive charts** with hover tooltips
- **Company selector** with search and filtering
- **Prediction results** with confidence indicators

#### **3. Analysis Components**
- **Form components** with validation
- **File upload** with drag-drop and progress
- **Results table** with sorting and pagination
- **Real-time job tracking** with progress bars

#### **4. Role-based Component Guards**
```typescript
<RoleGuard allowedRoles={['super_admin', 'tenant_admin']}>
  <TenantManagement />
</RoleGuard>
```

## 🔌 **API Integration Strategy - Detailed Explanation**

### **Two Possible Approaches:**

#### **Approach 1: Direct FastAPI Integration (RECOMMENDED) ✅**
```
Frontend (Next.js) ──────→ FastAPI Backend
                 HTTP/HTTPS   (Port 8000)
```

**How it works:**
- Frontend makes **direct HTTP calls** to your FastAPI backend at `http://localhost:8000`
- Use **axios** or **fetch** with proper CORS configuration
- **JWT tokens** sent in Authorization headers
- **TanStack Query** handles caching, loading states, and background refetching

**Pros:**
- **Simpler architecture** - no extra layer
- **Better performance** - no double network calls
- **Easier debugging** - direct connection
- **Full control** over API responses
- **Real-time capabilities** through polling

**File Structure for Direct Integration:**
```
lib/
├── api/
│   ├── client.ts           # Axios client with auth interceptors
│   ├── endpoints.ts        # All API endpoint constants
│   ├── auth.ts             # Auth-related API calls
│   ├── companies.ts        # Company management APIs
│   ├── predictions.ts      # ML prediction APIs
│   ├── jobs.ts             # Background job APIs
│   ├── admin.ts            # Admin panel APIs
│   └── types.ts            # API response/request types
```

#### **Approach 2: Next.js API Routes as Proxy**
```
Frontend ──→ Next.js API Routes ──→ FastAPI Backend
           (Port 3000)              (Port 8000)
```

**How it works:**
- Frontend calls Next.js API routes at `/api/*`
- Next.js API routes proxy requests to FastAPI backend
- Additional server-side logic if needed

**Pros:**
- **Hide backend URLs** from frontend
- **Additional security layer**
- **Server-side data transformation**
- **API rate limiting** on Next.js side

**Cons:**
- **Double network calls** (slower)
- **More complex architecture**
- **Additional maintenance** burden

### 🎯 **RECOMMENDED: Direct FastAPI Integration**

Since your FastAPI backend is already **enterprise-ready** with proper:
- **CORS configuration**
- **JWT authentication**
- **Rate limiting**
- **Input validation**
- **Error handling**

**Direct integration is the best approach!**

### **Implementation Details:**

#### **1. API Client Setup (`lib/api/client.ts`)**
```typescript
import axios from 'axios'
import { useAuthStore } from '@/lib/stores/auth-store'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // http://localhost:8000
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for JWT tokens
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

#### **2. API Endpoints Configuration (`lib/api/endpoints.ts`)**
```typescript
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
    JOIN: '/api/v1/auth/join',
  },
  
  // Users
  USERS: {
    PROFILE: '/api/v1/users/profile',
    LIST: '/api/v1/users',
    UPDATE: '/api/v1/users/profile',
  },
  
  // Companies
  COMPANIES: {
    LIST: '/api/v1/companies',
    CREATE: '/api/v1/companies',
    GET: (id: string) => `/api/v1/companies/${id}`,
    UPDATE: (id: string) => `/api/v1/companies/${id}`,
    DELETE: (id: string) => `/api/v1/companies/${id}`,
  },
  
  // Predictions
  PREDICTIONS: {
    ANNUAL: '/api/v1/predictions/annual',
    QUARTERLY: '/api/v1/predictions/quarterly',
    HISTORY: '/api/v1/predictions/history',
    BULK: '/api/v1/predictions/bulk',
  },
  
  // Background Jobs
  JOBS: {
    LIST: '/api/v1/jobs',
    STATUS: (id: string) => `/api/v1/jobs/${id}`,
    RESULTS: (id: string) => `/api/v1/jobs/${id}/results`,
  },
  
  // Admin (Role-based)
  ADMIN: {
    TENANTS: '/api/v1/tenants',
    ORGANIZATIONS: '/api/v1/organizations',
    USERS: '/api/v1/admin/users',
  },
} as const
```

#### **3. TanStack Query Integration (`lib/hooks/use-api.ts`)**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

// Companies
export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => apiClient.get(API_ENDPOINTS.COMPANIES.LIST),
  })
}

// Real-time job progress (polling)
export const useJobProgress = (jobId: string) => {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => apiClient.get(API_ENDPOINTS.JOBS.STATUS(jobId)),
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: !!jobId,
  })
}

// Predictions
export const usePredictionMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: PredictionRequest) =>
      apiClient.post(API_ENDPOINTS.PREDICTIONS.ANNUAL, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] })
    },
  })
}
```

#### **4. Latest Stable Versions (September 2025)**
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.5.0",
    "@tanstack/react-query": "^5.50.0",
    "zustand": "^4.5.0",
    "axios": "^1.7.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    "recharts": "^2.12.0",
    "react-dropzone": "^14.2.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-dialog": "^1.1.0"
  }
}
```

### **Organized File System Structure:**

#### **Types Organization (`lib/types/`)**
```
lib/types/
├── index.ts              # Re-export all types
├── auth.ts               # Authentication & JWT types
├── user.ts               # User profile & role types
├── company.ts            # Company data structures
├── prediction.ts         # ML prediction types
├── job.ts                # Background job types
├── api.ts                # API request/response types
├── admin.ts              # Admin panel types
└── common.ts             # Shared/common types
```

#### **Utils Organization (`lib/utils/`)**
```
lib/utils/
├── index.ts              # Re-export utilities
├── cn.ts                 # Class name utility (clsx)
├── format.ts             # Date/number formatting
├── validation.ts         # Zod schemas
├── permissions.ts        # Role checking utilities
├── constants.ts          # App-wide constants
├── api-helpers.ts        # API utility functions
└── chart-helpers.ts      # Chart data transformation
```

#### **Stores Organization (`lib/stores/`)**
```
lib/stores/
├── index.ts              # Re-export all stores
├── auth-store.ts         # Authentication state
├── user-store.ts         # User profile & org switching
├── ui-store.ts           # UI state (sidebar, modals)
├── company-store.ts      # Company selection state
└── job-store.ts          # Job tracking state
```

### **Benefits of Direct FastAPI Integration:**

1. **Performance**: Single network call, no proxy overhead
2. **Simplicity**: Straightforward data flow
3. **Real-time**: TanStack Query polling for job updates
4. **Type Safety**: Full TypeScript support end-to-end
5. **Caching**: Intelligent caching with TanStack Query
6. **Error Handling**: Centralized error management
7. **Scalability**: Direct connection scales better

**This approach gives you the best performance and maintainability for your enterprise application!**

### 🤔 **Questions for You:**

1. **API URL**: Will your FastAPI backend run on `http://localhost:8000` for development?
2. **CORS**: Is CORS already configured in your FastAPI backend for frontend domain?
3. **Error Handling**: Any specific error response format from your backend?
4. **File Uploads**: Which endpoint handles bulk CSV/Excel uploads?

**Ready to proceed with Direct FastAPI Integration approach?**
