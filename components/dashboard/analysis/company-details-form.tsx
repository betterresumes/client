'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CompanyDetailsFormProps {
  formData: {
    stockSymbol: string
    marketCap: string
    companyName: string
    sector: string
    reportingYear: string
    reportingQuarter: string
  }
  predictionType: 'annual' | 'quarterly'
  onInputChange: (field: string, value: string) => void
}

export function CompanyDetailsForm({ formData, predictionType, onInputChange }: CompanyDetailsFormProps) {
  return (
    <div className="space-y-4 mb-6">
      <h4 className="font-medium text-gray-900 dark:text-white">Company Details</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stockSymbol">Stock Symbol *</Label>
          <Input
            id="stockSymbol"
            placeholder="e.g., NEWCO"
            value={formData.stockSymbol}
            onChange={(e) => onInputChange('stockSymbol', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="marketCap">Market Cap (Millions) *</Label>
          <Input
            id="marketCap"
            placeholder="e.g., 1000"
            value={formData.marketCap}
            onChange={(e) => onInputChange('marketCap', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          placeholder="e.g., New Company Inc."
          value={formData.companyName}
          onChange={(e) => onInputChange('companyName', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="sector">Sector *</Label>
        <Select value={formData.sector} onValueChange={(value) => onInputChange('sector', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="healthcare">Health Care</SelectItem>
            <SelectItem value="financials">Financials</SelectItem>
            <SelectItem value="energy">Energy</SelectItem>
            <SelectItem value="consumer">Consumer Discretionary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reportingYear">Reporting Year *</Label>
          <Input
            id="reportingYear"
            placeholder="e.g., 2024"
            value={formData.reportingYear}
            onChange={(e) => onInputChange('reportingYear', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="reportingQuarter">
            Reporting Quarter {predictionType === 'quarterly' ? '*' : '(Optional)'}
          </Label>
          <Select
            value={formData.reportingQuarter}
            onValueChange={(value) => onInputChange('reportingQuarter', value)}
            required={predictionType === 'quarterly'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select quarter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1">Q1</SelectItem>
              <SelectItem value="Q2">Q2</SelectItem>
              <SelectItem value="Q3">Q3</SelectItem>
              <SelectItem value="Q4">Q4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
