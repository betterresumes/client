import { useQueryClient } from '@tanstack/react-query'
import { usePredictionsStore } from '@/lib/stores/predictions-store'
import { predictionKeys } from './use-predictions'

export function useInstantPredictions() {
  const queryClient = useQueryClient()
  const addPrediction = usePredictionsStore(state => state.addPrediction)

  const addInstantPrediction = (prediction: any, type: 'annual' | 'quarterly') => {
    const transformedPrediction = {
      ...prediction,
      default_probability: prediction.probability || prediction.ensemble_probability || prediction.logistic_probability || prediction.gbm_probability || 0,
      risk_category: prediction.risk_level,
      reporting_year: prediction.reporting_year?.toString() || new Date().getFullYear().toString(),
      financial_ratios: {
        ltdtc: prediction.long_term_debt_to_total_capital,
        roa: prediction.return_on_assets,
        ebitint: prediction.ebit_to_interest_expense
      }
    }

    const queryKey = type === 'annual' ? predictionKeys.annualList({}) : predictionKeys.quarterlyList({})

    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) {
        return {
          predictions: [prediction],
          pagination: { total: 1, page: 1, size: 100 }
        }
      }

      return {
        ...oldData,
        predictions: [prediction, ...(oldData.predictions || [])],
        pagination: {
          ...oldData.pagination,
          total: (oldData.pagination?.total || 0) + 1
        }
      }
    })

    addPrediction(transformedPrediction, type)

    console.log(`✅ ${type} prediction added instantly - no loading!`)
  }

  const invalidateAndRefresh = () => {
    queryClient.invalidateQueries({ queryKey: predictionKeys.all })
  }

  return {
    addInstantPrediction,
    invalidateAndRefresh
  }
}
