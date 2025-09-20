import type { UserRole, BaseEntity } from './common'

// Authentication request types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  username?: string
  tenantId?: string
  organizationId?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

// Legacy types (keeping for backward compatibility)
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  fullName: string
  username?: string
}

export interface JoinOrgData {
  token: string
  email: string
  password: string
  fullName: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

// User types
export interface User extends BaseEntity {
  email: string
  username?: string
  fullName: string
  role: UserRole
  isActive: boolean
  lastLogin?: string
  tenantId?: string
  organizationId?: string
  joinedVia?: 'invitation' | 'registration' | 'whitelist'
  whitelistEmail?: boolean
}

export interface UserProfile extends User {
  permissions: Permission[]
  organizations: Organization[]
  currentOrganization?: Organization
}

export interface Permission {
  resource: string
  action: string
  allowed: boolean
}

// Organization types
export interface Organization extends BaseEntity {
  name: string
  slug: string
  domain?: string
  description?: string
  logoUrl?: string
  isActive: boolean
  tenantId?: string
  joinToken?: string
  joinEnabled: boolean
  defaultRole: UserRole
  maxUsers?: number
  allowGlobalDataAccess: boolean
}

// Tenant types (for super admin)
export interface Tenant extends BaseEntity {
  name: string
  slug: string
  domain?: string
  description?: string
  logoUrl?: string
  isActive: boolean
  createdBy: string
}
