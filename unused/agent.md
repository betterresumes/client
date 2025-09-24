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

## 🚀 **Frontend Technology Stack**

### **Core Technologies:**
- **Next.js 14** (App Router) - Latest stable version
- **TypeScript 5.5** - For type safety
- **Tailwind CSS + shadcn/ui** - For consistent UI
- **Zustand + TanStack Query** - State management combo
- **Recharts** - For analytics charts
- **Direct FastAPI Integration** - Using TanStack Query polling for real-time updates

## 🔌 **API Integration Strategy**

### **Direct FastAPI Integration** ✅
- Frontend makes direct HTTP calls to FastAPI backend at `http://localhost:8000`
- JWT tokens sent in Authorization headers
- TanStack Query handles caching, loading states, and background refetching
- Polling every 2 seconds for job progress updates

### **File Upload Endpoint**
- Bulk CSV/Excel uploads: `/api/v1/bulk/*` or `/api/v1/predictions/bulk`
- Uses react-dropzone for drag-and-drop functionality

**This approach gives you maximum performance with your existing sophisticated FastAPI backend!**
