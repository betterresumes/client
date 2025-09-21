// Test the validation logic with your CSV content
const csvContent = `company_symbol,company_name,sector,market_cap,revenue,reporting_year,long_term_debt_to_total_capital,total_debt_to_ebitda,net_income_margin,ebit_to_interest_expense,return_on_assets
VERIFY14,Verification Company 1,Technology,1500000000,750000000,2024,28.5,2.1,14.0,9.2,8.5
VERIFY15,Verification Company 2,Retail,800000000,400000000,2024,32.1,1.9,11.5,7.8,6.9
VERIFY16,Verification Company 3,Manufacturing,2200000000,1100000000,2024,26.8,2.4,13.2,8.9,9.1`;

const lines = csvContent.split('\n').filter(line => line.trim() !== '');
console.log('Number of lines:', lines.length);

const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
console.log('Headers found:', headers);

const requiredHeaders = ['company_symbol', 'reporting_year'];
console.log('Required headers:', requiredHeaders);

const missingHeaders = requiredHeaders.filter(req => 
  !headers.some(h => h === req || h.includes(req.replace('_', '')))
);

console.log('Missing headers:', missingHeaders);
console.log('Validation result:', missingHeaders.length === 0 ? 'VALID' : 'INVALID');
