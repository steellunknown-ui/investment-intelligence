/**
 * IFSC Utility for fetching bank details
 * Using the Razorpay IFSC API
 */

export interface BankDetails {
  BANK: string;
  BRANCH: string;
  CITY: string;
  STATE: string;
  IFSC: string;
}

export async function fetchBankDetailsByIFSC(ifsc: string): Promise<BankDetails | null> {
    try {
        const response = await fetch(`/api/banking/ifsc/${ifsc.toUpperCase()}`);
        
        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch IFSC details');
        }

        const data = await response.json();
        return data as BankDetails;
    } catch (error) {
        console.error('IFSC lookup error:', error);
        return null;
    }
}
