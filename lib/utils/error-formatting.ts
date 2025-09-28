/**
 * Utility functions for formatting API error messages into user-friendly messages
 */

export function formatPredictionErrorMessage(rawMessage: string): string {
  if (!rawMessage) return 'An unexpected error occurred. Please try again.'

  // Handle duplicate prediction errors (system, global, and organization scope)
  if (rawMessage.includes('already exists in your') && (rawMessage.includes('system scope') || rawMessage.includes('global scope') || rawMessage.includes('organization scope'))) {
    // Pattern for annual predictions: "Annual prediction for AAPL in 2024 Q4 already exists in your [system/global/organization] scope"
    const annualMatch = rawMessage.match(/Annual prediction for ([A-Z]+) in (\d{4}) Q(\d) already exists in your (?:system|global|organization) scope/)
    if (annualMatch) {
      const [, symbol, year, quarter] = annualMatch
      return `An annual prediction for ${symbol} already exists for ${year} Q${quarter}. Please try a different company or time period.`
    }

    // Pattern for quarterly predictions: "Quarterly prediction for AAPL in 2024 Q4 already exists in your [system/global/organization] scope"
    const quarterlyMatch = rawMessage.match(/Quarterly prediction for ([A-Z]+) in (\d{4}) Q(\d) already exists in your (?:system|global|organization) scope/)
    if (quarterlyMatch) {
      const [, symbol, year, quarter] = quarterlyMatch
      return `A quarterly prediction for ${symbol} already exists for ${year} Q${quarter}. Please try a different company or time period.`
    }

    // Fallback for other duplicate prediction patterns
    const generalMatch = rawMessage.match(/(\w+) prediction for ([A-Z]+) .* already exists/)
    if (generalMatch) {
      const [, type, symbol] = generalMatch
      return `A ${type.toLowerCase()} prediction for ${symbol} already exists. Please try a different company or time period.`
    }

    // Even more generic fallback for "already exists" messages
    if (rawMessage.includes('already exists')) {
      return 'This prediction already exists. Please try a different company or time period.'
    }
  }

  // Handle server connection errors
  if (rawMessage.toLowerCase().includes('network error') || rawMessage.toLowerCase().includes('connection failed')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.'
  }

  // Handle server errors
  if (rawMessage.toLowerCase().includes('internal server error') || rawMessage.toLowerCase().includes('500')) {
    return 'The server encountered an error. Please try again in a few moments.'
  }

  // Handle timeout errors
  if (rawMessage.toLowerCase().includes('timeout') || rawMessage.toLowerCase().includes('request took too long')) {
    return 'The request is taking longer than expected. Please try again.'
  }

  // Handle validation errors
  if (rawMessage.toLowerCase().includes('validation')) {
    return 'Please check your input data. Some fields may have invalid values.'
  }

  if (rawMessage.toLowerCase().includes('unauthorized')) {
    return 'You are not authorized to perform this action. Please check your permissions.'
  }

  if (rawMessage.toLowerCase().includes('not found')) {
    return 'The requested resource was not found. Please try again.'
  }

  if (rawMessage.toLowerCase().includes('insufficient funds') || rawMessage.toLowerCase().includes('quota')) {
    return 'You have reached your usage limit. Please upgrade your plan or contact support.'
  }

  if (rawMessage.toLowerCase().includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.'
  }

  // Return original message if no specific pattern matched, but limit length
  return rawMessage.length > 100 ? rawMessage.substring(0, 100) + '...' : rawMessage
}

/**
 * Extract error message from API response with proper fallback
 */
export function extractErrorMessage(error: any, fallbackMessage: string): string {
  return error?.response?.data?.detail || error?.message || fallbackMessage
}

/**
 * Format and extract error message in one function
 */
export function formatApiError(error: any, fallbackMessage: string): string {
  const rawMessage = extractErrorMessage(error, fallbackMessage)
  return formatPredictionErrorMessage(rawMessage)
}
