// =====================================================
// QUICK PICK PRESETS (INDIA FOCUSED) - PERSONAL FINANCE VAULT
// Modules: Assets, Liabilities, Belongings, Receivables, Documents, Trading
// =====================================================

export const assetCategories = ["Movable","Immovable"];

export const assetTypes = [
  "Residential Property","Commercial Property","Plot / Land","Farm Land","Shop / Office",
  "Flat / Apartment","House / Villa",
  "Car","Bike / Motorcycle","Scooter","Truck / Commercial Vehicle","Electric Vehicle (EV)",
  "Gold","Silver","Diamond","Jewelry","Coins (Gold/Silver)","Bullion","Watches (Luxury)",
  "Laptop","Mobile Phone","Tablet","TV","Camera","Gaming Console",
  "Business Ownership","Partnership Share","Agricultural Equipment","Machinery",
  "Furniture","Art / Paintings","Antiques","Collectibles"
];

export const ownershipTypes = ["Sole","Joint","Inherited"];
export const assetStatus = ["Owned","Sold","Transferred","Disputed"];

export const liabilityTypes = [
  "Home Loan","Car Loan","Bike Loan","Personal Loan","Education Loan","Business Loan",
  "Gold Loan","Loan Against Property","Credit Card","Consumer Durable Loan (EMI)",
  "Medical Loan","Pay Later / BNPL","Borrowed from Friend","Borrowed from Relative"
];

export const lenderTypes = ["Bank","NBFC","Private","Relative","Friend","Employer"];
export const liabilityStatus = ["Active","Closed","Defaulted","Restructured"];

export const paymentModes = [
  "Cash","Cheque","Online Transfer","UPI","Net Banking","Auto Debit","Card Payment"
];

export const belongingCategories = [
  "Jewelry","Watches","Electronics","Collectibles","Art","Antiques",
  "Designer Items","Sports Equipment","Documents","Cash (Physical)","Other"
];

export const belongingStatus = [
  "In Possession","In Locker","Given Away","Sold","Lost","Stolen"
];

export const storageLocations = [
  "Home","Home Safe","Bank Locker","Office","Parents House",
  "Relative House","Storage Unit","Other"
];

export const receivableRelationships = [
  "Friend","Relative","Cousin","Brother/Sister","Colleague","Employee",
  "Customer","Business Partner","Tenant","Vendor","Other"
];

export const receivablePurposes = [
  "Emergency Help","Loan","Rent","Business Payment","Personal Need",
  "Medical Expense","Education Fee","Travel","Shopping","Other"
];

export const receivableStatus = [
  "Pending","Partial","Received","Written Off","Disputed"
];

export const interestTypes = ["Simple","Compound"];

export const documentTypes = [
  "ID Proof","Banking","Insurance","Property","Vehicle","Tax",
  "Education","Medical","Loan","Agreement","Other"
];

export const indianDocuments = [
  "Aadhaar Card","PAN Card","Voter ID (EPIC)","Passport","Driving License",
  "Birth Certificate","Domicile Certificate","Caste Certificate",
  "Income Certificate","Residence Certificate",
  "Marriage Certificate","Divorce Decree","Death Certificate",
  "Family ID / Parivar Pehchan Patra","Medical Records",
  "Vaccination Certificate","Disability Certificate",
  "School ID Card","College/University ID Card","Marksheet (10th)",
  "Marksheet (12th)","Degree Certificate","Transfer Certificate (TC)",
  "Bonafide Certificate","Migration Certificate",
  "Bank Passbook","Bank Statement","Cancelled Cheque","Cheque Book Copy",
  "Debit Card","Credit Card","UPI ID Screenshot","Loan Agreement",
  "EMI Schedule","Credit Report (CIBIL)","Fixed Deposit Receipt (FD)",
  "Recurring Deposit Receipt (RD)","Mutual Fund Statement",
  "Demat Account Statement",
  "ITR Acknowledgement","Form 16","GST Registration Certificate",
  "TDS Certificate",
  "Property Registry / Sale Deed","Rent Agreement","Electricity Bill",
  "Water Bill","Gas Bill",
  "Vehicle RC","Vehicle Insurance Policy","PUC Certificate",
  "Ration Card","Police Verification Certificate","Insurance Policy Document"
];

