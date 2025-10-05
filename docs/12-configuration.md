# Configuration Management


### Environment Type Definitions

```typescript
// lib/config/env.ts
interface Environment {
  API_URL: string
  APP_URL: string
  ENVIRONMENT: 'development' | 'staging' | 'production'
  DEBUG: boolean
  
  // Authentication
  AUTH_COOKIE_SECURE: boolean
  AUTH_COOKIE_SAME_SITE: 'strict' | 'lax' | 'none'
  
  // Features
  ENABLE_ANALYTICS: boolean
  ENABLE_EXPORT: boolean
  ENABLE_NOTIFICATIONS: boolean
  
  // External services
  SENTRY_DSN?: string
  GOOGLE_ANALYTICS_ID?: string
  INTERCOM_APP_ID?: string
  
  // File handling
  MAX_FILE_SIZE: number
  ALLOWED_FILE_TYPES: string[]
}

function validateEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function parseBooleanEnv(key: string, defaultValue = false): boolean {
  const value = process.env[key]
  if (!value) return defaultValue
  return value.toLowerCase() === 'true'
}

function parseNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key]
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) return defaultValue
  return parsed
}

export const ENV: Environment = {
  API_URL: validateEnvVar('NEXT_PUBLIC_API_URL'),
  APP_URL: validateEnvVar('NEXT_PUBLIC_APP_URL'),
  ENVIRONMENT: (process.env.NEXT_PUBLIC_ENVIRONMENT as Environment['ENVIRONMENT']) || 'development',
  DEBUG: parseBooleanEnv('NEXT_PUBLIC_DEBUG', false),
  
  // Authentication
  AUTH_COOKIE_SECURE: parseBooleanEnv('NEXT_PUBLIC_AUTH_COOKIE_SECURE', false),
  AUTH_COOKIE_SAME_SITE: (process.env.NEXT_PUBLIC_AUTH_COOKIE_SAME_SITE as Environment['AUTH_COOKIE_SAME_SITE']) || 'lax',
  
  // Features
  ENABLE_ANALYTICS: parseBooleanEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', true),
  ENABLE_EXPORT: parseBooleanEnv('NEXT_PUBLIC_ENABLE_EXPORT', true),
  ENABLE_NOTIFICATIONS: parseBooleanEnv('NEXT_PUBLIC_ENABLE_NOTIFICATIONS', true),
  
  // External services
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
  INTERCOM_APP_ID: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
  
  // File handling
  MAX_FILE_SIZE: parseNumberEnv('NEXT_PUBLIC_MAX_FILE_SIZE', 10485760), // 10MB
  ALLOWED_FILE_TYPES: (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'csv,xlsx,xls').split(','),
}

// Environment checks
export const isDevelopment = ENV.ENVIRONMENT === 'development'
export const isProduction = ENV.ENVIRONMENT === 'production'
export const isStaging = ENV.ENVIRONMENT === 'staging'
```

## Application Constants (`lib/config/constants.ts`)

### API Configuration

```typescript
export const API_CONFIG = {
  BASE_URL: ENV.API_URL,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      PROFILE: '/auth/profile',
      CHANGE_PASSWORD: '/auth/change-password',
    },
    USERS: {
      BASE: '/auth/users',
      BY_ID: (id: string) => `/auth/users/${id}`,
    },
    PREDICTIONS: {
      BASE: '/predictions',
      BY_ID: (id: string) => `/predictions/${id}`,
      BATCH: '/predictions/batch',
      ANALYTICS: '/predictions/analytics',
      EXPORT: '/predictions/export',
    },
    ADMIN: {
      TENANTS: '/admin/tenants',
      ORGANIZATIONS: '/admin/organizations',
      STATS: '/admin/stats',
      INVITATIONS: '/admin/invitations',
    },
    UPLOAD: {
      FILES: '/upload/files',
      JOBS: '/upload/jobs',
      VALIDATE: '/upload/validate',
    },
  },
} as const
```

