'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'

/**
 * Hook to automatically refresh access tokens before they expire
 * Intelligently schedules refresh checks based on token expiration time
 */
export function useTokenRefresh() {
  const {
    isAuthenticated,
    tokenExpiresAt,
    refreshAccessToken,
    isRefreshing
  } = useAuthStore()

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !tokenExpiresAt) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    const scheduleTokenRefresh = () => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      const now = Date.now()
      const bufferTime = 2 * 60 * 1000 // 2 minutes before expiration
      const refreshTime = tokenExpiresAt - bufferTime
      const timeUntilRefresh = refreshTime - now

      // If token is already expired or should be refreshed now
      if (timeUntilRefresh <= 0) {
        performTokenRefresh()
        return
      }

      // Schedule refresh for the appropriate time
      console.log(`Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000)} seconds`)
      timeoutRef.current = setTimeout(() => {
        performTokenRefresh()
      }, timeUntilRefresh)
    }

    const performTokenRefresh = async () => {
      // Prevent multiple simultaneous refresh attempts
      if (isRefreshingRef.current || isRefreshing) {
        return
      }

      console.log('Performing automatic token refresh...')
      isRefreshingRef.current = true

      try {
        const success = await refreshAccessToken()
        if (success) {
          console.log('Token refreshed successfully')
          // Schedule the next refresh after successful refresh
          scheduleTokenRefresh()
        } else {
          console.warn('Token refresh failed')
        }
      } catch (error) {
        console.error('Token refresh error:', error)
      } finally {
        isRefreshingRef.current = false
      }
    }

    // Initial scheduling
    scheduleTokenRefresh()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isAuthenticated, tokenExpiresAt, refreshAccessToken, isRefreshing])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}

/**
 * Hook to handle manual token refresh with loading state
 */
export function useManualTokenRefresh() {
  const { refreshAccessToken, isRefreshing } = useAuthStore()

  const refresh = async () => {
    try {
      const success = await refreshAccessToken()
      return success
    } catch (error) {
      console.error('Manual token refresh failed:', error)
      return false
    }
  }

  return {
    refresh,
    isRefreshing
  }
}
