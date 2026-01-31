/**
 * Credit Score Calculation Library
 * Simulates credit score based on user's financial data
 * Range: 300-850 (similar to CIBIL/FICO)
 */

export interface CreditScoreFactors {
    // From financial data
    totalLiabilities: number;
    totalAssets: number;
    bankBalance: number;

    // From credit profile
    monthlyIncome: number;
    existingCreditCards: number;
    totalCreditLimit: number;
    creditUtilization: number;
    hasMissedPayments: boolean;
    missedPaymentsCount: number;
    oldestAccountYears: number;
}

export interface CreditScoreResult {
    score: number;
    rating: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
    ratingColor: string;
    breakdown: {
        debtToIncomeScore: number;
        paymentHistoryScore: number;
        creditUtilizationScore: number;
        accountAgeScore: number;
        diversificationScore: number;
    };
}

export interface LoanEligibility {
    type: 'home_loan' | 'personal_loan' | 'credit_card';
    eligible: boolean;
    maxAmount: number;
    reasons: string[];
    interestRateRange: string;
}

/**
 * Calculate credit score based on financial factors
 */
export function calculateCreditScore(factors: CreditScoreFactors): CreditScoreResult {
    const {
        totalLiabilities,
        totalAssets,
        bankBalance,
        monthlyIncome,
        hasMissedPayments,
        missedPaymentsCount,
        creditUtilization,
        oldestAccountYears,
        existingCreditCards
    } = factors;

    // 1. Debt-to-Income Ratio (35% weight)
    const annualIncome = monthlyIncome * 12;
    const dti = annualIncome > 0 ? (totalLiabilities / annualIncome) * 100 : 100;
    let debtToIncomeScore = 0;
    if (dti <= 20) debtToIncomeScore = 100;
    else if (dti <= 35) debtToIncomeScore = 80;
    else if (dti <= 50) debtToIncomeScore = 60;
    else if (dti <= 75) debtToIncomeScore = 40;
    else debtToIncomeScore = 20;

    // 2. Payment History (25% weight)
    let paymentHistoryScore = 100;
    if (hasMissedPayments) {
        paymentHistoryScore = Math.max(20, 100 - (missedPaymentsCount * 15));
    }

    // 3. Credit Utilization (20% weight)
    let creditUtilizationScore = 0;
    if (creditUtilization <= 10) creditUtilizationScore = 100;
    else if (creditUtilization <= 30) creditUtilizationScore = 85;
    else if (creditUtilization <= 50) creditUtilizationScore = 65;
    else if (creditUtilization <= 75) creditUtilizationScore = 40;
    else creditUtilizationScore = 20;

    // 4. Account Age (10% weight)
    let accountAgeScore = 0;
    if (oldestAccountYears >= 10) accountAgeScore = 100;
    else if (oldestAccountYears >= 7) accountAgeScore = 85;
    else if (oldestAccountYears >= 5) accountAgeScore = 70;
    else if (oldestAccountYears >= 3) accountAgeScore = 55;
    else if (oldestAccountYears >= 1) accountAgeScore = 40;
    else accountAgeScore = 25;

    // 5. Credit Mix/Diversification (10% weight)
    const hasAssets = totalAssets > 0;
    const hasSavings = bankBalance > 0;
    const hasCredit = existingCreditCards > 0;
    let diversificationScore = 0;
    if (hasAssets) diversificationScore += 35;
    if (hasSavings) diversificationScore += 35;
    if (hasCredit) diversificationScore += 30;

    // Calculate weighted score (0-100)
    const weightedScore = (
        debtToIncomeScore * 0.35 +
        paymentHistoryScore * 0.25 +
        creditUtilizationScore * 0.20 +
        accountAgeScore * 0.10 +
        diversificationScore * 0.10
    );

    // Convert to 300-850 range
    const score = Math.round(300 + (weightedScore / 100) * 550);

    // Determine rating
    let rating: CreditScoreResult['rating'];
    let ratingColor: string;
    if (score >= 750) { rating = 'Excellent'; ratingColor = '#22c55e'; }
    else if (score >= 700) { rating = 'Very Good'; ratingColor = '#84cc16'; }
    else if (score >= 650) { rating = 'Good'; ratingColor = '#eab308'; }
    else if (score >= 550) { rating = 'Fair'; ratingColor = '#f97316'; }
    else { rating = 'Poor'; ratingColor = '#ef4444'; }

    return {
        score,
        rating,
        ratingColor,
        breakdown: {
            debtToIncomeScore,
            paymentHistoryScore,
            creditUtilizationScore,
            accountAgeScore,
            diversificationScore
        }
    };
}

