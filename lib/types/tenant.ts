// Tenant Types
export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface TenantCreate {
  name: string;
  domain?: string;
  description?: string;
  logo_url?: string;
}

export interface TenantUpdate {
  name?: string;
  domain?: string;
  description?: string;
  logo_url?: string;
  is_active?: boolean;
}

export interface TenantAdminInfo {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface DetailedOrganizationInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  join_token: string;
  join_enabled: boolean;
  default_role: string;
  max_users: number;
  created_at: string;
  updated_at?: string;
  admin?: OrganizationAdminInfo;
  members: OrganizationUserInfo[];
  total_users: number;
}

export interface OrganizationAdminInfo {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface OrganizationUserInfo {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface ComprehensiveTenantResponse {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
  tenant_admins: TenantAdminInfo[];
  total_tenant_admins: number;
  organizations: DetailedOrganizationInfo[];
  total_organizations: number;
  active_organizations: number;
  total_users_in_tenant: number;
  total_active_users: number;
}

export interface ComprehensiveTenantListResponse {
  tenants: ComprehensiveTenantResponse[];
  total: number;
  skip: number;
  limit: number;
  total_tenant_admins: number;
  total_organizations: number;
  total_users: number;
}

export interface TenantStatsResponse {
  tenant_id: string;
  tenant_name: string;
  total_organizations: number;
  active_organizations: number;
  total_users: number;
  created_at: string;
}

// Tenant Admin Management Types
export interface TenantWithAdminCreate {
  tenant_name: string;
  tenant_description?: string;
  tenant_domain?: string;
  admin_email: string;
  admin_password: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_username?: string;
  create_default_org?: boolean;
  default_org_name?: string;
  default_org_description?: string;
}

export interface TenantWithAdminResponse {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_domain?: string;
  tenant_created_at: string;
  admin_user_id: string;
  admin_email: string;
  admin_full_name: string;
  admin_username: string;
  admin_created_at: string;
  default_org_id?: string;
  default_org_name?: string;
  default_org_join_token?: string;
  success: boolean;
  message: string;
}

export interface ExistingUserTenantAssignment {
  user_email: string;
  tenant_id: string;
}

export interface ExistingUserTenantResponse {
  user_id: string;
  user_email: string;
  tenant_id: string;
  tenant_name: string;
  previous_role: string;
  new_role: string;
  success: boolean;
  message: string;
}

export interface AssignUserToOrgRequest {
  user_email: string;
  organization_id: string;
  role?: string; // defaults to 'org_member'
}

export interface AssignUserToOrgResponse {
  success: boolean;
  message: string;
  user_id: string;
  user_email: string;
  organization_name: string;
  assigned_role: string;
  tenant_name: string;
}

// Organization Types (Extended)
export interface OrganizationResponse {
  id: string;
  tenant_id?: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  logo_url?: string;
  max_users: number;
  join_token: string;
  join_enabled: boolean;
  default_role: string;
  is_active: boolean;
  allow_global_data_access: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
  join_created_at: string;
}

export interface OrganizationCreate {
  name: string;
  domain?: string;
  description?: string;
  logo_url?: string;
  tenant_id?: string;
  max_users?: number; // default: 500
  default_role?: string; // default: 'org_member'
}

export interface OrganizationUpdate {
  name?: string;
  domain?: string;
  description?: string;
  logo_url?: string;
  max_users?: number;
  default_role?: string;
  join_enabled?: boolean;
  is_active?: boolean;
  allow_global_data_access?: boolean;
}

export interface EnhancedTenantInfo {
  id: string;
  name: string;
  description?: string;
  tenant_code: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  tenant_admins: OrganizationMemberInfo[];
  total_tenant_admins: number;
}

export interface OrganizationMemberInfo {
  id: string;
  tenant_id?: string;
  organization_id?: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface EnhancedOrganizationResponse {
  id: string;
  tenant_id?: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  logo_url?: string;
  max_users: number;
  join_token: string;
  join_enabled: boolean;
  default_role: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
  join_created_at: string;
  tenant?: EnhancedTenantInfo;
  org_admin?: OrganizationMemberInfo;
  members: OrganizationMemberInfo[];
  total_users: number;
  active_users: number;
  total_members: number;
  active_members: number;
}

export interface EnhancedOrganizationListResponse {
  organizations: EnhancedOrganizationResponse[];
  total: number;
  skip: number;
  limit: number;
  total_admins: number;
  total_members: number;
  total_users: number;
}

export interface OrganizationDetailedResponse {
  id: string;
  tenant_id?: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  logo_url?: string;
  max_users: number;
  join_token: string;
  join_enabled: boolean;
  default_role: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
  join_created_at: string;
  org_admins: OrgAdminInfo[];
  total_users: number;
  active_users: number;
  admin_count: number;
}

export interface OrgAdminInfo {
  user_id: string;
  email: string;
  full_name?: string;
  username?: string;
  is_active: boolean;
  assigned_at: string;
}

// Whitelist Types
export interface WhitelistCreate {
  email: string;
}

export interface WhitelistResponse {
  id: string;
  organization_id: string;
  email: string;
  added_by: string;
  added_at: string;
  status: string;
}

export interface WhitelistListResponse {
  whitelist: WhitelistResponse[];
  total: number;
  skip: number;
  limit: number;
}
