// Interest calculation utilities
export function calculateSimpleInterest(
  principal: number,
  rate: number,
  startDate: string,
  endDate?: string
): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  return (principal * rate * days) / (365 * 100);
}

export function calculateCompoundInterest(
  principal: number,
  rate: number,
  startDate: string,
  endDate?: string
): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const months = Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
  if (months === 0) return 0;
  return principal * (Math.pow(1 + rate / 1200, months) - 1);
}

export function calculateInterest(
  principal: number,
  rate: number,
  type: "simple" | "compound",
  startDate: string,
  endDate?: string
): number {
  if (!rate || rate <= 0) return 0;
  
  return type === "compound" 
    ? calculateCompoundInterest(principal, rate, startDate, endDate)
    : calculateSimpleInterest(principal, rate, startDate, endDate);
}

export function getInterestPreview(
  principal: number,
  rate: number,
  type: "simple" | "compound",
  startDate: string,
  endDate?: string
): { interest: number; total: number; days?: number; months?: number } {
  const interest = calculateInterest(principal, rate, type, startDate, endDate);
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  if (type === "compound") {
    const months = Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
    return { interest, total: principal + interest, months };
  } else {
    const days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return { interest, total: principal + interest, days };
  }
}