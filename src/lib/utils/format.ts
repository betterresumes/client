/**
 * Formatting utilities for numbers, dates, and financial data
 */

// Number formatting
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${formatNumber(value * 100, decimals)}%`
}

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `$${formatNumber(value / 1e12, 1)}T`
  } else if (value >= 1e9) {
    return `$${formatNumber(value / 1e9, 1)}B`
  } else if (value >= 1e6) {
    return `$${formatNumber(value / 1e6, 1)}M`
  } else if (value >= 1e3) {
    return `$${formatNumber(value / 1e3, 1)}K`
  }
  return formatCurrency(value)
}

// Date formatting
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return formatDate(date)
}

// Risk formatting
export function formatRiskScore(probability: number): string {
  return formatPercentage(probability, 2)
}

// File size formatting
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${formatNumber(bytes / Math.pow(1024, i), 1)} ${sizes[i]}`
}

// Progress formatting
export function formatProgress(current: number, total: number): string {
  if (total === 0) return '0%'
  return formatPercentage(current / total, 0)
}
