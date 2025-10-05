# Troubleshooting

## Common Issues and Solutions

This guide covers common issues encountered during development, deployment, and operation of the financial risk prediction application, along with their solutions.

## Development Issues

### TypeScript Compilation Errors

#### Type Import Conflicts
```bash
Error: Cannot find module 'zustand' or its corresponding type declarations.
```

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npx tsc --noEmit --listFiles
```

#### Next.js Type Issues
```bash
Error: Type error: Cannot find name 'NextRequest'
```

**Solution:**
```typescript
// Add proper imports
import { NextRequest, NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

// Ensure next-env.d.ts exists
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

### Component Rendering Issues

#### Hydration Mismatches
```bash
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

**Solution:**
```typescript
// Use dynamic imports for client-only components
import dynamic from 'next/dynamic'

const ClientOnlyComponent = dynamic(
  () => import('../components/client-only'),
  { ssr: false }
)

// Or use useEffect for client-side only code
useEffect(() => {
  // Client-side only code
}, [])
```

#### State Management Issues
```bash
Warning: Cannot update a component while rendering a different component.
```

**Solution:**
```typescript
// Move state updates to useEffect
useEffect(() => {
  if (condition) {
    setAuthStore((state) => ({
      ...state,
      user: newUser
    }))
  }
}, [condition])

// Use callback patterns for async state updates
const handleLogin = useCallback(async (credentials) => {
  try {
    const user = await loginUser(credentials)
    setAuthStore((state) => ({ ...state, user, isAuthenticated: true }))
  } catch (error) {
    console.error('Login failed:', error)
  }
}, [])
```

### API Integration Problems

#### CORS Issues
```bash
Error: Access to fetch at 'https://api.example.com' from origin 'http://localhost:3000' has been blocked by CORS policy.
```

**Solution:**
```typescript
// next.config.ts - Add proxy for development
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.example.com/:path*',
      },
    ]
  },
}

// Or configure API client
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

#### Authentication Token Issues
```bash
Error: 401 Unauthorized - Token expired
```

**Solution:**
```typescript
// Implement token refresh logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const newToken = await refreshToken()
        error.config.headers.Authorization = `Bearer ${newToken}`
        return apiClient.request(error.config)
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
```

## Build and Deployment Issues

### Build Failures

#### Memory Issues During Build
```bash
Error: JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Or modify package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

#### Import Resolution Errors
```bash
Error: Module not found: Can't resolve '@/components/ui/button'
```

**Solution:**
```typescript
// Check tsconfig.json paths configuration
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"]
    }
  }
}

// Verify file exists and export is correct
// components/ui/button.tsx
export { Button } from './button'
export default Button
```

### Docker Issues

#### Docker Build Failures
```bash
Error: COPY failed: no source files were specified
```

**Solution:**
```dockerfile
# Check Dockerfile paths and .dockerignore
# Ensure files exist before COPY

# Use proper multi-stage build
FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
```

#### Container Runtime Issues
```bash
Error: Application fails to start in container
```

**Solution:**
```dockerfile
# Add proper health checks
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Check environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Ensure proper user permissions
USER nextjs
```

## Performance Issues

### Slow Page Load Times

#### Bundle Size Issues
```bash
Warning: Large bundle size detected
```

**Solution:**
```bash
# Analyze bundle
npm run build:analyze

# Use dynamic imports for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />
})

