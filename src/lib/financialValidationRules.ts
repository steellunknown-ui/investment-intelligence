/**
 * Financial Validation Rules for Banking and Insurance Modules
 * This file contains business logic for validating account numbers and policy numbers
 * based on the selected financial institution.
 */

export interface ValidationRule {
  min?: number;
  max?: number;
  length?: number;
  regex?: RegExp;
}

// Banking Account Number Rules (Length validation)
// Source: User provided ranges for over 30 Indian banks
export const bankAccountRules: Record<string, ValidationRule> = {
  "State Bank of India (SBI)": { min: 11, max: 17 },
  "HDFC Bank": { min: 10, max: 16 },
  "ICICI Bank": { min: 12, max: 16 },
  "Axis Bank": { min: 9, max: 18 },
  "Kotak Mahindra Bank": { min: 10, max: 14 },
  "Punjab National Bank (PNB)": { min: 9, max: 18 },
  "Bank of Baroda": { min: 9, max: 18 },
  "Canara Bank": { min: 9, max: 18 },
  "Union Bank of India": { min: 9, max: 18 },
  "Indian Bank": { min: 9, max: 18 },
  "Central Bank of India": { min: 9, max: 18 },
  "Bank of India": { min: 9, max: 18 },
  "Indian Overseas Bank": { min: 9, max: 18 },
  "UCO Bank": { min: 9, max: 18 },
  "Punjab & Sind Bank": { min: 9, max: 18 },
  "IDFC First Bank": { min: 11, max: 18 },
  "Yes Bank": { min: 10, max: 18 },
  "IndusInd Bank": { min: 10, max: 18 },
  "Federal Bank": { min: 10, max: 16 },
  "South Indian Bank": { min: 10, max: 16 },
  "Karur Vysya Bank": { min: 10, max: 16 },
  "Tamilnad Mercantile Bank": { min: 10, max: 16 },
  "City Union Bank": { min: 10, max: 16 },
  "Dhanlaxmi Bank": { min: 10, max: 16 },
  "RBL Bank": { min: 10, max: 16 },
  "Bandhan Bank": { min: 10, max: 16 },
  "ESAF Small Finance Bank": { min: 10, max: 16 },
  "Equitas Small Finance Bank": { min: 10, max: 16 },
  "Jana Small Finance Bank": { min: 10, max: 16 },
  "Ujjivan Small Finance Bank": { min: 10, max: 16 },
};

// Insurance Policy Number Rules
// Keys matched with presets.ts
export const insurancePolicyRules: Record<string, ValidationRule> = {
  "Life Insurance Corporation of India (LIC)": { length: 10, regex: /^\d{10}$/ },
  "HDFC Life": { min: 8, max: 12 },
  "ICICI Prudential Life": { min: 8, max: 16 },
  "SBI Life": { min: 9, max: 15 },
  "Bajaj Allianz Life": { min: 8, max: 16 },
  "Max Life Insurance": { min: 8, max: 14 },
  "Aditya Birla Sun Life": { min: 8, max: 16 },
  "Tata AIA Life Insurance": { min: 8, max: 16 },
  "PNB MetLife": { min: 8, max: 16 },
  "Kotak Mahindra Life": { min: 8, max: 14 },
  "Canara HSBC OBC Life": { min: 8, max: 14 },
  "Aegon Life": { min: 8, max: 14 },
  "Aviva Life Insurance": { min: 8, max: 14 },
  "Bharti AXA Life": { min: 8, max: 14 },
  "Future Generali Life": { min: 8, max: 14 },
  
  // General Insurance
  "HDFC ERGO General Insurance": { min: 8, max: 20 },
  "ICICI Lombard General Insurance": { min: 8, max: 20 },
  "Bajaj Allianz General Insurance": { min: 8, max: 20 },
  "New India Assurance": { min: 8, max: 20 },
  "Oriental Insurance": { min: 8, max: 20 },
  "United India Insurance": { min: 8, max: 20 },
  "National Insurance": { min: 8, max: 20 },
  "IFFCO Tokio General Insurance": { min: 8, max: 20 },
  "Cholamandalam MS General Insurance": { min: 8, max: 20 },
  "Future Generali General Insurance": { min: 8, max: 20 },
  "Reliance General Insurance": { min: 8, max: 20 },
  "Royal Sundaram General Insurance": { min: 8, max: 20 },
  "Tata AIG General Insurance": { min: 8, max: 20 },
  "Universal Sompo General Insurance": { min: 8, max: 20 },
  "Digit General Insurance": { min: 8, max: 20 },
  "Go Digit General Insurance": { min: 8, max: 20 },
  "Acko General Insurance": { min: 8, max: 20 },

  // Health Insurance
  "Care Health Insurance": { min: 8, max: 20 },
  "Star Health and Allied Insurance": { min: 8, max: 20 },
  "Niva Bupa Health Insurance": { min: 8, max: 20 },
  "Manipal Cigna Health Insurance": { min: 8, max: 20 },
  "Aditya Birla Health Insurance": { min: 8, max: 20 },
};

export const DEFAULT_INSURANCE_RULE: ValidationRule = { min: 8, max: 20 };

/**
 * Validates a bank account number based on the bank name
 */
export function validateBankAccountNumber(bankName: string, accountNumber: string): { isValid: boolean; error?: string } {
  if (accountNumber.length > 0 && !/^\d+$/.test(accountNumber)) {
    return { isValid: false, error: "Account number must contain digits only." };
  }

  const rule = bankAccountRules[bankName];
  if (!rule) return { isValid: true };

  const len = accountNumber.length;
  // If user has started typing, validate length
  if (len > 0) {
    if (rule.min && len < rule.min) {
      return { isValid: false, error: "account no. is not meeting the scenario" };
    }
    if (rule.max && len > rule.max) {
      return { isValid: false, error: "account no. is invalid" };
    }
  }

  return { isValid: true };
}

/**
 * Validates an insurance policy number based on the provider name
 */
export function validateInsurancePolicyNumber(providerName: string, policyNumber: string): { isValid: boolean; error?: string } {
  const rule = insurancePolicyRules[providerName] || DEFAULT_INSURANCE_RULE;
  
  const len = policyNumber.length;
  if (len > 0) {
    if (rule.length && len !== rule.length) {
      return { isValid: false, error: "Invalid policy number format for selected provider." };
    }
    if ((rule.min && len < rule.min) || (rule.max && len > rule.max)) {
      return { isValid: false, error: "Invalid policy number format for selected provider." };
    }
    if (rule.regex && !rule.regex.test(policyNumber)) {
      return { isValid: false, error: "Invalid policy number format for selected provider." };
    }
  }

  return { isValid: true };
}

export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
