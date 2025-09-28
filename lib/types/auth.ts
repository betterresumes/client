import type { BaseEntity } from './common'

export type UserRole = 'super_admin' | 'tenant_admin' | 'org_admin' | 'org_member' | 'user'

export interface UserLogin {
  email: string
  password: string
}

export type LoginRequest = UserLogin

export interface UserCreate {
  email: string
  username?: string
  full_name?: string
  password: string
  role?: UserRole
  first_name?: string
  last_name?: string
}

export type RegisterRequest = UserCreate

export interface UserUpdate {
  username?: string
  email?: string
  full_name?: string
  role?: UserRole
  organization_id?: string
  tenant_id?: string
  is_active?: boolean
  sector?: string
}

export type UpdateProfileRequest = UserUpdate

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

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
  created_at: string
  last_login?: string
  sector?: string

  organization?: {
    id: string
    name: string
    slug: string
    domain: string
    description: string
    is_active: boolean
    join_enabled: boolean
    default_role: string
    max_users: number
    current_users: number
    created_at: string
    join_token?: string
  }
  tenant?: {
    id: string
    name: string
    domain: string
  }
}

export type UserProfile = UserResponse

export interface JoinOrganizationRequest {
  join_token: string
}

export interface JoinOrganizationResponse {
  success: boolean
  message: string
  organization_id: string
  organization_name: string
  user_role: string
}

export interface UserUpdate {
  username?: string
  full_name?: string
  sector?: string
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
  updated_at: string
}

export interface UserListResponse {
  users: UserResponse[]
  total: number
  skip: number
  limit: number
}

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