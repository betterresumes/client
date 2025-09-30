'use client'

import { createContext, useContext, useCallback, ReactNode } from 'react'
import { usePredictionsStore } from '@/lib/stores/predictions-store'

// 🚀 DECOUPLED PREDICTIONS PROVIDER - Issue #3 Fix
// This provider creates a clean interface between components and the predictions store
// Benefits:
// 1. ✅ Easy to mock for testing
// 2. ✅ No direct store coupling in components  
// 3. ✅ Centralized prediction logic
// 4. ✅ Better error handling
// 5. ✅ Consistent user management

interface PredictionsContextValue {
  fetchPredictions: (user: any, forceRefresh?: boolean) => Promise<void>
  validateAccess: (user: any) => { hasSystemAccess: boolean; defaultFilter: string }
  processPredictions: (responses: any[], user: any) => Promise<void>

  // Store state access (read-only)
  predictions: {
    annual: any[]
    quarterly: any[]
    systemAnnual: any[]
    systemQuarterly: any[]
  }
  isLoading: boolean
  error: string | null
  lastFetched: number | null
}

const PredictionsContext = createContext<PredictionsContextValue | null>(null)

interface PredictionsProviderProps {
  children: ReactNode
}

export function PredictionsProvider({ children }: PredictionsProviderProps) {
  // Subscribe to store state
  const {
    annualPredictions,
    quarterlyPredictions,
    systemAnnualPredictions,
    systemQuarterlyPredictions,
    isLoading,
    error,
    lastFetched,
    // Decoupled methods
    fetchPredictionsWithUser,
    validateUserAccess,
    processUserPredictions,
  } = usePredictionsStore()

  // Wrapped methods with error handling
  const fetchPredictions = useCallback(async (user: any, forceRefresh = false) => {
    try {
      if (!user) {
        throw new Error('User is required')
      }

      console.log('🔄 Provider: Fetching predictions for user', { userId: user.id, role: user.role })
      await fetchPredictionsWithUser(user, forceRefresh)
    } catch (error) {
      console.error('❌ Provider: Failed to fetch predictions:', error)
      throw error
    }
  }, [fetchPredictionsWithUser])

  const validateAccess = useCallback((user: any) => {
    try {
      return validateUserAccess(user)
    } catch (error) {
      console.error('❌ Provider: Failed to validate user access:', error)
      return { hasSystemAccess: false, defaultFilter: 'personal' }
    }
  }, [validateUserAccess])

  const processPredictions = useCallback(async (responses: any[], user: any) => {
    try {
      if (!user) {
        throw new Error('User is required')
      }

      console.log('📊 Provider: Processing predictions', { responseCount: responses.length })
      await processUserPredictions(responses, user)
    } catch (error) {
      console.error('❌ Provider: Failed to process predictions:', error)
      throw error
    }
  }, [processUserPredictions])

  const contextValue: PredictionsContextValue = {
    // Decoupled methods
    fetchPredictions,
    validateAccess,
    processPredictions,

    // Read-only state
    predictions: {
      annual: annualPredictions,
      quarterly: quarterlyPredictions,
      systemAnnual: systemAnnualPredictions,
      systemQuarterly: systemQuarterlyPredictions,
    },
    isLoading,
    error,
    lastFetched,
  }

  return (
    <PredictionsContext.Provider value={contextValue}>
      {children}
    </PredictionsContext.Provider>
  )
}

// Hook for consuming the decoupled predictions context
export function usePredictions() {
  const context = useContext(PredictionsContext)

  if (!context) {
    throw new Error('usePredictions must be used within a PredictionsProvider')
  }

  return context
}

// 🚀 USAGE EXAMPLE - Issue #3 Fix
// 
// // Instead of directly using the store in components:
// ❌ Bad (tightly coupled):
// const { fetchPredictions } = usePredictionsStore()
// const { user } = useAuthStore() 
// fetchPredictions() // Implicitly depends on auth store
//
// ✅ Good (decoupled):
// const { fetchPredictions } = usePredictions()
// fetchPredictions(user) // Explicit dependency injection
//
// // This makes testing much easier:
// const mockUser = { id: '1', role: 'user' }
// await fetchPredictions(mockUser) // No auth store needed!
