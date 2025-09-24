
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL!,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

export const RISK_THRESHOLDS = {
  LOW: 0.03,     
  MEDIUM: 0.07,   
  HIGH: 0.15,     
  CRITICAL: 1.0,  
} as const

export const CHART_COLORS = {
  LOW_RISK: '#10b981',     
  MEDIUM_RISK: '#f59e0b',  
  HIGH_RISK: '#f97316',    
  CRITICAL_RISK: '#ef4444', 
  PRIMARY: '#3b82f6',      
  SECONDARY: '#6b7280',    
} as const

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, 
  ALLOWED_TYPES: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ALLOWED_EXTENSIONS: ['.csv', '.xls', '.xlsx'],
} as const

export const POLLING = {
  JOB_STATUS: 2000,       
  DASHBOARD_METRICS: 30000,
  USER_ACTIVITY: 60000,   
} as const

export const UI = {
  SIDEBAR_WIDTH: 256,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,
  TOAST_DURATION: 5000,
} as const