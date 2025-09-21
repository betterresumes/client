/**
 * Application constants and configuration values
 */

// API Configuration  
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL!,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

// Risk thresholds
export const RISK_THRESHOLDS = {
  LOW: 0.03,      // 0-3%
  MEDIUM: 0.07,   // 3-7%
  HIGH: 0.15,     // 7-15%
  CRITICAL: 1.0,  // 15%+
} as const

// Chart colors
export const CHART_COLORS = {
  LOW_RISK: '#10b981',     // green-500
  MEDIUM_RISK: '#f59e0b',  // amber-500
  HIGH_RISK: '#f97316',    // orange-500
  CRITICAL_RISK: '#ef4444', // red-500
  PRIMARY: '#3b82f6',      // blue-500
  SECONDARY: '#6b7280',    // gray-500
} as const

// File upload constraints
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ALLOWED_EXTENSIONS: ['.csv', '.xls', '.xlsx'],
} as const

// Job polling intervals
export const POLLING = {
  JOB_STATUS: 2000,       // 2 seconds
  DASHBOARD_METRICS: 30000, // 30 seconds
  USER_ACTIVITY: 60000,   // 1 minute
} as const

// UI constants
export const UI = {
  SIDEBAR_WIDTH: 256,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,
  TOAST_DURATION: 5000,
} as const