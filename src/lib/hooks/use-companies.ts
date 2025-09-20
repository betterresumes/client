import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { companiesApi } from '../api/companies'
import { queryKeys } from '../config/query-client'
import { useNotifications } from '../stores/ui'
import type { Company, CompanyCreateRequest, CompanyUpdateRequest, CompanySearchParams } from '../types/company'

/**
 * Query hooks for companies data
 */

// Get companies list with pagination
export const useCompanies = (params?: CompanySearchParams) => {
  return useQuery({
    queryKey: queryKeys.companiesList(params),
    queryFn: () => companiesApi.getCompanies(params),
    enabled: true,
  })
}

// Get infinite companies list for virtual scrolling
export const useInfiniteCompanies = (baseParams?: Omit<CompanySearchParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: queryKeys.companiesList({ ...baseParams, infinite: true }),
    queryFn: ({ pageParam = 1 }) =>
      companiesApi.getCompanies({ ...baseParams, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.success || !lastPage.data) return undefined
      const { page, totalPages } = lastPage.data
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
  })
}

// Get single company
export const useCompany = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.company(id),
    queryFn: () => companiesApi.getCompany(id),
    enabled: enabled && !!id,
  })
}

// Get company by symbol
export const useCompanyBySymbol = (symbol: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.companyBySymbol(symbol),
    queryFn: () => companiesApi.getCompanyBySymbol(symbol),
    enabled: enabled && !!symbol,
  })
}

// Get company statistics
export const useCompanyStats = () => {
  return useQuery({
    queryKey: queryKeys.companyStats(),
    queryFn: () => companiesApi.getCompanyStats(),
  })
}

// Get companies for autocomplete
export const useCompaniesAutocomplete = (query?: string, limit = 20) => {
  return useQuery({
    queryKey: queryKeys.companyAutocomplete(query),
    queryFn: () => companiesApi.getCompaniesAutocomplete(query, limit),
    enabled: true,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Mutation hooks for companies actions
 */

// Create company
export const useCreateCompany = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: (data: CompanyCreateRequest) => companiesApi.createCompany(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.companies })
        showSuccess('Company created successfully')
      } else {
        showError('Failed to create company', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Failed to create company', error?.message)
    },
  })
}

// Update company
export const useUpdateCompany = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyUpdateRequest }) =>
      companiesApi.updateCompany(id, data),
    onSuccess: (response, { id }) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.companies })
        queryClient.invalidateQueries({ queryKey: queryKeys.company(id) })
        showSuccess('Company updated successfully')
      } else {
        showError('Failed to update company', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Failed to update company', error?.message)
    },
  })
}

// Delete company
export const useDeleteCompany = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: (id: string) => companiesApi.deleteCompany(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.companies })
        showSuccess('Company deleted successfully')
      } else {
        showError('Failed to delete company', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Failed to delete company', error?.message)
    },
  })
}

// Bulk upload companies
export const useBulkUploadCompanies = () => {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: ({ file, data }: { file: File; data: any }) =>
      companiesApi.bulkUploadCompanies(file, data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.companies })
        const { successCount, errorCount, totalRows } = response.data
        showSuccess(
          'Bulk upload completed',
          `${successCount}/${totalRows} companies processed successfully. ${errorCount} errors.`
        )
      } else {
        showError('Bulk upload failed', response.error?.message)
      }
    },
    onError: (error: any) => {
      showError('Bulk upload failed', error?.message)
    },
  })
}

// Validate company data
export const useValidateCompany = () => {
  return useMutation({
    mutationFn: (data: Partial<Company>) => companiesApi.validateCompany(data),
  })
}

// Export companies
export const useExportCompanies = () => {
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: (params?: CompanySearchParams & { format?: 'csv' | 'xlsx' }) =>
      companiesApi.exportCompanies(params),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `companies_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showSuccess('Export completed successfully')
    },
    onError: (error: any) => {
      showError('Export failed', error?.message)
    },
  })
}

// Download template
export const useDownloadTemplate = () => {
  const { showSuccess, showError } = useNotifications()

  return useMutation({
    mutationFn: () => companiesApi.downloadTemplate(),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'companies_template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showSuccess('Template downloaded successfully')
    },
    onError: (error: any) => {
      showError('Failed to download template', error?.message)
    },
  })
}
