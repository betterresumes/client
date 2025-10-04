'use client'

import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/lib/stores/auth-store'
import {
  AlertTriangle,
  BarChart3,
  Zap
} from 'lucide-react'

export function RiskInsightsView() {
  const { isAuthenticated } = useAuthStore()

  // Only show content to authenticated users
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please log in to view the About section.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6 font-bricolage">
      {/* Risk Insights Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bricolage font-bold text-gray-900 dark:text-white mt-16">
            About
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Deep dive into model performance metrics and system capabilities
          </p>
        </div>
      </div>



      {/* Model Performance & Features */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Model Performance & Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Model Accuracy */}
          <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              94.2%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Model Accuracy</div>
          </div>

          {/* AUC Score */}
          <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              0.89
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">AUC Score</div>
          </div>

          {/* False Positive Rate */}
          <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-4xl font-bold text-green-600 mb-2">
              12.3%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">False Positive Rate</div>
          </div>
        </div>
      </Card>

      {/* Key Model Features & Custom Analysis Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Model Features */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Key Model Features
          </h3>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Long-term Debt/Total Capital (30% weight)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Total Debt to EBITDA (25% weight)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                EBIT / Interest Expense (20% weight)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Return on Assets (15% weight)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Net Income Margins (10% weight)
              </span>
            </div>
          </div>
        </Card>

        {/* Custom Analysis Capabilities */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Custom Analysis Capabilities
          </h3>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Analyze any company using financial ratios
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Real-time default rate predictions
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Risk category classification
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Detailed financial ratio analysis
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