# Implement code splitting by route
const Dashboard = lazy(() => import('./pages/Dashboard'))
```

#### Image Optimization Problems
```bash
Error: Image optimization error
```

**Solution:**
```typescript
// Use Next.js Image component properly
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority={true} // For above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Configure next.config.ts for external images
const nextConfig = {
  images: {
    domains: ['example.com'],
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

### Memory Leaks

#### Component Memory Leaks
```typescript
// Clean up subscriptions and timers
useEffect(() => {
  const subscription = dataStream.subscribe(handleData)
  const timer = setInterval(updateData, 1000)
  
  return () => {
    subscription.unsubscribe()
    clearInterval(timer)
  }
}, [])

// Clean up event listeners
useEffect(() => {
  const handleResize = () => setWindowWidth(window.innerWidth)
  
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

#### State Management Memory Issues
```typescript
// Proper Zustand store cleanup
const useStore = create<State>((set, get) => ({
  data: [],
  clearData: () => set({ data: [] }),
  
  // Reset store on logout
  reset: () => set(() => initialState),
}))

// Clear data when component unmounts
useEffect(() => {
  return () => {
    clearData()
  }
}, [clearData])
```

## Production Issues

### Runtime Errors

#### Server-Side Rendering Errors
```bash
Error: ReferenceError: window is not defined
```

**Solution:**
```typescript
// Check for window object
if (typeof window !== 'undefined') {
  // Client-side only code
  localStorage.setItem('key', 'value')
}

// Use dynamic imports for browser-specific libraries
const BrowserOnlyComponent = dynamic(
  () => import('./BrowserOnlyComponent'),
  { ssr: false }
)

// Or use useEffect
useEffect(() => {
  // This only runs on client
  const data = localStorage.getItem('key')
}, [])
```

#### API Rate Limiting
```bash
Error: 429 Too Many Requests
```

**Solution:**
```typescript
// Implement retry logic with exponential backoff
const apiCall = async (url: string, retries = 3): Promise<any> => {
  try {
    const response = await fetch(url)
    
    if (response.status === 429 && retries > 0) {
      const delay = Math.pow(2, 3 - retries) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      return apiCall(url, retries - 1)
    }
    
    return response.json()
  } catch (error) {
    if (retries > 0) {
      return apiCall(url, retries - 1)
    }
    throw error
  }
}

// Use TanStack Query for automatic retries
const { data, error } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

### Database Connection Issues

#### Connection Pool Exhaustion
```bash
Error: Connection pool exhausted
```

**Solution:**
```typescript
// Configure connection pool properly
const dbConfig = {
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
}

// Implement connection retry logic
const connectWithRetry = async (maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await db.connect()
      console.log('Database connected successfully')
      break
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error)
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
    }
  }
}
```

## Security Issues

### Authentication Problems

#### JWT Token Issues
```bash
Error: JsonWebTokenError: invalid signature
```

**Solution:**
```typescript
// Verify JWT configuration
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired')
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token')
    }
    throw error
  }
}

// Implement proper token refresh
const refreshAuthToken = async () => {
  try {
    const refreshToken = getRefreshToken()
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    
    if (!response.ok) {
      throw new Error('Token refresh failed')
    }
    
    const { accessToken } = await response.json()
    setAccessToken(accessToken)
    return accessToken
  } catch (error) {
    // Redirect to login
    router.push('/login')
    throw error
  }
}
```

#### CSRF Protection Issues
```typescript
// Implement CSRF protection
import { getCsrfToken } from 'next-auth/react'

const submitForm = async (data: FormData) => {
  const csrfToken = await getCsrfToken()
  
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(data),
  })
}
```

## Monitoring and Debugging

### Application Monitoring

#### Error Tracking Setup
```typescript
// Configure Sentry properly
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event)
      return null
    }
    return event
  },
  
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/api\.yourdomain\.com/,
      ],
    }),
  ],
  
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})
```

#### Performance Monitoring
```typescript
// Add performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      console.log('Page Load Time:', entry.loadEventEnd - entry.fetchStart)
    }
    if (entry.entryType === 'paint') {
      console.log(entry.name + ':', entry.startTime)
    }
  }
})

performanceObserver.observe({ entryTypes: ['navigation', 'paint'] })
```

### Debug Mode Configuration

#### Development Debugging
```typescript
// Enable debugging in development
if (process.env.NODE_ENV === 'development') {
  // Enable React DevTools
  if (typeof window !== 'undefined') {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.reactDevtoolsAgent?.addListener('shutdown', () => {
      console.log('React DevTools disconnected')
    })
  }
  
  // Enable Zustand DevTools
  const useStore = create(
    devtools(
      (set) => ({
        // Store implementation
      }),
      {
        name: 'app-store',
      }
    )
  )
}
```

## Emergency Procedures

### Rollback Procedures

#### Quick Rollback Steps
```bash
# 1. Identify last known good deployment
kubectl rollout history deployment/risk-prediction-app

# 2. Rollback to previous version
kubectl rollout undo deployment/risk-prediction-app

# 3. Verify rollback status
kubectl rollout status deployment/risk-prediction-app

# 4. Check application health
kubectl get pods -l app=risk-prediction-app
```

#### Database Recovery
```bash
# 1. Stop application
kubectl scale deployment risk-prediction-app --replicas=0

# 2. Restore from backup
pg_restore -h localhost -U username -d database backup_file.sql

# 3. Verify data integrity
psql -c "SELECT COUNT(*) FROM users;"

# 4. Restart application
kubectl scale deployment risk-prediction-app --replicas=3
```

### Incident Response

#### High CPU Usage
```bash
# 1. Check resource usage
kubectl top pods

# 2. Scale up temporarily
kubectl scale deployment risk-prediction-app --replicas=6

# 3. Investigate root cause
kubectl logs -f deployment/risk-prediction-app

# 4. Apply permanent fix
kubectl apply -f updated-deployment.yaml
```

#### Memory Leaks
```bash
# 1. Restart affected pods
kubectl delete pod -l app=risk-prediction-app

# 2. Monitor memory usage
kubectl top pods --containers

# 3. Implement memory limits
resources:
  limits:
    memory: "1Gi"
  requests:
    memory: "512Mi"
```

This troubleshooting guide provides comprehensive solutions for common issues encountered in the financial risk prediction application, helping developers quickly identify and resolve problems in development, staging, and production environments.
