'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Loader2, Trash2, X, Building2, Calendar } from 'lucide-react'
import { usePredictionMutations } from '@/hooks/use-prediction-edit-mutations'

interface Prediction {
  id: string
  company_symbol: string
  company_name: string
  reporting_year: string
  reporting_quarter?: string
  probability?: number
  ensemble_probability?: number
  risk_level: string
}

interface DeletePredictionDialogProps {
  isOpen: boolean
  onClose: () => void
  prediction: Prediction | null
  type: 'annual' | 'quarterly'
}

export function DeletePredictionDialog({ isOpen, onClose, prediction, type }: DeletePredictionDialogProps) {
  const { deletePredictionMutation, isDeleting } = usePredictionMutations()

  const handleDelete = async () => {
    if (!prediction) return

    try {
      await deletePredictionMutation.mutateAsync({
        id: prediction.id,
        type
      })
      onClose()
    } catch (error) {
      // Error handled by mutation
    }
  }

  if (!prediction) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 font-bricolage">
            <AlertTriangle className="h-5 w-5" />
            Delete Prediction
          </DialogTitle>
          <DialogDescription className="font-bricolage">
            This action cannot be undone. The prediction data will be permanently removed from the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prediction Info */}
          <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-semibold font-bricolage">{prediction.company_symbol}</h3>
                  <p className="text-sm text-gray-600 font-bricolage">{prediction.company_name}</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800 font-bricolage">
                <Calendar className="h-3 w-3 mr-1" />
                {type === 'annual' ? `Annual ${prediction.reporting_year}` : `${prediction.reporting_quarter} ${prediction.reporting_year}`}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 font-bricolage">Default Rate</p>
                <p className="font-semibold font-bricolage">
                  {((prediction.probability || prediction.ensemble_probability || 0) * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-bricolage">Risk Level</p>
                <Badge className={`${getRiskBadgeColor(prediction.risk_level)} font-bricolage`}>
                  {prediction.risk_level}
                </Badge>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-950 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-200 font-bricolage">
                  Are you sure you want to delete this prediction?
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1 font-bricolage">
                  This will permanently remove:
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 mt-2 list-disc list-inside space-y-1 font-bricolage">
                  <li>All financial ratio data</li>
                  <li>Prediction results and risk assessment</li>
                  <li>Historical analysis records</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="font-bricolage"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="font-bricolage"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {isDeleting ? 'Deleting...' : 'Delete Prediction'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getRiskBadgeColor(riskLevel: string) {
  switch (riskLevel?.toUpperCase()) {
    case 'LOW':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'HIGH':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'CRITICAL':
      return 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}
