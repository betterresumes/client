/**
 * User-related types matching FastAPI backend exactly
 */

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  status: UserStatus
  company_id: string
  is_verified: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export interface UserCreate {
  email: string
  password: string
  first_name: string
  last_name: string
  role?: UserRole
  company_id: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface UserUpdate {
  email?: string
  first_name?: string
  last_name?: string
  role?: UserRole
  status?: UserStatus
}

export interface PasswordUpdate {
  current_password: string
  new_password: string
}

export interface PasswordReset {
  token: string
  new_password: string
}

export interface PasswordResetRequest {
  email: string
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export interface UserProfile extends User {
  company?: {
    id: string
    name: string
    status: string
  }
}
