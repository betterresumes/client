'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FinancialRatiosFormProps {
  formData: {
    ebitInterestExpense: string
    totalDebtEbitda: string
    returnOnAssets: string
    netIncomeMargin: string
    longTermDebtTotalCapital: string
    sgaMargin: string
    returnOnCapital: string
  }
  predictionType: 'annual' | 'quarterly'
  onInputChange: (field: string, value: string) => void
}

export function FinancialRatiosForm({ formData, predictionType, onInputChange }: FinancialRatiosFormProps) {
  return (
    <div className="space-y-4 mb-6">
      <h4 className="font-medium text-gray-900 dark:text-white">
        Financial Ratios {predictionType === 'annual' ? '(5 ratios)' : '(4 ratios)'}
      </h4>

      {/* Common ratios for both models */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="longTermDebtTotalCapital">Long Term Debt/Total Capital</Label>
          <Input
            id="longTermDebtTotalCapital"
            type="number"
            step="0.01"
            placeholder="e.g., 0.25"
            value={formData.longTermDebtTotalCapital}
            onChange={(e) => onInputChange('longTermDebtTotalCapital', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="totalDebtEbitda">Total Debt/EBITDA</Label>
          <Input
            id="totalDebtEbitda"
            type="number"
            step="0.01"
            placeholder="e.g., 3.5"
            value={formData.totalDebtEbitda}
            onChange={(e) => onInputChange('totalDebtEbitda', e.target.value)}
          />
        </div>
      </div>

      {/* Annual-specific ratios */}
      {predictionType === 'annual' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="netIncomeMargin">Net Income Margin</Label>
            <Input
              id="netIncomeMargin"
              type="number"
              step="0.01"
              placeholder="e.g., 0.15"
              value={formData.netIncomeMargin}
              onChange={(e) => onInputChange('netIncomeMargin', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ebitInterestExpense">EBIT/Interest Expense</Label>
            <Input
              id="ebitInterestExpense"
              type="number"
              step="0.01"
              placeholder="e.g., 8.5"
              value={formData.ebitInterestExpense}
              onChange={(e) => onInputChange('ebitInterestExpense', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="returnOnAssets">Return on Assets</Label>
            <Input
              id="returnOnAssets"
              type="number"
              step="0.01"
              placeholder="e.g., 0.08"
              value={formData.returnOnAssets}
              onChange={(e) => onInputChange('returnOnAssets', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Quarterly-specific ratios */}
      {predictionType === 'quarterly' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sgaMargin">SG&A Margin</Label>
            <Input
              id="sgaMargin"
              type="number"
              step="0.01"
              placeholder="e.g., 0.20"
              value={formData.sgaMargin}
              onChange={(e) => onInputChange('sgaMargin', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="returnOnCapital">Return on Capital</Label>
            <Input
              id="returnOnCapital"
              type="number"
              step="0.01"
              placeholder="e.g., 0.12"
              value={formData.returnOnCapital}
              onChange={(e) => onInputChange('returnOnCapital', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
