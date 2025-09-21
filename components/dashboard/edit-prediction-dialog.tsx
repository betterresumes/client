'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X, Building2, BarChart3, Calendar } from 'lucide-react'
import { usePredictionMutations } from '@/hooks/use-prediction-edit-mutations'
import { SECTORS } from '@/lib/config/sectors'
import { AnnualPredictionRequest, QuarterlyPredictionRequest } from '@/lib/types/prediction'

interface Prediction {
  id: string
  company_symbol: string
  company_name: string
  sector?: string
  market_cap?: number
  reporting_year: string
  reporting_quarter?: string
  
  // Annual ratios
  long_term_debt_to_total_capital?: number
  total_debt_to_ebitda?: number
  net_income_margin?: number
  ebit_to_interest_expense?: number
  return_on_assets?: number
  
  // Quarterly ratios
  sga_margin?: number
  return_on_capital?: number
  
  // Prediction results
  probability?: number
  ensemble_probability?: number
  logistic_probability?: number
  gbm_probability?: number
  risk_level: string
  confidence: number
}

interface EditPredictionDialogProps {
  isOpen: boolean
  onClose: () => void
  prediction: Prediction | null
  type: 'annual' | 'quarterly'
}

export function EditPredictionDialog({ isOpen, onClose, prediction, type }: EditPredictionDialogProps) {
  const { updatePredictionMutation, isUpdating } = usePredictionMutations()

  // Form state
  const [formData, setFormData] = useState({
    company_symbol: '',
    company_name: '',
    sector: '',
    market_cap: '',
    reporting_year: '',
    reporting_quarter: '',
    
    // Annual ratios
    long_term_debt_to_total_capital: '',
    total_debt_to_ebitda: '',
    net_income_margin: '',
    ebit_to_interest_expense: '',
    return_on_assets: '',
    
    // Quarterly ratios
    sga_margin: '',
    return_on_capital: ''
  })

  // Initialize form data when prediction changes
  useEffect(() => {
    if (prediction) {
      setFormData({
        company_symbol: prediction.company_symbol || '',
        company_name: prediction.company_name || '',
        sector: prediction.sector || '',
        market_cap: prediction.market_cap?.toString() || '',
        reporting_year: prediction.reporting_year || '',
        reporting_quarter: prediction.reporting_quarter || '',
        
        // Annual ratios
        long_term_debt_to_total_capital: prediction.long_term_debt_to_total_capital?.toString() || '',
        total_debt_to_ebitda: prediction.total_debt_to_ebitda?.toString() || '',
        net_income_margin: prediction.net_income_margin?.toString() || '',
        ebit_to_interest_expense: prediction.ebit_to_interest_expense?.toString() || '',
        return_on_assets: prediction.return_on_assets?.toString() || '',
        
        // Quarterly ratios
        sga_margin: prediction.sga_margin?.toString() || '',
        return_on_capital: prediction.return_on_capital?.toString() || ''
      })
    }
  }, [prediction])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    if (!prediction) return

    const baseData = {
      company_symbol: formData.company_symbol,
      company_name: formData.company_name,
      sector: formData.sector,
      market_cap: parseFloat(formData.market_cap) || 0,
      reporting_year: formData.reporting_year,
      reporting_quarter: formData.reporting_quarter || undefined
    }

    try {
      if (type === 'annual') {
        const data: AnnualPredictionRequest = {
          ...baseData,
          long_term_debt_to_total_capital: parseFloat(formData.long_term_debt_to_total_capital) || 0,
          total_debt_to_ebitda: parseFloat(formData.total_debt_to_ebitda) || 0,
          net_income_margin: parseFloat(formData.net_income_margin) || 0,
          ebit_to_interest_expense: parseFloat(formData.ebit_to_interest_expense) || 0,
          return_on_assets: parseFloat(formData.return_on_assets) || 0
        }
        
        await updatePredictionMutation.mutateAsync({
          id: prediction.id,
          data,
          type: 'annual'
        })
      } else {
        const data: QuarterlyPredictionRequest = {
          ...baseData,
          reporting_quarter: formData.reporting_quarter || 'Q1', // Ensure quarter is provided
          long_term_debt_to_total_capital: parseFloat(formData.long_term_debt_to_total_capital) || 0,
          total_debt_to_ebitda: parseFloat(formData.total_debt_to_ebitda) || 0,
          sga_margin: parseFloat(formData.sga_margin) || 0,
          return_on_capital: parseFloat(formData.return_on_capital) || 0
        }
        
        await updatePredictionMutation.mutateAsync({
          id: prediction.id,
          data,
          type: 'quarterly'
        })
      }
      
      onClose()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleClose = () => {
    setFormData({
      company_symbol: '',
      company_name: '',
      sector: '',
      market_cap: '',
      reporting_year: '',
      reporting_quarter: '',
      long_term_debt_to_total_capital: '',
      total_debt_to_ebitda: '',
      net_income_margin: '',
      ebit_to_interest_expense: '',
      return_on_assets: '',
      sga_margin: '',
      return_on_capital: ''
    })
    onClose()
  }

  if (!prediction) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bricolage">
            <BarChart3 className="h-5 w-5" />
            Edit {type === 'annual' ? 'Annual' : 'Quarterly'} Prediction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Prediction Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <div>
                    <h3 className="font-semibold font-bricolage">{prediction.company_symbol}</h3>
                    <p className="text-sm text-gray-600 font-bricolage">{prediction.company_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-100 text-blue-800 font-bricolage">
                    <Calendar className="h-3 w-3 mr-1" />
                    {type === 'annual' ? `Annual ${prediction.reporting_year}` : `${prediction.reporting_quarter} ${prediction.reporting_year}`}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 font-bricolage">Current Default Rate</p>
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
                <div>
                  <p className="text-gray-500 font-bricolage">Confidence</p>
                  <p className="font-semibold font-bricolage">{(prediction.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <div className="space-y-4">
            {/* Company Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_symbol" className="font-bricolage">Company Symbol *</Label>
                <Input
                  id="company_symbol"
                  value={formData.company_symbol}
                  onChange={(e) => handleInputChange('company_symbol', e.target.value)}
                  placeholder="e.g., AAPL"
                  className="font-bricolage"
                />
              </div>
              <div>
                <Label htmlFor="company_name" className="font-bricolage">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="e.g., Apple Inc."
                  className="font-bricolage"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sector" className="font-bricolage">Sector *</Label>
                <Select value={formData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
                  <SelectTrigger className="font-bricolage">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((sector) => (
                      <SelectItem key={sector} value={sector} className="font-bricolage">
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="market_cap" className="font-bricolage">Market Cap (M) *</Label>
                <Input
                  id="market_cap"
                  type="number"
                  value={formData.market_cap}
                  onChange={(e) => handleInputChange('market_cap', e.target.value)}
                  placeholder="e.g., 3000000"
                  className="font-bricolage"
                />
              </div>
            </div>

            {/* Reporting Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reporting_year" className="font-bricolage">Reporting Year *</Label>
                <Select value={formData.reporting_year} onValueChange={(value) => handleInputChange('reporting_year', value)}>
                  <SelectTrigger className="font-bricolage">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024" className="font-bricolage">2024</SelectItem>
                    <SelectItem value="2023" className="font-bricolage">2023</SelectItem>
                    <SelectItem value="2022" className="font-bricolage">2022</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {type === 'quarterly' && (
                <div>
                  <Label htmlFor="reporting_quarter" className="font-bricolage">Quarter *</Label>
                  <Select value={formData.reporting_quarter} onValueChange={(value) => handleInputChange('reporting_quarter', value)}>
                    <SelectTrigger className="font-bricolage">
                      <SelectValue placeholder="Select quarter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1" className="font-bricolage">Q1</SelectItem>
                      <SelectItem value="Q2" className="font-bricolage">Q2</SelectItem>
                      <SelectItem value="Q3" className="font-bricolage">Q3</SelectItem>
                      <SelectItem value="Q4" className="font-bricolage">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Financial Ratios */}
            <div>
              <Label className="text-lg font-semibold font-bricolage">Financial Ratios</Label>
              <p className="text-sm text-gray-600 mb-4 font-bricolage">
                Updating these ratios will recalculate the prediction using the latest model.
              </p>
              
              {type === 'annual' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ltdtc" className="font-bricolage">Long-term Debt to Total Capital (%)</Label>
                    <Input
                      id="ltdtc"
                      type="number"
                      step="0.01"
                      value={formData.long_term_debt_to_total_capital}
                      onChange={(e) => handleInputChange('long_term_debt_to_total_capital', e.target.value)}
                      className="font-bricolage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="td_ebitda" className="font-bricolage">Total Debt to EBITDA</Label>
                    <Input
                      id="td_ebitda"
                      type="number"
                      step="0.01"
                      value={formData.total_debt_to_ebitda}
                      onChange={(e) => handleInputChange('total_debt_to_ebitda', e.target.value)}
                      className="font-bricolage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="net_margin" className="font-bricolage">Net Income Margin (%)</Label>
                    <Input
                      id="net_margin"
                      type="number"
                      step="0.01"
                      value={formData.net_income_margin}
                      onChange={(e) => handleInputChange('net_income_margin', e.target.value)}
                      className="font-bricolage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ebit_interest" className="font-bricolage">EBIT to Interest Expense</Label>
                    <Input
                      id="ebit_interest"
                      type="number"
                      step="0.01"
                      value={formData.ebit_to_interest_expense}
                      onChange={(e) => handleInputChange('ebit_to_interest_expense', e.target.value)}
                      className="font-bricolage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="roa" className="font-bricolage">Return on Assets (%)</Label>
                    <Input
                      id="roa"
                      type="number"
                      step="0.01"
                      value={formData.return_on_assets}
                      onChange={(e) => handleInputChange('return_on_assets', e.target.value)}
                      className="font-bricolage"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ltdtc_q" className="font-bricolage">Long-term Debt to Total Capital (%)</Label>
                    <Input
                      id="ltdtc_q"
                      type="number"
                      step="0.01"
                      value={formData.long_term_debt_to_total_capital}
                      onChange={(e) => handleInputChange('long_term_debt_to_total_capital', e.target.value)}
                      className="font-bricolage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="td_ebitda_q" className="font-bricolage">Total Debt to EBITDA</Label>
                    <Input
                      id="td_ebitda_q"
                      type="number"
                      step="0.01"
                      value={formData.total_debt_to_ebitda}
                      onChange={(e) => handleInputChange('total_debt_to_ebitda', e.target.value)}
                      className="font-bricolage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sga_margin" className="font-bricolage">SG&A Margin (%)</Label>
                    <Input
                      id="sga_margin"
                      type="number"
                      step="0.01"
                      value={formData.sga_margin}
                      onChange={(e) => handleInputChange('sga_margin', e.target.value)}
                      className="font-bricolage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="roc" className="font-bricolage">Return on Capital (%)</Label>
                    <Input
                      id="roc"
                      type="number"
                      step="0.01"
                      value={formData.return_on_capital}
                      onChange={(e) => handleInputChange('return_on_capital', e.target.value)}
                      className="font-bricolage"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUpdating}
              className="font-bricolage"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUpdating}
              className="font-bricolage"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isUpdating ? 'Updating...' : 'Update Prediction'}
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
