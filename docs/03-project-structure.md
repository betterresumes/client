# Project Structure

## Route Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ROUTE HIERARCHY                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🌐 Public Routes        🔐 Protected Routes   👑 Admin      │
│ ┌─────────────────┐    ┌─────────────────┐   ┌──────────┐  │
│ │ / (landing)     │    │ /dashboard      │   │ /admin   │  │
│ │ /login          │    │ /analytics      │   │ • users  │  │
│ │ /register       │    │ /companies      │   │ • orgs   │  │
│ │ /forgot-pass    │    │ /settings       │   │ • tenants│  │
│ └─────────────────┘    └─────────────────┘   └──────────┘  │
│                                                             │
│        ↓                       ↓                    ↓      │
│   No Auth Required        Auth Required        Admin Only   │
│   Public Access           JWT Token            Super Admin │
└─────────────────────────────────────────────────────────────┘
```


## Library Directory

```
lib/
├── index.ts                # Main library exports
├── utils.ts                # General utility functions
├── api/                    # API integration layer
│   ├── client.ts           # Axios API client setup
│   ├── auth.ts             # Authentication API calls
│   ├── admin.ts            # Admin API calls
│   ├── predictions.ts      # Predictions API calls
│   ├── upload.ts           # File upload API calls
│   └── index.ts            # API exports
├── stores/                 # Zustand state stores
│   ├── auth-store.ts       # Authentication state
│   ├── dashboard-store.ts  # Dashboard UI state
│   ├── predictions-store.ts # Predictions data state
│   ├── bulk-upload-store.ts # File upload state
│   ├── dashboard-stats-store.ts # Dashboard statistics
│   ├── auth.ts             # Legacy auth store (deprecated)
│   └── auth-unified.ts     # Legacy unified auth (deprecated)
├── types/                  # TypeScript type definitions
│   ├── auth.ts             # Authentication types
│   ├── user.ts             # User-related types
│   ├── tenant.ts           # Tenant/organization types
│   ├── prediction.ts       # Prediction data types
│   ├── upload.ts           # File upload types
│   ├── common.ts           # Common/shared types
│   └── api.ts              # API response types
├── hooks/                  # Custom React hooks
│   ├── use-auth.ts         # Authentication hook
│   ├── use-prediction-mutations.ts  # Prediction CRUD hooks
│   ├── use-prediction-edit-mutations.ts # Prediction editing hooks
│   ├── use-token-refresh.ts # Token refresh hook
│   └── use-intersection-observer.ts # Intersection observer hook
├── config/                 # Configuration files
│   └── constants.ts        # Application constants
└── utils/                  # Utility functions
    └── [various utility files]
```