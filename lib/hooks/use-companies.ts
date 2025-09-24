import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { companiesApi } from '../api/companies'
import type { CompanyCreate } from '../types/company'

export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (filters: any) => [...companyKeys.lists(), { filters }] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
  search: (symbol: string) => [...companyKeys.all, 'search', symbol] as const,
} as const

export function useCompanies(params?: {
  page?: number
  limit?: number
  search?: string
  sector?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}) {
  return useQuery({
    queryKey: companyKeys.list(params),
    queryFn: async () => {
      const response = await companiesApi.getCompanies(params)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load companies')
      }
      return response.data
    },
    staleTime: 5 * 60 * 1000, 
  })
}

export function useCompany(companyId: string) {
  return useQuery({
    queryKey: companyKeys.detail(companyId),
    queryFn: async () => {
      const response = await companiesApi.getCompany(companyId)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load company')
      }
      return response.data
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000, 
  })
}

export function useCompanyBySymbol(symbol: string) {
  return useQuery({
    queryKey: companyKeys.search(symbol),
    queryFn: async () => {
      const response = await companiesApi.getCompanyBySymbol(symbol)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Company not found')
      }
      return response.data
    },
    enabled: !!symbol && symbol.length > 0,
    staleTime: 10 * 60 * 1000, 
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) {
        return false
      }
      return failureCount < 2
    },
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CompanyCreate) => {
      const response = await companiesApi.createCompany(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create company')
      }
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      queryClient.setQueryData(companyKeys.detail(data.id), data)
      toast.success('Company created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create company')
    },
  })
}

export function useValidateCompany() {
  return useMutation({
    mutationFn: async (data: Partial<CompanyCreate>) => {
      const response = await companiesApi.validateCompany(data)
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to validate company')
      }
      return response.data
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Company validation failed')
    },
  })
}

export function useCompanySearch(searchTerm: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['companies', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return { items: [], total: 0, page: 1, size: 0, pages: 0 }
      }

      const response = await companiesApi.getCompanies({
        search: searchTerm,
        limit: 10
      })

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to search companies')
      }

      return response.data
    },
    enabled: enabled && searchTerm.length >= 2,
    staleTime: 30 * 1000, 
    retry: false, 
  })
}
