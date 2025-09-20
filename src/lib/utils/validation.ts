import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
export const requiredStringSchema = z.string().min(1, 'This field is required')

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: requiredStringSchema,
  username: z.string().optional(),
})

export const joinOrgSchema = z.object({
  token: requiredStringSchema,
  email: emailSchema,
  password: passwordSchema,
  fullName: requiredStringSchema,
})

// Company schemas
export const companySchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol too long'),
  name: requiredStringSchema,
  sector: z.string().optional(),
  industry: z.string().optional(),
  marketCap: z.number().positive().optional(),
})

// Financial data schemas
export const annualFinancialDataSchema = z.object({
  totalAssets: z.number().positive().optional(),
  currentAssets: z.number().positive().optional(),
  inventories: z.number().positive().optional(),
  currentLiabilities: z.number().positive().optional(),
  totalLiabilities: z.number().positive().optional(),
  totalEquity: z.number().optional(),
  netIncome: z.number().optional(),
  ebit: z.number().optional(),
  interestExpense: z.number().positive().optional(),
  retainedEarnings: z.number().optional(),
  workingCapital: z.number().optional(),
  sales: z.number().positive().optional(),
})

export const quarterlyFinancialDataSchema = z.object({
  totalDebt: z.number().positive().optional(),
  ebitda: z.number().optional(),
  totalAssets: z.number().positive().optional(),
  totalEquity: z.number().optional(),
  sales: z.number().positive().optional(),
})

// Prediction schemas
export const annualPredictionSchema = z.object({
  companyId: z.string().optional(),
  symbol: z.string().optional(),
  modelType: z.literal('annual'),
  longTermDebtToTotalCapital: z.number().min(0).max(1).optional(),
  returnOnAssets: z.number().optional(),
  ebitInterestExpense: z.number().positive().optional(),
  netIncomeToTotalAssets: z.number().optional(),
  workingCapitalToTotalAssets: z.number().optional(),
})

export const quarterlyPredictionSchema = z.object({
  companyId: z.string().optional(),
  symbol: z.string().optional(),
  modelType: z.literal('quarterly'),
  totalDebtToEbitda: z.number().positive().optional(),
  ebitdaMargin: z.number().optional(),
  returnOnCapital: z.number().optional(),
})

// Organization schemas
export const organizationSchema = z.object({
  name: requiredStringSchema,
  description: z.string().optional(),
  domain: z.string().optional(),
  allowGlobalDataAccess: z.boolean().default(false),
})

// User profile schema
export const userProfileSchema = z.object({
  fullName: requiredStringSchema,
  username: z.string().optional(),
  email: emailSchema,
})

// File upload schema
export const fileUploadSchema = z.object({
  file: z.any().refine((file) => file instanceof File, 'File is required'),
  modelType: z.enum(['annual', 'quarterly']),
})

// Export type inference helpers
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type JoinOrgFormData = z.infer<typeof joinOrgSchema>
export type CompanyFormData = z.infer<typeof companySchema>
export type AnnualPredictionFormData = z.infer<typeof annualPredictionSchema>
export type QuarterlyPredictionFormData = z.infer<typeof quarterlyPredictionSchema>
export type OrganizationFormData = z.infer<typeof organizationSchema>
export type UserProfileFormData = z.infer<typeof userProfileSchema>
export type FileUploadFormData = z.infer<typeof fileUploadSchema>
