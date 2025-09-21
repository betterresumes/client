'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { predictionsApi } from '@/lib/api/predictions'
import { AnnualPredictionRequest, QuarterlyPredictionRequest } from '@/lib/types/prediction'
import { predictionKeys } from '@/lib/hooks/use-predictions'
import { usePredictionsStore } from '@/lib/stores/predictions-store'

export function useCreatePredictionMutations() {
  const queryClient = useQueryClient()
  const { addPrediction } = usePredictionsStore()

  // Annual prediction mutation
  const createAnnualPredictionMutation = useMutation({
    mutationFn: async (data: AnnualPredictionRequest) => {
      // Optimistic update
      const optimisticPrediction = {
        id: `temp-${Date.now()}`,
        company_id: data.company_symbol,
        company_symbol: data.company_symbol,
        company_name: data.company_name,
        reporting_year: data.reporting_year,
        reporting_quarter: data.reporting_quarter,
        long_term_debt_to_total_capital: data.long_term_debt_to_total_capital,
        total_debt_to_ebitda: data.total_debt_to_ebitda,
        net_income_margin: data.net_income_margin,
        ebit_to_interest_expense: data.ebit_to_interest_expense,
        return_on_assets: data.return_on_assets,
        probability: 0.15,
        default_probability: 0.15,
        risk_level: 'MEDIUM',
        risk_category: 'MEDIUM',
        confidence: 0.85,
        organization_access: 'personal',
        created_by: 'current_user',
        created_at: new Date().toISOString(),
        sector: data.sector,
        model_type: 'Annual'
      }

      addPrediction(optimisticPrediction as any, 'annual')
      return await predictionsApi.annual.createAnnualPrediction(data)
    },
    onSuccess: (response) => {
      const prediction = response.data?.prediction || response.data

      const realPrediction = {
        ...prediction,
        default_probability: prediction.probability || prediction.default_probability || 0,
        risk_category: prediction.risk_level,
        reporting_year: prediction.reporting_year,
        financial_ratios: {
          ltdtc: prediction.long_term_debt_to_total_capital,
          roa: prediction.return_on_assets,
          ebitint: prediction.ebit_to_interest_expense
        }
      }

      addPrediction(realPrediction as any, 'annual')
      queryClient.invalidateQueries({ queryKey: predictionKeys.annual() })
      toast.success('Annual prediction created successfully! 🎉')
    },
    onError: (error) => {
      console.error('Annual analysis failed:', error)
      toast.error('Failed to create annual prediction', {
        description: error.message || 'Please try again'
      })
    }
  })

  // Quarterly prediction mutation
  const createQuarterlyPredictionMutation = useMutation({
    mutationFn: async (data: QuarterlyPredictionRequest) => {
      // Optimistic update
      const optimisticPrediction = {
        id: `temp-${Date.now()}`,
        company_id: data.company_symbol,
        company_symbol: data.company_symbol,
        company_name: data.company_name,
        reporting_year: data.reporting_year,
        reporting_quarter: data.reporting_quarter,
        long_term_debt_to_total_capital: data.long_term_debt_to_total_capital,
        total_debt_to_ebitda: data.total_debt_to_ebitda,
        sga_margin: data.sga_margin,
        return_on_capital: data.return_on_capital,
        ensemble_probability: 0.15,
        default_probability: 0.15,
        risk_level: 'MEDIUM',
        risk_category: 'MEDIUM',
        confidence: 0.85,
        organization_access: 'personal',
        created_by: 'current_user',
        created_at: new Date().toISOString(),
        sector: data.sector,
        model_type: 'Quarterly'
      }

      addPrediction(optimisticPrediction as any, 'quarterly')
      return await predictionsApi.quarterly.createQuarterlyPrediction(data)
    },
    onSuccess: (response) => {
      const prediction = response.data?.prediction || response.data

      const realPrediction = {
        ...prediction,
        default_probability: prediction.ensemble_probability || prediction.logistic_probability || prediction.gbm_probability || 0,
        risk_category: prediction.risk_level,
        reporting_year: prediction.reporting_year,
        financial_ratios: {
          ltdtc: prediction.long_term_debt_to_total_capital,
          sga: prediction.sga_margin,
          roc: prediction.return_on_capital
        }
      }

      addPrediction(realPrediction as any, 'quarterly')
      queryClient.invalidateQueries({ queryKey: predictionKeys.quarterly() })
      toast.success('Quarterly prediction created successfully! 🎉')
    },
    onError: (error) => {
      console.error('Quarterly analysis failed:', error)
      toast.error('Failed to create quarterly prediction', {
        description: error.message || 'Please try again'
      })
    }
  })

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File, type: 'annual' | 'quarterly' }) => {
      if (type === 'annual') {
        return await predictionsApi.annual.bulkUploadAnnualAsync(file)
      } else {
        return await predictionsApi.quarterly.bulkUploadQuarterlyAsync(file)
      }
    },
    onSuccess: (response) => {
      const jobData = response.data
      queryClient.invalidateQueries({ queryKey: predictionKeys.all })

      toast.success(`Bulk upload started! Processing ${jobData.total_companies} companies...`, {
        description: `Job ID: ${jobData.job_id}`
      })

      return {
        success: true,
        jobId: jobData.job_id,
        totalCompanies: jobData.total_companies,
        estimatedDuration: jobData.estimated_duration
      }
    },
    onError: (error) => {
      console.error('Bulk upload failed:', error)
      toast.error('Failed to upload file', {
        description: error.message || 'Please check your file format and try again'
      })

      return {
        success: false,
        error: error.message || 'Upload failed'
      }
    }
  })

  return {
    createAnnualPredictionMutation,
    createQuarterlyPredictionMutation,
    bulkUploadMutation
  }
}
