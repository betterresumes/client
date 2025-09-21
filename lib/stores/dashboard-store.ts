'use client'

import { create } from 'zustand'

interface DashboardState {
  // Navigation state
  activeTab: string
  selectedCompany: string | null
  selectedPredictionType: 'annual' | 'quarterly' | null
  
  // Actions
  setActiveTab: (tab: string) => void
  setSelectedCompany: (company: string | null, predictionType?: 'annual' | 'quarterly') => void
  navigateToCompanyDetails: (companySymbol: string, predictionType?: 'annual' | 'quarterly') => void
  clearSelection: () => void
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  activeTab: 'dashboard',
  selectedCompany: null,
  selectedPredictionType: null,

  // Actions
  setActiveTab: (tab: string) => {
    set({ activeTab: tab })
  },

  setSelectedCompany: (company: string | null, predictionType?: 'annual' | 'quarterly') => {
    set({ 
      selectedCompany: company,
      selectedPredictionType: predictionType || null
    })
  },

  navigateToCompanyDetails: (companySymbol: string, predictionType?: 'annual' | 'quarterly') => {
    set({ 
      activeTab: 'company-details',
      selectedCompany: companySymbol,
      selectedPredictionType: predictionType || null
    })
  },

  clearSelection: () => {
    set({
      selectedCompany: null,
      selectedPredictionType: null
    })
  }
}))
