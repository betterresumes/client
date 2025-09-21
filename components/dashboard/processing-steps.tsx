'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Loader2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProcessingStepsProps {
  currentStep: number
  predictionType: 'annual' | 'quarterly'
  isApiProcessing?: boolean
}

const PROCESSING_STEPS = [
  {
    id: 1,
    title: 'Data Validation',
    description: 'Validating input parameters and financial ratios'
  },
  {
    id: 2,
    title: 'Model Loading',
    description: 'Loading trained ML model and preprocessing data'
  },
  {
    id: 3,
    title: 'Risk Analysis',
    description: 'Running prediction algorithm and calculating risk scores'
  },
  {
    id: 4,
    title: 'Final Processing',
    description: 'Finalizing analysis and generating report'
  }
]

export function ProcessingSteps({ currentStep, predictionType, isApiProcessing = false }: ProcessingStepsProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Processing {predictionType === 'annual' ? 'Annual' : 'Quarterly'} Analysis
        </h3>
      </div>

      <div className="space-y-4">
        {PROCESSING_STEPS.map((step) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isPending = step.id > currentStep

          // Keep step 4 in loading state if we're at step 4 and API is processing
          const isLoadingFinalStep = step.id === 4 && currentStep === 4 && isApiProcessing

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
                {
                  "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700": isCompleted || isPending,
                  "bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600": isCurrent || isLoadingFinalStep
                }
              )}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6 text-gray-600" />
                ) : (isCurrent || isLoadingFinalStep) ? (
                  <Loader2 className="h-6 w-6 text-gray-600 animate-spin" />
                ) : (
                  <Clock className="h-6 w-6 text-gray-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "font-medium",
                    {
                      "text-gray-700 dark:text-gray-300": isCompleted,
                      "text-gray-900 dark:text-gray-100": isCurrent || isLoadingFinalStep,
                      "text-gray-500 dark:text-gray-400": isPending
                    }
                  )}>
                    {step.title}
                  </h4>
                </div>
                <p className={cn(
                  "text-sm",
                  {
                    "text-gray-600 dark:text-gray-400": isCompleted,
                    "text-gray-700 dark:text-gray-300": isCurrent || isLoadingFinalStep,
                    "text-gray-400 dark:text-gray-500": isPending
                  }
                )}>
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
