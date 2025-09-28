'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { predictionsApi } from '@/lib/api/predictions'
import { AnnualPredictionRequest, QuarterlyPredictionRequest } from '@/lib/types/prediction'
import { predictionKeys } from '@/lib/hooks/use-predictions'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { formatApiError } from '@/lib/utils/error-formatting'

export function useCreatePredictionMutations() {
  const queryClient = useQueryClient()
  const { addPrediction, replacePrediction } = usePredictionsStore()

  const createAnnualPredictionMutation = useMutation({
    mutationFn: async (data: AnnualPredictionRequest) => {
      const response = await predictionsApi.annual.createAnnualPrediction(data)

      return { response, tempId: `temp-${Date.now()}` }
    },
    onSuccess: ({ response, tempId }) => {
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
      queryClient.invalidateQueries({ queryKey: predictionKeys.all })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-created', {
          detail: { type: 'annual', prediction: realPrediction }
        }))
        window.dispatchEvent(new CustomEvent('predictions-updated'))
      }

      return {
        company: prediction.company_name,
        symbol: prediction.company_symbol,
        sector: prediction.sector || 'N/A',
        defaultRate: `${((prediction.probability || prediction.default_probability || 0) * 100).toFixed(2)}%`,
        riskLevel: prediction.risk_level || prediction.risk_category || 'MEDIUM',
        modelConfidence: `${((prediction.confidence || 0) * 100).toFixed(1)}%`,
        financialRatios: prediction.financial_ratios || {},
        reportingPeriod: `Annual ${prediction.reporting_year}`,
        marketCap: `$${prediction.market_cap || 0}M`
      }
    },
    onError: (error: any) => {
      console.error('Annual analysis failed:', error)

      // Format user-friendly error messages
      const formattedErrorMessage = formatApiError(error, 'Failed to create annual prediction')

      toast.error(formattedErrorMessage, {
        description: 'Please try again'
      })
    }
  })

  const createQuarterlyPredictionMutation = useMutation({
    mutationFn: async (data: QuarterlyPredictionRequest) => {
      const response = await predictionsApi.quarterly.createQuarterlyPrediction(data)

      return { response, tempId: `temp-${Date.now()}` }
    },
    onSuccess: ({ response, tempId }) => {
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
      queryClient.invalidateQueries({ queryKey: predictionKeys.all })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prediction-created', {
          detail: { type: 'quarterly', prediction: realPrediction }
        }))
        window.dispatchEvent(new CustomEvent('predictions-updated'))
      }

      console.log('✅ Quarterly prediction created successfully and added to store')

      return {
        company: prediction.company_name,
        symbol: prediction.company_symbol,
        sector: prediction.sector || 'N/A',
        defaultRate: `${((prediction.ensemble_probability || prediction.logistic_probability || prediction.gbm_probability || 0) * 100).toFixed(2)}%`,
        riskLevel: prediction.risk_level || prediction.risk_category || 'MEDIUM',
        modelConfidence: `${((prediction.confidence || 0) * 100).toFixed(1)}%`,
        financialRatios: prediction.financial_ratios || {},
        reportingPeriod: `${prediction.reporting_quarter} ${prediction.reporting_year}`,
        marketCap: `$${prediction.market_cap || 0}M`
      }
    },
    onError: (error: any) => {
      console.error('Quarterly analysis failed:', error)

      // Format user-friendly error messages
      const formattedErrorMessage = formatApiError(error, 'Failed to create quarterly prediction')

      toast.error(formattedErrorMessage, {
        description: 'Please try again'
      })
    }
  })

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

      // Format user-friendly error messages
      const formattedErrorMessage = formatApiError(error, 'Failed to upload file')

      toast.error(formattedErrorMessage, {
        description: 'Please check your file format and try again'
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
