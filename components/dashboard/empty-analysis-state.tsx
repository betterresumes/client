'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, BarChart3, PieChart } from 'lucide-react'

interface EmptyAnalysisStateProps {
  predictionType: 'annual' | 'quarterly'
}

export function EmptyAnalysisState({ predictionType }: EmptyAnalysisStateProps) {
  return (
    <Card className="p-8 h-full flex items-center justify-center border-dashed border-2">
      <div className="text-center max-w-md">
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${predictionType === 'annual'
          ? 'bg-blue-100 dark:bg-blue-900/20'
          : 'bg-green-100 dark:bg-green-900/20'
          }`}>
          {predictionType === 'annual' ? (
            <BarChart3 className={`h-10 w-10 ${predictionType === 'annual' ? 'text-blue-600' : 'text-green-600'
              }`} />
          ) : (
            <PieChart className="h-10 w-10 text-green-600" />
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Ready for {predictionType === 'annual' ? 'Annual' : 'Quarterly'} Analysis
        </h3>

        <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Fill out the form with company information and financial ratios, then click
          <span className={`font-semibold mx-1 ${predictionType === 'annual' ? 'text-blue-600' : 'text-green-600'
            }`}>
            "Run {predictionType === 'annual' ? 'Annual' : 'Quarterly'} Analysis"
          </span>
          to get started.
        </p>

        <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>ML Prediction</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Risk Analysis</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
