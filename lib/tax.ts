// BC + Federal tax calculation (2025 brackets as proxy for 2026)
// CPP/EI excluded — this is an estimate

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

const FEDERAL_BPA = 16129;
const BC_BPA = 12580;

const FEDERAL_BRACKETS: TaxBracket[] = [
  { min: 0, max: 57375, rate: 0.15 },
  { min: 57375, max: 114750, rate: 0.205 },
  { min: 114750, max: 158468, rate: 0.26 },
  { min: 158468, max: 220000, rate: 0.29 },
  { min: 220000, max: Infinity, rate: 0.33 },
];

const BC_BRACKETS: TaxBracket[] = [
  { min: 0, max: 47937, rate: 0.0506 },
  { min: 47937, max: 95875, rate: 0.077 },
  { min: 95875, max: 110076, rate: 0.105 },
  { min: 110076, max: 133664, rate: 0.1229 },
  { min: 133664, max: 181232, rate: 0.147 },
  { min: 181232, max: Infinity, rate: 0.168 },
];

function applyBrackets(income: number, brackets: TaxBracket[]): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (income <= bracket.min) break;
    const taxable = Math.min(income, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return Math.max(0, tax);
}

function calculateFederalTax(annualSalary: number): number {
  const federalCredit = FEDERAL_BPA * 0.15;
  const grossTax = applyBrackets(annualSalary, FEDERAL_BRACKETS);
  return Math.max(0, grossTax - federalCredit);
}

function calculateBCTax(annualSalary: number): number {
  const bcCredit = BC_BPA * 0.0506;
  const grossTax = applyBrackets(annualSalary, BC_BRACKETS);
  return Math.max(0, grossTax - bcCredit);
}

export interface TakeHomeResult {
  federalTax: number;
  provincialTax: number;
  totalTax: number;
  annualTakeHome: number;
  monthlyTakeHome: number;
}

export function calculateTakeHome(annualSalary: number): TakeHomeResult {
  const federalTax = calculateFederalTax(annualSalary);
  const provincialTax = calculateBCTax(annualSalary);
  const totalTax = federalTax + provincialTax;
  const annualTakeHome = annualSalary - totalTax;
  const monthlyTakeHome = Math.round(annualTakeHome / 12);

  return {
    federalTax: Math.round(federalTax),
    provincialTax: Math.round(provincialTax),
    totalTax: Math.round(totalTax),
    annualTakeHome: Math.round(annualTakeHome),
    monthlyTakeHome,
  };
}

export function calculateAffordableRent(
  monthlyTakeHomeCombined: number,
): number {
  return Math.round(monthlyTakeHomeCombined * 0.3);
}