### UI Configuration

```typescript
export const UI_CONFIG = {
  // Layout
  SIDEBAR_WIDTH: 256,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 48,
  
  // Breakpoints (matches Tailwind)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
  
  // Animation durations (ms)
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Toast notifications
  TOAST: {
    DURATION: 5000,
    MAX_TOASTS: 5,
  },
  
  // Table pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    MAX_PAGE_SIZE: 100,
  },
  
  // Data refresh intervals (ms)
  REFRESH_INTERVALS: {
    DASHBOARD: 30000,      // 30 seconds
    JOB_STATUS: 2000,      // 2 seconds
    USER_ACTIVITY: 60000,   // 1 minute
  },
} as const
```

### Business Logic Constants

```typescript
export const RISK_CONFIG = {
  // Risk thresholds (probability values)
  THRESHOLDS: {
    LOW: 0.03,        // 0-3%
    MEDIUM: 0.07,     // 3-7%
    HIGH: 0.15,       // 7-15%
    CRITICAL: 1.0,    // 15%+
  },
  
  // Risk colors for charts and badges
  COLORS: {
    LOW: '#10b981',      // green-500
    MEDIUM: '#f59e0b',   // amber-500  
    HIGH: '#f97316',     // orange-500
    CRITICAL: '#ef4444', // red-500
  },
  
  // Chart colors
  CHART_COLORS: {
    PRIMARY: '#3b82f6',    // blue-500
    SECONDARY: '#6b7280',  // gray-500
    SUCCESS: '#10b981',    // green-500
    WARNING: '#f59e0b',    // amber-500
    ERROR: '#ef4444',      // red-500
  },
} as const

export const FILE_CONFIG = {
  UPLOAD: {
    MAX_SIZE: ENV.MAX_FILE_SIZE,
    ALLOWED_TYPES: ENV.ALLOWED_FILE_TYPES,
    ALLOWED_EXTENSIONS: ['.csv', '.xlsx', '.xls'],
    MIME_TYPES: [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
  },
  
  PROCESSING: {
    BATCH_SIZE: 100,
    MAX_PARALLEL_JOBS: 3,
    TIMEOUT_MINUTES: 30,
  },
} as const

export const USER_CONFIG = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    TENANT_ADMIN: 'tenant_admin',
    ORG_ADMIN: 'org_admin',
    ORG_MEMBER: 'org_member',
    USER: 'user',
  } as const,
  
  PERMISSIONS: {
    MANAGE_TENANTS: ['super_admin'],
    MANAGE_ORGANIZATIONS: ['super_admin', 'tenant_admin'],
    MANAGE_USERS: ['super_admin', 'tenant_admin', 'org_admin'],
    CREATE_PREDICTIONS: ['super_admin', 'tenant_admin', 'org_admin', 'org_member'],
    VIEW_ANALYTICS: ['super_admin', 'tenant_admin', 'org_admin', 'org_member', 'user'],
    EXPORT_DATA: ['super_admin', 'tenant_admin', 'org_admin', 'org_member'],
  },
  
  LIMITS: {
    MAX_LOGIN_ATTEMPTS: 5,
    SESSION_TIMEOUT: 3600000, // 1 hour in ms
    PASSWORD_MIN_LENGTH: 8,
    USERNAME_MIN_LENGTH: 3,
  },
} as const
```

## Feature Flags

### Feature Flag System

