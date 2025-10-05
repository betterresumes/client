# Application Overview

## Core Value Proposition

```
Data Input ──┐
            │
            ▼
┌─────────────────────┐    ┌──────────────┐    ┌─────────────┐
│ 📊 Company Data     │───▶│ 🤖 ML M.      │───▶│ ⚠️ Risk     │
│ • Financial Metrics │    │ Processing   │    │ Assessment  │
│ • Industry Data     │    │ • Algorithms │    │ • Probability│
│ • Market Indicators │    │ • Models     │    │ • Categories│
└─────────────────────┘    └──────────────┘    └─────────────┘
                                   │                    │
                                   ▼                    ▼
                          ┌──────────────┐    ┌─────────────┐
                          │ 📈 Insights  │    │ 📋 Actionable│
                          │ • Trends     │    │ Reports     │
                          │ • Patterns   │    │ • Decisions │
                          │ • Forecasts  │    │ • Export    │
                          └──────────────┘    └─────────────┘
```

## Platform Capabilities

```
┌─────────────────────────────────────────────────────────────┐
│                    CORE PLATFORM FEATURES                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🤖 AI Risk Engine       📊 Analytics          👥 Multi-Tenant│
│ ┌─────────────────┐    ┌─────────────────┐   ┌──────────┐   │
│ │ • ML Models     │    │ • Dashboards    │   │ • Orgs   │   │
│ │ • Predictions   │    │ • Charts/Graphs │   │ • Tenants│   │
│ │ • Risk Scoring  │    │ • Trends        │   │ • Users  │   │
│ │ • Categories    │    │ • KPIs          │   │ • RBAC   │   │
│ └─────────────────┘    └─────────────────┘   └──────────┘   │
│                                                             │
│ 📤 Batch Processing     📋 Data Management    🔒 Security    │
│ ┌─────────────────┐    ┌─────────────────┐   ┌──────────┐   │
│ │ • CSV/Excel     │    │ • Validation    │   │ • JWT    │   │
│ │ • Queue System  │    │ • Cleaning      │   │ • Auth   │   │
│ │ • Progress      │    │ • Export        │   │ • Perms  │   │
│ │ • Job Status    │    │ • Import        │   │ • Audit  │   │
│ └─────────────────┘    └─────────────────┘   └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## User Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                   ROLE-BASED ACCESS CONTROL                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        👑 Super Admin                       │
│                        ┌─────────────┐                      │
│                        │ • Platform  │                      │
│                        │   Control   │                      │
│                        │ • All Data  │                      │
│                        └─────────────┘                      │
│                              │                              │
│                              ▼                              │
│        🏢 Tenant Admin ─────────────── 🏛️ Organization Admin│
│        ┌─────────────┐                 ┌─────────────┐      │
│        │ • Tenant    │                 │ • Org Users │      │
│        │   Users     │                 │ • Org Data  │      │
│        │ • Settings  │                 │ • Reports   │      │
│        └─────────────┘                 └─────────────┘      │
│              │                                │              │
│              └────────────┬───────────────────┘              │
│                          │                                  │
│                          ▼                                  │
│                   👤 Regular User                           │
│                   ┌─────────────┐                          │
│                   │ • Dashboard │                          │
│                   │ • Analysis  │                          │
│                   │ • Own Data  │                          │
│                   └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY FOUNDATION                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🚀 Frontend             🔧 Development        📱 UI/UX      │
│ ┌─────────────────┐    ┌─────────────────┐   ┌──────────┐  │
│ │ • Next.js 15    │    │ • TypeScript    │   │ • Radix  │  │
│ │ • React 19      │    │ • ESLint        │   │ • Tailwind│ │
│ │ • App Router    │    │ • Prettier      │   │ • Lucide │  │
│ └─────────────────┘    └─────────────────┘   └──────────┘  │
│                                                             │
│ 🗄️ State Management    🌐 API Integration   🔒 Security     │
│ ┌─────────────────┐    ┌─────────────────┐   ┌──────────┐  │
│ │ • Zustand       │    │ • Axios         │   │ • JWT    │  │
│ │ • TanStack      │    │ • React Query   │   │ • RBAC   │  │
│ │ • Persistence   │    │ • Type Safety   │   │ • Secure │  │
│ └─────────────────┘    └─────────────────┘   └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```
- Manage organizations within their tenant
- User management for their tenant
- Access to tenant-specific analytics
- Organization creation and configuration

### Organization Admin
- Manage users within their organization
- Configure organization settings
- Access to organization-specific data
- Invite and manage organization members

### Organization Member
- Access to organization's risk analysis tools
- View and analyze company risk data
- Generate reports and insights
- Upload data for batch processing
