import type { BaseEntity, RiskCategory, ModelType } from './common'

// Company request types
export interface CompanyCreateRequest {
  symbol: string
  name: string
  sector?: string
  industry?: string
  marketCap?: number
  financialData?: FinancialData
  organizationId?: string
  isCustom?: boolean
  isPublic?: boolean
}

export interface CompanyUpdateRequest {
  symbol?: string
  name?: string
  sector?: string
  industry?: string
  marketCap?: number
  financialData?: FinancialData
  isCustom?: boolean
  isPublic?: boolean
}

export interface CompanyBulkUploadRequest {
  organizationId?: string
  skipDuplicates?: boolean
  updateExisting?: boolean
}

export interface CompanySearchParams {
  page?: number
  limit?: number
  search?: string
  sector?: string
  industry?: string
  riskCategory?: RiskCategory
  minMarketCap?: number
  maxMarketCap?: number
  isCustom?: boolean
  isPublic?: boolean
  organizationId?: string
  sortBy?: 'name' | 'symbol' | 'marketCap' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

// Company types
export interface Company extends BaseEntity {
  symbol: string
  name: string
  sector?: string
  industry?: string
  marketCap?: number
  organizationId?: string
  isCustom: boolean
  isPublic: boolean
}

export interface FinancialData {
  // Annual model ratios
  totalAssets?: number
  currentAssets?: number
  inventories?: number
  currentLiabilities?: number
  totalLiabilities?: number
  totalEquity?: number
  netIncome?: number
  ebit?: number
  interestExpense?: number
  retainedEarnings?: number
  workingCapital?: number
  sales?: number

  // Quarterly model ratios
  totalDebt?: number
  ebitda?: number
  returnOnCapital?: number

  // Calculated ratios
  longTermDebtToTotalCapital?: number
  returnOnAssets?: number
  ebitInterestExpense?: number
  netIncomeToTotalAssets?: number
  workingCapitalToTotalAssets?: number

  // Quarterly ratios
  totalDebtToEbitda?: number
  ebitdaMargin?: number
  returnOnCapitalQuarterly?: number
}

export interface CreateCompanyData {
  symbol: string
  name: string
  sector?: string
  industry?: string
  marketCap?: number
  financialData?: FinancialData
}
