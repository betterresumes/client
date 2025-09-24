import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  tenantAdminApi,
  type TenantWithAdminCreate,
  type ExistingUserTenantAssignment,
  type AssignUserToOrgRequest
} from '../api'

export const tenantAdminKeys = {
  all: ['tenant-admin'] as const,
  adminInfo: (tenantId: string) => [...tenantAdminKeys.all, 'admin-info', tenantId] as const,
}

export function useTenantAdminInfo(tenantId: string) {
  return useQuery({
    queryKey: tenantAdminKeys.adminInfo(tenantId),
    queryFn: async () => {
      const response = await tenantAdminApi.getTenantAdminInfo(tenantId)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch tenant admin info')
      }
      return response.data
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateTenantWithAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TenantWithAdminCreate) => {
      const response = await tenantAdminApi.createTenantWithAdmin(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create tenant with admin')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: tenantAdminKeys.all })
    },
  })
}

export function useAssignExistingUserAsTenantAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ExistingUserTenantAssignment) => {
      const response = await tenantAdminApi.assignExistingUser(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to assign user as tenant admin')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantAdminKeys.adminInfo(variables.tenant_id) })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}

export function useRemoveTenantAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await tenantAdminApi.removeTenantAdmin(userId)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to remove tenant admin')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantAdminKeys.all })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}

export function useAssignUserToOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AssignUserToOrgRequest) => {
      const response = await tenantAdminApi.assignUserToOrganization(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to assign user to organization')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizations', variables.organization_id, 'users'] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}
