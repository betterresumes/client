import type { BaseEntity, PaginatedResponse, ModelType, RiskCategory } from './common'
import type { Company } from './company'

// Annual prediction request from OpenAPI spec
export interface AnnualPredictionRequest {
  company_symbol: string  // maxLength: 20, minLength: 1
  company_name: string    // maxLength: 255, minLength: 1
  market_cap: number      // exclusiveMinimum: 0.0, description: "Market cap in millions of dollars"
  sector: string          // maxLength: 100, minLength: 1
  reporting_year: string  // pattern: "^\\d{4}$"
  reporting_quarter?: string  // pattern: "^Q[1-4]$", description: "Optional quarter (Q1, Q2, Q3, Q4)"

  // Annual model ratios (5 ratios)
  long_term_debt_to_total_capital: number  // maximum: 100.0, minimum: 0.0
  total_debt_to_ebitda: number            // minimum: 0.0
  net_income_margin: number               // maximum: 100.0, minimum: -100.0
  ebit_to_interest_expense: number        // minimum: 0.0
  return_on_assets: number                // maximum: 100.0, minimum: -100.0
}

// Quarterly prediction request from OpenAPI spec
export interface QuarterlyPredictionRequest {
  company_symbol: string  // maxLength: 20, minLength: 1
  company_name: string    // maxLength: 255, minLength: 1
  market_cap: number      // exclusiveMinimum: 0.0, description: "Market cap in millions of dollars"
  sector: string          // maxLength: 100, minLength: 1
  reporting_year: string  // pattern: "^\\d{4}$"
  reporting_quarter: string  // pattern: "^(Q[1-4]|[1-4])$"

  // Quarterly model ratios (4 ratios)
  total_debt_to_ebitda: number             // minimum: 0.0
  sga_margin: number                       // maximum: 100.0, minimum: -100.0
  long_term_debt_to_total_capital: number  // maximum: 100.0, minimum: 0.0
  return_on_capital: number                // maximum: 100.0, minimum: -100.0
}

// Financial ratios union type
export interface FinancialRatios {
  // Annual model ratios
  long_term_debt_to_total_capital?: number
  total_debt_to_ebitda?: number
  net_income_margin?: number
  ebit_to_interest_expense?: number
  return_on_assets?: number

  // Quarterly model ratios
  sga_margin?: number
  return_on_capital?: number
}

// Generic prediction result type
export interface PredictionResult extends BaseEntity {
  company_id: string
  company?: Company
  model_type: ModelType
  default_probability: number
  risk_category: RiskCategory
  confidence: number
  financial_ratios: FinancialRatios
  model_version: string
  features?: ModelFeature[]
  user_id: string
  organization_id?: string
  tenant_id?: string
  reporting_year: string
  reporting_quarter?: string
}

export interface ModelFeature {
  name: string
  value: number
  weight: number
  contribution: number
}

// API request types
export interface PredictionRequest {
  model_type: ModelType
  company_data: AnnualPredictionRequest | QuarterlyPredictionRequest
}

export interface PredictionBatchRequest {
  model_type: ModelType
  company_ids?: string[]
  organization_id?: string
  include_custom_companies?: boolean
}

// Search and filtering params
export interface PredictionParams {
  page?: number     // default: 1
  size?: number     // default: 10
  company_symbol?: string
  reporting_year?: string
  reporting_quarter?: string
  model_type?: ModelType
  risk_category?: RiskCategory
  min_risk?: number
  max_risk?: number
  start_date?: string
  end_date?: string
  organization_id?: string
  sort_by?: 'default_probability' | 'created_at' | 'company' | 'risk_category'
  sort_order?: 'asc' | 'desc'
}

// Export params
export interface PredictionExportParams extends PredictionParams {
  format?: 'csv' | 'xlsx' | 'json'
  include_company_details?: boolean
  include_financial_ratios?: boolean
  include_model_features?: boolean
}

// Response types
export type Prediction = PredictionResult
export type PredictionListResponse = PaginatedResponse<Prediction>

// Bulk upload file request
export interface BulkUploadFileRequest {
  file: File  // format: binary
  prediction_type?: string  // default: "annual"
}

// Job response for async operations
export interface BulkUploadJobResponse {
  job_id: string
  total_companies: number
  estimated_duration: number
}

// Analytics types
export interface RiskDistribution {
  low: number
  medium: number
  high: number
  critical: number
}

export interface PredictionHistory {
  predictions: Prediction[]
  total_count: number
  average_risk: number
  risk_distribution: RiskDistribution
}

export interface ModelInsights {
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  auc_score: number
  false_positive_rate: number
  primary_risk_factors: string[]
  model_confidence: number
  last_updated: string
}
