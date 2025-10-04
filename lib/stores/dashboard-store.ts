'use client'

import { create } from 'zustand'

interface DashboardState {
  // Navigation state
  activeTab: string
  selectedCompany: string | null
  selectedPredictionType: 'annual' | 'quarterly' | null
  selectedPredictionId: string | null

  // Form pre-fill state
  prefilledData: any | null

  // Actions
  setActiveTab: (tab: string) => void
  setSelectedCompany: (company: string | null, predictionType?: 'annual' | 'quarterly', predictionId?: string | null) => void
  navigateToCompanyDetails: (companySymbol: string, predictionType?: 'annual' | 'quarterly', predictionId?: string | null) => void
  navigateToCustomAnalysisWithData: (predictionData: any, predictionType: 'annual' | 'quarterly') => void
  clearSelection: () => void
  clearPrefilledData: () => void
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  activeTab: 'dashboard',
  selectedCompany: null,
  selectedPredictionType: null,
  selectedPredictionId: null,
  prefilledData: null,

  // Actions
  setActiveTab: (tab: string) => {
    set({ activeTab: tab })
  },

  setSelectedCompany: (company: string | null, predictionType?: 'annual' | 'quarterly', predictionId?: string | null) => {
    set({
      selectedCompany: company,
      selectedPredictionType: predictionType || null,
      selectedPredictionId: predictionId || null
    })
  },

  navigateToCompanyDetails: (companySymbol: string, predictionType?: 'annual' | 'quarterly', predictionId?: string | null) => {
    set({
      activeTab: 'company-details',
      selectedCompany: companySymbol,
      selectedPredictionType: predictionType || null,
      selectedPredictionId: predictionId || null
    })
  },

  navigateToCustomAnalysisWithData: (predictionData: any, predictionType: 'annual' | 'quarterly') => {
    set({
      activeTab: 'custom-analysis',
      prefilledData: {
        ...predictionData,
        predictionType
      }
    })
  },

  clearSelection: () => {
    set({
      selectedCompany: null,
      selectedPredictionType: null,
      selectedPredictionId: null
    })
  },

  clearPrefilledData: () => {
    set({
      prefilledData: null
    })
  }
}))
