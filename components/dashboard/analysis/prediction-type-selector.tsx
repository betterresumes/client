'use client'

interface PredictionTypeSelectorProps {
  predictionType: 'annual' | 'quarterly'
  onTypeChange: (type: 'annual' | 'quarterly') => void
  title?: string
  className?: string
}

export function PredictionTypeSelector({
  predictionType,
  onTypeChange,
  title = "Select Prediction Model",
  className = ""
}: PredictionTypeSelectorProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <div className="flex space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="predictionType"
            value="annual"
            checked={predictionType === 'annual'}
            onChange={(e) => onTypeChange(e.target.value as 'annual' | 'quarterly')}
            className="text-blue-600"
          />
          <span className="text-sm font-medium">📅 Annual Model (5 ratios)</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="predictionType"
            value="quarterly"
            checked={predictionType === 'quarterly'}
            onChange={(e) => onTypeChange(e.target.value as 'annual' | 'quarterly')}
            className="text-blue-600"
          />
          <span className="text-sm font-medium">📊 Quarterly Model (4 ratios)</span>
        </label>
      </div>
    </div>
  )
}
