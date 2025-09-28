import { create } from 'zustand'
import { UserRole } from '@/lib/types/user'
import { ComprehensiveTenantResponse, EnhancedOrganizationResponse } from '@/lib/types/tenant'

interface SettingsState {
  tenants: ComprehensiveTenantResponse[]
  organizations: EnhancedOrganizationResponse[]
  organizationMembers: any[]
  whitelistedEmails: string[]
  // Loading states to prevent duplicate API calls
  tenantsLoaded: boolean
  organizationsLoaded: boolean
  organizationMembersLoaded: boolean
  whitelistedEmailsLoaded: boolean
  // Setters
  setTenants: (tenants: ComprehensiveTenantResponse[]) => void
  setOrganizations: (orgs: EnhancedOrganizationResponse[]) => void
  setOrganizationMembers: (members: any[]) => void
  setWhitelistedEmails: (emails: string[]) => void
  // Force refresh functions
  refreshTenants: () => void
  refreshOrganizations: () => void
  refreshOrganizationMembers: () => void
  refreshWhitelistedEmails: () => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  tenants: [],
  organizations: [],
  organizationMembers: [],
  whitelistedEmails: [],
  tenantsLoaded: false,
  organizationsLoaded: false,
  organizationMembersLoaded: false,
  whitelistedEmailsLoaded: false,
  setTenants: (tenants) => set({ tenants, tenantsLoaded: true }),
  setOrganizations: (organizations) => set({ organizations, organizationsLoaded: true }),
  setOrganizationMembers: (organizationMembers) => set({ organizationMembers, organizationMembersLoaded: true }),
  setWhitelistedEmails: (whitelistedEmails) => set({ whitelistedEmails, whitelistedEmailsLoaded: true }),
  refreshTenants: () => set({ tenantsLoaded: false }),
  refreshOrganizations: () => set({ organizationsLoaded: false }),
  refreshOrganizationMembers: () => set({ organizationMembersLoaded: false }),
  refreshWhitelistedEmails: () => set({ whitelistedEmailsLoaded: false }),
  resetSettings: () => set({
    tenants: [],
    organizations: [],
    organizationMembers: [],
    whitelistedEmails: [],
    tenantsLoaded: false,
    organizationsLoaded: false,
    organizationMembersLoaded: false,
    whitelistedEmailsLoaded: false
  })
}))
