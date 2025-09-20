import type { BaseEntity, RiskCategory, ModelType } from './common'
import type { Company } from './company'

// Prediction request types
export interface PredictionRequest {
  companyId?: string
  symbol?: string
  modelType: ModelType
  financialData?: FinancialRatios
}

export interface PredictionBatchRequest {
  modelType: ModelType
  companyIds?: string[]
  organizationId?: string
  includeCustomCompanies?: boolean
}

export interface PredictionParams {
  page?: number
  limit?: number
  search?: string
  companyId?: string
  modelType?: ModelType
  riskCategory?: RiskCategory
  minRisk?: number
  maxRisk?: number
  startDate?: string
  endDate?: string
  organizationId?: string
  sortBy?: 'defaultProbability' | 'createdAt' | 'company' | 'riskCategory'
  sortOrder?: 'asc' | 'desc'
}

export interface PredictionExportParams extends PredictionParams {
  format?: 'csv' | 'xlsx' | 'json'
  includeCompanyDetails?: boolean
  includeFinancialRatios?: boolean
  includeModelFeatures?: boolean
}

// Main prediction type (alias for PredictionResult)
export interface Prediction extends PredictionResult { }

// Prediction types
export interface FinancialRatios {
  // Annual model ratios (5 ratios)
  longTermDebtToTotalCapital?: number
  returnOnAssets?: number
  ebitInterestExpense?: number
  netIncomeToTotalAssets?: number
  workingCapitalToTotalAssets?: number

  // Quarterly model ratios (4 ratios)
  totalDebtToEbitda?: number
  ebitdaMargin?: number
  returnOnCapital?: number
}

export interface PredictionResult extends BaseEntity {
  companyId: string
  company?: Company
  modelType: ModelType
  defaultProbability: number
  riskCategory: RiskCategory
  confidence: number
  financialRatios: FinancialRatios
  modelVersion: string
  features?: ModelFeature[]
  userId: string
  organizationId?: string
}

export interface ModelFeature {
  name: string
  value: number
  weight: number
  contribution: number
}

export interface PredictionHistory {
  predictions: PredictionResult[]
  totalCount: number
  averageRisk: number
  riskDistribution: RiskDistribution
}

export interface RiskDistribution {
  low: number
  medium: number
  high: number
  critical: number
}

export interface BulkPredictionRequest {
  modelType: ModelType
  file: File
}

export interface ModelInsights {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  aucScore: number
  falsePositiveRate: number
  primaryRiskFactors: string[]
  modelConfidence: number
  lastUpdated: string
}
