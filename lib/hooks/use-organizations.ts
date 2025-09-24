import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  organizationsApi,
  type OrganizationCreate,
  type OrganizationUpdate,
  type WhitelistCreate
} from '../api'

export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: (filters: any) => [...organizationKeys.lists(), { filters }] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
  users: (id: string) => [...organizationKeys.detail(id), 'users'] as const,
  admins: (id: string) => [...organizationKeys.detail(id), 'admins'] as const,
  whitelist: (id: string) => [...organizationKeys.detail(id), 'whitelist'] as const,
  globalAccess: (id: string) => [...organizationKeys.detail(id), 'global-access'] as const,
}

export function useOrganizations(params?: {
  page?: number
  limit?: number
  search?: string
  is_active?: boolean
  tenant_id?: string
}) {
  return useQuery({
    queryKey: organizationKeys.list(params),
    queryFn: async () => {
      const response = await organizationsApi.list(params)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch organizations')
      }
      return response.data
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.detail(orgId),
    queryFn: async () => {
      const response = await organizationsApi.get(orgId)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch organization')
      }
      return response.data
    },
    enabled: !!orgId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useOrganizationDetails(orgId: string) {
  return useQuery({
    queryKey: [...organizationKeys.detail(orgId), 'details'],
    queryFn: async () => {
      const response = await organizationsApi.getDetails(orgId)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch organization details')
      }
      return response.data
    },
    enabled: !!orgId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useOrganizationAdmins(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.admins(orgId),
    queryFn: async () => {
      const response = await organizationsApi.getAdmins(orgId)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch organization admins')
      }
      return response.data
    },
    enabled: !!orgId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useOrganizationUsers(orgId: string, params?: {
  skip?: number
  limit?: number
  role?: string
}) {
  return useQuery({
    queryKey: organizationKeys.users(orgId),
    queryFn: async () => {
      const response = await organizationsApi.getUsers(orgId, params)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch organization users')
      }
      return response.data
    },
    enabled: !!orgId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useOrganizationGlobalAccess(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.globalAccess(orgId),
    queryFn: async () => {
      const response = await organizationsApi.getGlobalDataAccess(orgId)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch global data access status')
      }
      return response.data
    },
    enabled: !!orgId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useOrganizationWhitelist(orgId: string, params?: {
  skip?: number
  limit?: number
}) {
  return useQuery({
    queryKey: organizationKeys.whitelist(orgId),
    queryFn: async () => {
      const response = await organizationsApi.whitelist.list(orgId, params)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch organization whitelist')
      }
      return response.data
    },
    enabled: !!orgId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: OrganizationCreate) => {
      const response = await organizationsApi.create(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create organization')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { orgId: string; data: OrganizationUpdate }) => {
      const response = await organizationsApi.update(params.orgId, params.data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update organization')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.orgId) })
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { orgId: string; force?: boolean }) => {
      const response = await organizationsApi.delete(params.orgId, params.force)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete organization')
      }
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.removeQueries({ queryKey: organizationKeys.detail(variables.orgId) })
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
    },
  })
}

export function useRegenerateJoinToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orgId: string) => {
      const response = await organizationsApi.regenerateJoinToken(orgId)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to regenerate join token')
      }
      return response.data
    },
    onSuccess: (_, orgId) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(orgId) })
    },
  })
}

export function useUpdateGlobalDataAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { orgId: string; allowAccess: boolean }) => {
      const response = await organizationsApi.updateGlobalDataAccess(params.orgId, params.allowAccess)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update global data access')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.globalAccess(variables.orgId) })
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.orgId) })
    },
  })
}

export function useAddToWhitelist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { orgId: string; data: WhitelistCreate }) => {
      const response = await organizationsApi.whitelist.add(params.orgId, params.data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to add to whitelist')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.whitelist(variables.orgId) })
    },
  })
}

export function useRemoveFromWhitelist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { orgId: string; email: string }) => {
      const response = await organizationsApi.whitelist.remove(params.orgId, params.email)
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to remove from whitelist')
      }
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.whitelist(variables.orgId) })
    },
  })
}