```typescript
// lib/config/features.ts
interface FeatureFlags {
  // Core features
  ENABLE_ANALYTICS: boolean
  ENABLE_EXPORT: boolean
  ENABLE_NOTIFICATIONS: boolean
  ENABLE_DARK_MODE: boolean
  
  // Advanced features
  ENABLE_BULK_UPLOAD: boolean
  ENABLE_CUSTOM_ANALYSIS: boolean
  ENABLE_API_ACCESS: boolean
  ENABLE_WEBHOOKS: boolean
  
  // Experimental features
  ENABLE_AI_INSIGHTS: boolean
  ENABLE_PREDICTIVE_ANALYTICS: boolean
  ENABLE_REALTIME_UPDATES: boolean
  
  // Admin features
  ENABLE_TENANT_MANAGEMENT: boolean
  ENABLE_SYSTEM_MONITORING: boolean
  ENABLE_AUDIT_LOGS: boolean
}

// Feature flags from environment and remote config
export const FEATURES: FeatureFlags = {
  // Core features
  ENABLE_ANALYTICS: ENV.ENABLE_ANALYTICS,
  ENABLE_EXPORT: ENV.ENABLE_EXPORT,
  ENABLE_NOTIFICATIONS: ENV.ENABLE_NOTIFICATIONS,
  ENABLE_DARK_MODE: true,
  
  // Advanced features (default enabled in production)
  ENABLE_BULK_UPLOAD: true,
  ENABLE_CUSTOM_ANALYSIS: true,
  ENABLE_API_ACCESS: isProduction,
  ENABLE_WEBHOOKS: isProduction,
  
  // Experimental features (disabled by default)
  ENABLE_AI_INSIGHTS: false,
  ENABLE_PREDICTIVE_ANALYTICS: false,
  ENABLE_REALTIME_UPDATES: isDevelopment,
  
  // Admin features
  ENABLE_TENANT_MANAGEMENT: true,
  ENABLE_SYSTEM_MONITORING: isProduction,
  ENABLE_AUDIT_LOGS: isProduction,
}

// Feature flag utilities
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FEATURES[feature] === true
}

export function requireFeature(feature: keyof FeatureFlags): void {
  if (!isFeatureEnabled(feature)) {
    throw new Error(`Feature '${feature}' is not enabled`)
  }
}

// React hook for feature flags
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  return isFeatureEnabled(feature)
}
```

## Next.js Configuration

### next.config.ts

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Build configuration
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'your-cdn-domain.com',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'auth-token',
          },
        ],
      },
    ]
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack config
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    }
    
    return config
  },
}

export default nextConfig
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom risk colors
        risk: {
          low: "#10b981",
          medium: "#f59e0b", 
          high: "#f97316",
          critical: "#ef4444",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        heading: ["var(--font-bricolage)", ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

## Runtime Configuration

### Configuration Provider

```typescript
// lib/config/config-provider.tsx
interface ConfigContextType {
  config: typeof FEATURES & typeof API_CONFIG & typeof UI_CONFIG
  updateConfig: (updates: Partial<ConfigContextType['config']>) => void
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState({
    ...FEATURES,
    ...API_CONFIG,
    ...UI_CONFIG,
  })
  
  const updateConfig = useCallback((updates: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])
  
  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider')
  }
  return context
}
```

### Dynamic Configuration Loading

```typescript
// lib/config/dynamic-config.ts
interface DynamicConfig {
  features: Partial<FeatureFlags>
  limits: Record<string, number>
  settings: Record<string, any>
}

class ConfigManager {
  private cache = new Map<string, any>()
  private listeners = new Set<(config: DynamicConfig) => void>()
  
  async loadConfig(): Promise<DynamicConfig> {
    try {
      const response = await fetch('/api/config')
      const config = await response.json()
      
      // Cache the config
      this.cache.set('dynamic-config', config)
      
      // Notify listeners
      this.listeners.forEach(listener => listener(config))
      
      return config
    } catch (error) {
      console.error('Failed to load dynamic config:', error)
      return this.getDefaultConfig()
    }
  }
  
  private getDefaultConfig(): DynamicConfig {
    return {
      features: {},
      limits: {},
      settings: {},
    }
  }
  
  subscribe(listener: (config: DynamicConfig) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  
  getCachedConfig(): DynamicConfig | null {
    return this.cache.get('dynamic-config') || null
  }
}

export const configManager = new ConfigManager()
```

This configuration system provides a flexible, type-safe way to manage application settings across different environments while supporting feature flags and runtime configuration updates.
