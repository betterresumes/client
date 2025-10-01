'use client'

import { useState, useEffect } from 'react'
import { useLocalStorageMonitor } from '@/lib/utils/storage-manager'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Info } from 'lucide-react'

export function StorageMonitor() {
  const { checkStorage, isNearCapacity } = useLocalStorageMonitor()
  const [showWarning, setShowWarning] = useState(false)
  const [storageInfo, setStorageInfo] = useState<any>(null)

  useEffect(() => {
    const quota = checkStorage()
    setStorageInfo(quota)
    setShowWarning(quota.percentage > 0.8) // Show warning at 80%
  }, [checkStorage])

  if (!showWarning) return null

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <div className="space-y-2">
          <p>
            <strong>Large Dataset Optimization:</strong> Your data is being managed efficiently in memory
            to handle 5000+ records without localStorage bloat.
          </p>
          {storageInfo && (
            <div className="text-sm opacity-80">
              Storage: {Math.round(storageInfo.percentage * 100)}% used
              ({(storageInfo.used / 1024 / 1024).toFixed(1)}MB of {(storageInfo.total / 1024 / 1024).toFixed(1)}MB)
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

export function DatasetSizeIndicator({ recordCount }: { recordCount: number }) {
  if (recordCount < 1000) return null

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        <strong>Large Dataset Mode:</strong> Managing {recordCount.toLocaleString()} records efficiently.
        Data is kept in memory for optimal performance and minimal localStorage usage.
      </AlertDescription>
    </Alert>
  )
}
