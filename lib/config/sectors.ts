export const SECTORS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Cyclical',
  'Industrials',
  'Communication Services',
  'Consumer Defensive',
  'Energy',
  'Utilities',
  'Real Estate',
  'Basic Materials'
] as const

export type Sector = typeof SECTORS[number]

// Sample data for form testing
export const SAMPLE_DATA = {
  annual: {
    stockSymbol: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Technology',
    marketCap: '3000000',
    reportingYear: '2024',
    reportingQuarter: 'Q4',
    ebitInterestExpense: '15.80',
    totalDebtEbitda: '2.10',
    returnOnAssets: '12.50',
    netIncomeMargin: '25.30',
    longTermDebtTotalCapital: '18.75'
  },
  quarterly: {
    stockSymbol: 'TSLA',
    companyName: 'Tesla Inc.',
    sector: 'Consumer Cyclical',
    marketCap: '800000',
    reportingYear: '2024',
    reportingQuarter: 'Q3',
    totalDebtEbitda: '1.85',
    sgaMargin: '12.40',
    returnOnCapital: '22.60',
    longTermDebtTotalCapital: '15.20'
  }
}