export const tradingExchanges = ["NSE","BSE","MCX","NASDAQ","NYSE","Crypto Exchange","FOREX"];

export const investmentTypes = ["Equity","Mutual Fund","ETF","Bond","Derivative","Commodity","Crypto"];

export const popularBrokersIndia = [
  "Zerodha","Upstox","Groww","Angel One","ICICI Direct","HDFC Securities",
  "Kotak Securities","Sharekhan","Motilal Oswal","5paisa","Paytm Money",
  "Dhan","Fyers","Axis Direct","SBI Securities"
];

// Banking presets
export const bankNames = [
  "State Bank of India (SBI)","HDFC Bank","ICICI Bank","Axis Bank","Kotak Mahindra Bank",
  "Punjab National Bank (PNB)","Bank of Baroda","Canara Bank","Union Bank of India",
  "Indian Bank","Central Bank of India","Bank of India","Indian Overseas Bank",
  "UCO Bank","Punjab & Sind Bank","IDFC First Bank","Yes Bank","IndusInd Bank",
  "Federal Bank","South Indian Bank","Karur Vysya Bank","Tamilnad Mercantile Bank",
  "City Union Bank","Dhanlaxmi Bank","RBL Bank","Bandhan Bank","ESAF Small Finance Bank",
  "Equitas Small Finance Bank","Jana Small Finance Bank","Ujjivan Small Finance Bank"
];

// Insurance presets
export const insuranceProviders = [
  "Life Insurance Corporation of India (LIC)","HDFC Life","ICICI Prudential Life",
  "SBI Life","Bajaj Allianz Life","Max Life Insurance","Aditya Birla Sun Life",
  "Tata AIA Life Insurance","PNB MetLife","Kotak Mahindra Life","Canara HSBC OBC Life",
  "Aegon Life","Aviva Life Insurance","Bharti AXA Life","Future Generali Life",
  "HDFC ERGO General Insurance","ICICI Lombard General Insurance","Bajaj Allianz General Insurance",
  "New India Assurance","Oriental Insurance","United India Insurance","National Insurance",
  "IFFCO Tokio General Insurance","Cholamandalam MS General Insurance","Future Generali General Insurance",
  "Reliance General Insurance","Royal Sundaram General Insurance","Tata AIG General Insurance",
  "Universal Sompo General Insurance","Digit General Insurance","Go Digit General Insurance",
  "Acko General Insurance","Care Health Insurance","Star Health and Allied Insurance",
  "Niva Bupa Health Insurance","Manipal Cigna Health Insurance","Aditya Birla Health Insurance"
];

// Common Note Presets for Categorization
export const assetNotes = ["Owned", "Gifted", "Inherited", "In Spouse Name", "Under Dispute", "Sold - Pending Registration", "Transferred"];
export const liabilityNotes = ["Automatic Debit", "Manual Payment", "Principal Pending", "Interest Only Payment", "Top-up Loan Eligible", "Secured", "Unsecured"];
export const belongingNotes = ["In Home Safe", "In Bank Locker", "At Parent's Place", "With Relative", "Daily Use", "Investment Only", "Damaged"];
export const receivableNotes = ["Interest Free", "Monthly Interest", "Quarterly Interest", "Due Date Fixed", "Verbal Agreement", "Written Agreement", "Partial Recovery"];
export const holdingNotes = ["Long Term Hold", "Short Term Trade", "Swing Trade", "IPO Allotment", "Employee Stock Option (ESOP)", "Dividend Payout", "Bonus Shares"];
export const insuranceNotes = ["Annual Premium", "Half Yearly Premium", "Quarterly Premium", "Monthly Premium", "Single Premium", "Cashback Plan", "Tax Saving"];
export const bankingNotes = ["Primary Salary Account", "Secondary Savings", "Emergency Fund", "Business Account", "Joint Account", "Minimum Balance Required", "No Balance Required"];
