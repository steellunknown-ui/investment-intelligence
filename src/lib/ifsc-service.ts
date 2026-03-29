import { IFSC_REGEX } from "./financialValidationRules";

export interface IFSCDetails {
  BANK: string;
  IFSC: string;
  BRANCH: string;
  ADDRESS: string;
  CONTACT: string;
  CITY: string;
  RTGS: boolean;
  STATE: string;
  NEFT: boolean;
  IMPS: boolean;
  MICR: string;
  CENTRE: string;
  DISTRICT: string;
}

/**
 * Shared service to fetch bank details from Razorpay IFSC API.
 * This can be used in both client-side and server-side code safely.
 */
export async function getIFSCDetails(code: string): Promise<IFSCDetails | null> {
  const cleanCode = code.toUpperCase().trim();
  
  if (!IFSC_REGEX.test(cleanCode)) {
    return null;
  }

  try {
    const response = await fetch(`https://ifsc.razorpay.com/${cleanCode}`);
    
    if (response.ok) {
      return await response.json();
    }
    
    if (response.status === 404) {
      console.warn(`IFSC code not found: ${cleanCode}`);
      return null;
    }
    
    const errorText = await response.text();
    console.error(`IFSC API error (${response.status}): ${errorText}`);
    return null;
  } catch (error) {
    console.error("Failed to fetch bank details by IFSC:", error);
    return null;
  }
}
