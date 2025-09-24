import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  tenantsApi,
  type TenantCreate,
  type TenantUpdate,
  type ComprehensiveTenantListResponse,
  type ComprehensiveTenantResponse,
  type TenantStatsResponse
} from '../api'

export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (filters: any) => [...tenantKeys.lists(), { filters }] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
  stats: (id: string) => [...tenantKeys.detail(id), 'stats'] as const,
}

export function useTenants(params?: {
  skip?: number
  limit?: number
  search?: string
  is_active?: boolean
}) {
  return useQuery({
    queryKey: tenantKeys.list(params),
    queryFn: async () => {
      const response = await tenantsApi.list(params)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch tenants')
      }
      return response.data
    },
    staleTime: 30 * 1000, 
    refetchOnWindowFocus: false,
  })
}

export function useTenant(tenantId: string) {
  return useQuery({
    queryKey: tenantKeys.detail(tenantId),
    queryFn: async () => {
      const response = await tenantsApi.get(tenantId)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch tenant')
      }
      return response.data
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useTenantStats(tenantId: string) {
  return useQuery({
    queryKey: tenantKeys.stats(tenantId),
    queryFn: async () => {
      const response = await tenantsApi.getStats(tenantId)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch tenant stats')
      }
      return response.data
    },
    enabled: !!tenantId,
    staleTime: 60 * 1000, 
    refetchOnWindowFocus: false,
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TenantCreate) => {
      const response = await tenantsApi.create(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create tenant')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { tenantId: string; data: TenantUpdate }) => {
      const response = await tenantsApi.update(params.tenantId, params.data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update tenant')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.tenantId) })
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { tenantId: string; force?: boolean }) => {
      const response = await tenantsApi.delete(params.tenantId, params.force)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete tenant')
      }
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.removeQueries({ queryKey: tenantKeys.detail(variables.tenantId) })
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
    },
  })
}
