function formatCurrency(value) {
  const isNegative = value < 0;
  const absVal = Math.abs(value);

  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(absVal);

  return isNegative ? `-${formatted}` : formatted;
}

const apiResponse = {
  bankBalanceTotal: null,
  assetsTotalValue: "NaN",
  belongingsTotalValue: {},
  receivablesOutstandingTotal: undefined,
  netWorth: 0
};

console.log("bankBalanceTotal (null):", formatCurrency(apiResponse?.bankBalanceTotal || 0));
console.log("assetsTotalValue ('NaN'):", formatCurrency(apiResponse?.assetsTotalValue || 0));
console.log("belongingsTotalValue ({}):", formatCurrency(apiResponse?.belongingsTotalValue || 0));
console.log("receivablesOutstandingTotal (undefined):", formatCurrency(apiResponse?.receivablesOutstandingTotal || 0));
console.log("netWorth (0):", formatCurrency(apiResponse?.netWorth || 0));

console.log("Just undefined:", formatCurrency(undefined));
