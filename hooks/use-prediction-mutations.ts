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
      console.log('📤 Making annual prediction API call with data:', data)
      const response = await predictionsApi.annual.createAnnualPrediction(data)
      console.log('📥 Received API response:', response)

      // If the response indicates an error, throw it with the exact API error structure
      if (!response.success) {
        console.log('❌ Annual API Error Response:', response.error)
        console.log('❌ Error message:', response.error?.message)
        console.log('❌ Error details:', response.error?.details)

        // Try to get the most specific error message
        const errorMessage = response.error?.message ||
          response.error?.details?.detail ||
          'Failed to create annual prediction'

        console.log('❌ Using error message:', errorMessage)

        const error = new Error(errorMessage)
          // Preserve the exact API error structure - use message first as it contains the formatted detail
          ; (error as any).response = {
            data: {
              detail: errorMessage
            },
            status: response.error?.code || 400
          }
        console.log('❌ Throwing annual error with structure:', (error as any).response)
        throw error
      }

      console.log('✅ Annual prediction API call successful')
      return { response, tempId: `temp-${Date.now()}` }
    },
    onSuccess: ({ response, tempId }) => {
      // Ensure we have valid response data
      if (!response?.data) {
        console.error('No data in response:', response)
        return
      }

      const prediction = response.data?.prediction || response.data

      // Ensure prediction object exists and has required fields
      if (!prediction || typeof prediction !== 'object') {
        console.error('Invalid prediction data:', prediction)
        return
      }

      const realPrediction = {
        ...prediction,
        default_probability: prediction?.probability || prediction?.default_probability || 0,
        risk_category: prediction?.risk_level,
        reporting_year: prediction?.reporting_year,
        financial_ratios: {
          ltdtc: prediction?.long_term_debt_to_total_capital || 0,
          roa: prediction?.return_on_assets || 0,
          ebitint: prediction?.ebit_to_interest_expense || 0
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
        company: prediction?.company_name || 'Unknown',
        symbol: prediction?.company_symbol || 'N/A',
        sector: prediction?.sector || 'N/A',
        defaultRate: `${((prediction?.probability || prediction?.default_probability || 0) * 100).toFixed(2)}%`,
        riskLevel: prediction?.risk_level || prediction?.risk_category || 'MEDIUM',
        modelConfidence: `${((prediction?.confidence || 0) * 100).toFixed(1)}%`,
        financialRatios: prediction?.financial_ratios || {},
        reportingPeriod: `Annual ${prediction?.reporting_year || 'Unknown'}`,
        marketCap: `$${prediction?.market_cap || 0}M`
      }
    },
    onError: (error: any) => {
      console.error('Annual analysis failed:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      console.error('Error response:', error?.response)
      console.error('Error response data:', error?.response?.data)
      console.error('Error message detail:', error?.response?.data?.detail)

      // Get the API error message directly
      let errorMessage = 'Failed to create annual prediction'

      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail
        console.log('Using API detail message:', errorMessage)

        // Only format if it contains "already exists" - make it user friendly
        if (errorMessage.includes('already exists')) {
          errorMessage = errorMessage
            .replace('system scope', 'your predictions')
            .replace('global scope', 'your predictions')
            .replace('organization scope', 'your predictions')
          console.log('Formatted message:', errorMessage)
        }
      } else if (error?.message) {
        errorMessage = error.message
        console.log('Using error message:', errorMessage)
      }

      console.log('Final toast message:', errorMessage)
      toast.error(errorMessage)
    }
  })

  const createQuarterlyPredictionMutation = useMutation({
    mutationFn: async (data: QuarterlyPredictionRequest) => {
      console.log('📤 Making quarterly prediction API call with data:', data)
      const response = await predictionsApi.quarterly.createQuarterlyPrediction(data)
      console.log('📥 Received quarterly API response:', response)

      // If the response indicates an error, throw it with the exact API error structure
      if (!response.success) {
        console.log('❌ Quarterly API Error Response:', response.error)
        console.log('❌ Error message:', response.error?.message)
        console.log('❌ Error details:', response.error?.details)

        // Try to get the most specific error message
        const errorMessage = response.error?.message ||
          response.error?.details?.detail ||
          'Failed to create quarterly prediction'

        console.log('❌ Using error message:', errorMessage)

        const error = new Error(errorMessage)
          // Preserve the exact API error structure - use message first as it contains the formatted detail
          ; (error as any).response = {
            data: {
              detail: errorMessage
            },
            status: response.error?.code || 400
          }
        console.log('❌ Throwing quarterly error with structure:', (error as any).response)
        throw error
      }

      console.log('✅ Quarterly prediction API call successful')
      return { response, tempId: `temp-${Date.now()}` }
    },
    onSuccess: ({ response, tempId }) => {
      // Ensure we have valid response data
      if (!response?.data) {
        console.error('No data in response:', response)
        return
      }

      const prediction = response.data?.prediction || response.data

      // Ensure prediction object exists and has required fields
      if (!prediction || typeof prediction !== 'object') {
        console.error('Invalid prediction data:', prediction)
        return
      }

      const realPrediction = {
        ...prediction,
        default_probability: prediction?.ensemble_probability || prediction?.logistic_probability || prediction?.gbm_probability || 0,
        risk_category: prediction?.risk_level,
        reporting_year: prediction?.reporting_year,
        financial_ratios: {
          ltdtc: prediction?.long_term_debt_to_total_capital || 0,
          sga: prediction?.sga_margin || 0,
          roc: prediction?.return_on_capital || 0
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
        company: prediction?.company_name || 'Unknown',
        symbol: prediction?.company_symbol || 'N/A',
        sector: prediction?.sector || 'N/A',
        defaultRate: `${((prediction?.ensemble_probability || prediction?.logistic_probability || prediction?.gbm_probability || 0) * 100).toFixed(2)}%`,
        riskLevel: prediction?.risk_level || prediction?.risk_category || 'MEDIUM',
        modelConfidence: `${((prediction?.confidence || 0) * 100).toFixed(1)}%`,
        financialRatios: prediction?.financial_ratios || {},
        reportingPeriod: `${prediction?.reporting_quarter || 'Unknown'} ${prediction?.reporting_year || 'Unknown'}`,
        marketCap: `$${prediction?.market_cap || 0}M`
      }
    },
    onError: (error: any) => {
      console.error('Quarterly analysis failed:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      console.error('Error response:', error?.response)
      console.error('Error response data:', error?.response?.data)
      console.error('Error message detail:', error?.response?.data?.detail)

      // Get the API error message directly
      let errorMessage = 'Failed to create quarterly prediction'

      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail
        console.log('Using API detail message:', errorMessage)

        // Only format if it contains "already exists" - make it user friendly
        if (errorMessage.includes('already exists')) {
          errorMessage = errorMessage
            .replace('system scope', 'your predictions')
            .replace('global scope', 'your predictions')
            .replace('organization scope', 'your predictions')
          console.log('Formatted message:', errorMessage)
        }
      } else if (error?.message) {
        errorMessage = error.message
        console.log('Using error message:', errorMessage)
      }

      console.log('Final toast message:', errorMessage)
      toast.error(errorMessage)
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
