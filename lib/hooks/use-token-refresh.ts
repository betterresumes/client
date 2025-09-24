'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'

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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      const now = Date.now()
      const bufferTime = 2 * 60 * 1000 
      const refreshTime = tokenExpiresAt - bufferTime
      const timeUntilRefresh = refreshTime - now

      if (timeUntilRefresh <= 0) {
        performTokenRefresh()
        return
      }

      console.log(`Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000)} seconds`)
      timeoutRef.current = setTimeout(() => {
        performTokenRefresh()
      }, timeUntilRefresh)
    }

    const performTokenRefresh = async () => {
      if (isRefreshingRef.current || isRefreshing) {
        return
      }

      console.log('Performing automatic token refresh...')
      isRefreshingRef.current = true

      try {
        const success = await refreshAccessToken()
        if (success) {
          console.log('Token refreshed successfully')
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

    scheduleTokenRefresh()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isAuthenticated, tokenExpiresAt, refreshAccessToken, isRefreshing])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}

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
