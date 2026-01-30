export const INACTIVITY_PERIODS = [
  { value: 15, label: "15 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
] as const;

export const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "relative", label: "Other Relative" },
  { value: "friend", label: "Friend" },
  { value: "legal", label: "Legal Representative" },
  { value: "other", label: "Other" },
] as const;

export const ACCESS_LEVELS = [
  {
    value: "view_only",
    label: "View Only",
    description: "Can view portfolio summary and holdings",
  },
  {
    value: "limited",
    label: "Limited Access",
    description: "Can view detailed reports and download statements",
  },
] as const;

export const ASSET_TYPES = [
  { value: "stock", label: "Stock" },
  { value: "etf", label: "ETF" },
  { value: "mutual_fund", label: "Mutual Fund" },
  { value: "bond", label: "Bond" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "other", label: "Other" },
] as const;