/**
 * Calculate loan eligibility based on credit score and financials
 */
export function calculateEligibility(
    score: number,
    monthlyIncome: number,
    totalLiabilities: number
): LoanEligibility[] {
    const results: LoanEligibility[] = [];
    const annualIncome = monthlyIncome * 12;
    const dti = annualIncome > 0 ? (totalLiabilities / annualIncome) * 100 : 100;

    // Home Loan Eligibility
    const homeLoanReasons: string[] = [];
    let homeLoanEligible = true;
    let homeLoanMax = 0;

    if (score < 650) { homeLoanEligible = false; homeLoanReasons.push('Credit score below 650'); }
    if (dti > 40) { homeLoanEligible = false; homeLoanReasons.push('Debt-to-income ratio above 40%'); }
    if (annualIncome < 300000) { homeLoanEligible = false; homeLoanReasons.push('Annual income below ₹3,00,000'); }

    if (homeLoanEligible) {
        homeLoanMax = Math.max(0, (monthlyIncome * 60) - totalLiabilities);
        homeLoanReasons.push(`Based on 60x monthly income minus existing debt`);
    }

    results.push({
        type: 'home_loan',
        eligible: homeLoanEligible,
        maxAmount: homeLoanMax,
        reasons: homeLoanReasons,
        interestRateRange: score >= 750 ? '8.5% - 9.0%' : score >= 700 ? '9.0% - 9.5%' : '9.5% - 10.5%'
    });

    // Personal Loan Eligibility
    const personalLoanReasons: string[] = [];
    let personalLoanEligible = true;
    let personalLoanMax = 0;

    if (score < 600) { personalLoanEligible = false; personalLoanReasons.push('Credit score below 600'); }
    if (dti > 50) { personalLoanEligible = false; personalLoanReasons.push('Debt-to-income ratio above 50%'); }
    if (annualIncome < 200000) { personalLoanEligible = false; personalLoanReasons.push('Annual income below ₹2,00,000'); }

    if (personalLoanEligible) {
        personalLoanMax = monthlyIncome * 20;
        personalLoanReasons.push(`Based on 20x monthly income`);
    }

    results.push({
        type: 'personal_loan',
        eligible: personalLoanEligible,
        maxAmount: personalLoanMax,
        reasons: personalLoanReasons,
        interestRateRange: score >= 750 ? '10% - 12%' : score >= 700 ? '12% - 14%' : '14% - 18%'
    });

    // Credit Card Eligibility
    const ccReasons: string[] = [];
    let ccEligible = true;
    let ccMax = 0;

    if (score < 550) { ccEligible = false; ccReasons.push('Credit score below 550'); }
    if (annualIncome < 180000) { ccEligible = false; ccReasons.push('Annual income below ₹1,80,000'); }

    if (ccEligible) {
        ccMax = monthlyIncome * 3;
        ccReasons.push(`Recommended limit: 3x monthly income`);
    }

    results.push({
        type: 'credit_card',
        eligible: ccEligible,
        maxAmount: ccMax,
        reasons: ccReasons,
        interestRateRange: 'N/A (pay in full to avoid 24-42% APR)'
    });

    return results;
}
