'use client'

/**
 * LocalStorage Management Utility
 * Handles efficient storage for large datasets with size monitoring
 */

export interface StorageQuota {
  used: number
  remaining: number
  total: number
  percentage: number
}

export class LocalStorageManager {
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB limit
  private static readonly WARNING_THRESHOLD = 0.8 // 80% usage warning

  /**
   * Get current localStorage usage statistics
   */
  static getStorageQuota(): StorageQuota {
    let used = 0

    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }
    } catch (error) {
      console.warn('Failed to calculate localStorage usage:', error)
    }

    const total = this.MAX_STORAGE_SIZE
    const remaining = Math.max(0, total - used)
    const percentage = used / total

    return { used, remaining, total, percentage }
  }

  /**
   * Check if storage is approaching capacity
   */
  static isStorageNearCapacity(): boolean {
    const quota = this.getStorageQuota()
    return quota.percentage > this.WARNING_THRESHOLD
  }

  /**
   * Get the estimated size of data before storing
   */
  static getDataSize(data: any): number {
    try {
      return JSON.stringify(data).length
    } catch (error) {
      console.warn('Failed to calculate data size:', error)
      return 0
    }
  }

  /**
   * Smart storage that checks capacity before storing large datasets
   */
  static setItemSafely(key: string, data: any): boolean {
    try {
      const dataSize = this.getDataSize(data)
      const quota = this.getStorageQuota()

      // If data is too large, don't store it
      if (dataSize > quota.remaining) {
        console.warn('⚠️ Data too large for localStorage:', {
          dataSize,
          remaining: quota.remaining,
          key
        })

        // Try to clear some space by removing old data
        this.cleanupOldData()

        // Check again after cleanup
        const newQuota = this.getStorageQuota()
        if (dataSize > newQuota.remaining) {
          console.warn('❌ Still insufficient space after cleanup, skipping storage')
          return false
        }
      }

      localStorage.setItem(key, JSON.stringify(data))

      // Log warning if approaching capacity
      const finalQuota = this.getStorageQuota()
      if (finalQuota.percentage > this.WARNING_THRESHOLD) {
        console.warn('⚠️ localStorage usage high:', {
          percentage: Math.round(finalQuota.percentage * 100) + '%',
          used: this.formatBytes(finalQuota.used),
          total: this.formatBytes(finalQuota.total)
        })
      }

      return true
    } catch (error) {
      console.error('Failed to store data in localStorage:', error)
      return false
    }
  }

  /**
   * Get item safely with error handling
   */
  static getItemSafely<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue
      return JSON.parse(item)
    } catch (error) {
      console.warn('Failed to retrieve data from localStorage:', error)
      return defaultValue
    }
  }

  /**
   * Clean up old data to free space
   */
  static cleanupOldData(): void {
    try {
      const keysToCheck = Object.keys(localStorage)
      const dataKeys = keysToCheck.filter(key =>
        key.includes('-storage') || key.includes('predictions') || key.includes('cache')
      )

      // Sort by potential age (keys with timestamps)
      dataKeys.sort((a, b) => {
        const aData = this.getItemSafely(a, {})
        const bData = this.getItemSafely(b, {})

        // Try to get timestamp for comparison
        const aTime = (aData as any)?.lastFetched || (aData as any)?.timestamp || 0
        const bTime = (bData as any)?.lastFetched || (bData as any)?.timestamp || 0

        return aTime - bTime // Oldest first
      })

      // Remove oldest entries until we free up some space
      let removedCount = 0
      for (const key of dataKeys.slice(0, 3)) { // Remove up to 3 old entries
        localStorage.removeItem(key)
        removedCount++
        console.log('🗑️ Cleaned up old localStorage key:', key)
      }

      if (removedCount > 0) {
        console.log(`✅ Freed up localStorage space by removing ${removedCount} old entries`)
      }
    } catch (error) {
      console.error('Failed to cleanup localStorage:', error)
    }
  }

  /**
   * Format bytes for human-readable display
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Monitor storage usage and log warnings
   */
  static monitorStorage(): void {
    const quota = this.getStorageQuota()
    console.log('📦 LocalStorage Usage:', {
      used: this.formatBytes(quota.used),
      remaining: this.formatBytes(quota.remaining),
      percentage: Math.round(quota.percentage * 100) + '%'
    })

    if (quota.percentage > 0.9) {
      console.error('🚨 localStorage nearly full! Consider implementing data pagination or cleanup.')
    } else if (quota.percentage > this.WARNING_THRESHOLD) {
      console.warn('⚠️ localStorage usage high. Monitor for performance issues.')
    }
  }
}

// Hook for using storage manager in React components
export function useLocalStorageMonitor() {
  const checkStorage = () => {
    LocalStorageManager.monitorStorage()
    return LocalStorageManager.getStorageQuota()
  }

  const clearOldData = () => {
    LocalStorageManager.cleanupOldData()
  }

  const isNearCapacity = () => {
    return LocalStorageManager.isStorageNearCapacity()
  }

  return {
    checkStorage,
    clearOldData,
    isNearCapacity
  }
}
