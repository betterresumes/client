import type { BaseEntity } from './common'

// User roles from backend OpenAPI spec
export type UserRole = 'super_admin' | 'tenant_admin' | 'org_admin' | 'org_member' | 'user'

// Authentication request types
export interface UserLogin {
  email: string  // format: email
  password: string
}

export type LoginRequest = UserLogin

export interface UserCreate {
  email: string  // format: email
  username?: string
  full_name?: string
  password: string  // minLength: 8
  role?: UserRole  // default: "user"
  first_name?: string
  last_name?: string
}

export type RegisterRequest = UserCreate

// User update schema
export interface UserUpdate {
  username?: string      // optional, min 1 char (email format)
  email?: string         // optional, email format
  full_name?: string     // optional, min 1 char
  role?: UserRole        // optional
  organization_id?: string  // optional
  tenant_id?: string     // optional
  is_active?: boolean    // optional
}

export type UpdateProfileRequest = UserUpdate

// Change password request
export interface ChangePasswordRequest {
  current_password: string  // required
  new_password: string      // required, min 8 chars
  confirm_password: string  // required, must match new_password
}

// Authentication response types
export interface Token {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  user?: UserResponse
}

export interface UserResponse {
  id: string
  email: string
  username?: string
  full_name?: string
  role: UserRole
  organization_id?: string
  tenant_id?: string
  is_active: boolean
  created_at: string  // format: date-time
  last_login?: string  // format: date-time
  access_level?: string
  permissions?: string[]

  // Nested organization data
  organization?: {
    id: string
    name: string
    slug: string
    domain: string
    description?: string
    is_active: boolean
    allow_global_data_access?: boolean
    join_enabled?: boolean
    default_role?: string
    max_users?: number
    current_users?: number
    created_at: string
    join_token?: string
  }

  // Nested tenant data
  tenant?: {
    id: string
    name: string
    slug?: string
    domain: string
    description?: string
    is_active?: boolean
    created_at?: string
    total_organizations?: number
    total_users?: number
  }

  // For super admin - list of tenants
  tenants?: Array<{
    id: string
    name: string
    slug: string
    domain: string
    description?: string
    is_active: boolean
    organizations?: Array<{
      id: string
      name: string
      slug: string
      domain: string
      is_active: boolean
      member_count: number
    }>
  }>

  // For tenant admin - list of organizations
  organizations?: Array<{
    id: string
    name: string
    slug: string
    domain: string
    is_active: boolean
    allow_global_data_access: boolean
    member_count: number
    admin_email: string
  }>

  // For org admin - list of organization members
  organization_members?: Array<{
    id: string
    email: string
    full_name: string
    role: string
    is_active: boolean
    joined_at: string
  }>

  // Counts for super admin
  total_tenants?: number
  total_organizations?: number
}

export type UserProfile = UserResponse

// Organization join types
export interface JoinOrganizationRequest {
  join_token: string  // minLength: 1
}

export interface JoinOrganizationResponse {
  success: boolean
  message: string
  organization_id: string
  organization_name: string
  user_role: string
}

// User management types
export interface UserUpdate {
  username?: string
  full_name?: string
}

export interface UserRoleUpdate {
  role?: UserRole
}

export interface UserRoleUpdateResponse {
  user_id: string
  email: string
  full_name?: string
  old_role: string
  new_role: string
  updated_by: string
  updated_at: string  // format: date-time
}

export interface UserListResponse {
  users: UserResponse[]
  total: number
  skip: number
  limit: number
}

// Legacy compatibility types
export interface User extends UserResponse { }

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  tokenType: string
  expiresIn: number
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}
