import { locationConfig } from "@/lib/location-config";

interface TaxBracket {
    min: number;
    max: number;
    rate: number;
}

const FEDERAL_BPA = locationConfig.federalBasicPersonalAmount;
const PROVINCIAL_BPA = locationConfig.provincialBasicPersonalAmount;

const FEDERAL_BRACKETS: TaxBracket[] = locationConfig.federalBrackets;
const PROVINCIAL_BRACKETS: TaxBracket[] = locationConfig.provincialBrackets;

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

function calculateProvincialTax(annualSalary: number): number {
    const provincialCredit = PROVINCIAL_BPA * PROVINCIAL_BRACKETS[0].rate;
    const grossTax = applyBrackets(annualSalary, PROVINCIAL_BRACKETS);
    return Math.max(0, grossTax - provincialCredit);
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
    const provincialTax = calculateProvincialTax(annualSalary);
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
    return Math.round(monthlyTakeHomeCombined * 0.33);
}
