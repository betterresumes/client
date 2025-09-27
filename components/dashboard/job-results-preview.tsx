'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { jobsApi } from '@/lib/api/jobs'

interface JobResultsSummary {
  total_companies: number
  successful_predictions: number
  failed_predictions: number
  processing_time_seconds: number
}

interface JobResultsPreviewProps {
  jobId: string
  onViewFullResults: () => void
}

export function JobResultsPreview({ jobId, onViewFullResults }: JobResultsPreviewProps) {
  const [summary, setSummary] = useState<JobResultsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      if (!jobId) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await jobsApi.predictions.getBulkUploadJobResults(jobId)
        if (response.success && response.data) {
          setSummary(response.data.summary)
        } else {
          setError('Failed to load results summary')
        }
      } catch (err) {
        console.error('Error fetching job summary:', err)
        setError('Failed to load results')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSummary()
  }, [jobId])

  if (isLoading) {
    return (
      <Card className="mt-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Loading results preview...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !summary) {
    return (
      <Card className="mt-3 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">{error || 'No results available'}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const successRate = (summary.successful_predictions / summary.total_companies) * 100
  const failureRate = (summary.failed_predictions / summary.total_companies) * 100

  const getRiskDistributionBadge = (rate: number, type: 'success' | 'failure') => {
    if (type === 'success') {
      if (rate >= 90) return { color: 'bg-green-100 text-green-800', icon: TrendingUp }
      if (rate >= 75) return { color: 'bg-green-100 text-green-700', icon: TrendingUp }
      if (rate >= 50) return { color: 'bg-yellow-100 text-yellow-800', icon: Minus }
      return { color: 'bg-red-100 text-red-800', icon: TrendingDown }
    } else {
      if (rate <= 10) return { color: 'bg-green-100 text-green-800', icon: TrendingDown }
      if (rate <= 25) return { color: 'bg-yellow-100 text-yellow-800', icon: Minus }
      return { color: 'bg-red-100 text-red-800', icon: TrendingUp }
    }
  }

  const successBadge = getRiskDistributionBadge(successRate, 'success')
  const failureBadge = getRiskDistributionBadge(failureRate, 'failure')

  return (
    <Card className="mt-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Results Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewFullResults}
              className="h-6 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              View All
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{summary.total_companies}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{summary.successful_predictions}</div>
            <div className="text-xs text-gray-600">Success</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{summary.failed_predictions}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${successBadge.color}`}>
                <successBadge.icon className="h-3 w-3 mr-1" />
                Success Rate
              </Badge>
              <span className="font-medium">{successRate.toFixed(1)}%</span>
            </div>
          </div>
          <Progress value={successRate} className="h-1.5" />
          
          {summary.failed_predictions > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${failureBadge.color}`}>
                    <failureBadge.icon className="h-3 w-3 mr-1" />
                    Failure Rate
                  </Badge>
                  <span className="font-medium">{failureRate.toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={failureRate} className="h-1.5" />
            </>
          )}
        </div>

        <div className="mt-3 text-xs text-gray-500 text-center">
          Processing took {summary.processing_time_seconds.toFixed(1)}s
        </div>
      </CardContent>
    </Card>
  )
}
