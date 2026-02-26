import type { ComponentType } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  created_at?: string;
  updated_at?: string;
}

export interface Holding {
  id: string;
  user_id: string;
  symbol: string;
  name: string | null;
  asset_type: "stock" | "etf" | "mutual_fund" | "bond" | "crypto" | "other";
  quantity: number;
  avg_buy_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Nominee {
  id: string;
  user_id: string;
  name: string;
  email: string;
  relationship: string | null;
  access_level: "view_only" | "limited";
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface InactivityConfig {
  user_id: string;
  inactivity_days: number;
  enabled: boolean;
  last_activity_at: string | null;
  warning_sent_at: string | null;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

export type NavigationItem = {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
};

export interface InsurancePolicy {
  id: string;
  user_id: string;
  policy_number: string;
  policy_type: string;
  provider_name: string;
  policy_name?: string | null;
  sum_insured: number;
  premium_amount: number;
  premium_frequency: string;
  start_date: string;
  end_date?: string | null;
  maturity_date?: string | null;
  next_premium_due?: string | null;
  insured_name?: string | null;
  insured_relationship?: string | null;
  policy_nominee_name?: string | null;
  policy_nominee_relationship?: string | null;
  status: string;
  agent_name?: string | null;
  agent_contact?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsurancePayment {
  id: string;
  user_id: string;
  policy_id: string;
  payment_date: string;
  amount: number;
  payment_mode?: string | null;
  reference_number?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  account_number: string;
  bank_name: string;
  branch_name?: string | null;
  ifsc_code: string;
  account_type: string;
  account_holder_name: string;
  is_joint_account: boolean;
  joint_holder_name?: string | null;
  joint_holders?: {
    name: string;
    relation?: string;
  }[];
  current_balance: number;
  balance_as_of?: string | null;
  account_nominee_name?: string | null;
  account_nominee_relationship?: string | null;
  status: string;
  linked_mobile?: string | null;
  net_banking_enabled: boolean;
  debit_card_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  asset_category: string;
  asset_type: string;
  asset_name: string;
  ownership_type?: string | null;
  owner_name?: string | null;
  co_owner_names?: string[] | null;
  ownership_percentage?: number | null;
  purchase_value?: number | null;
  purchase_date?: string | null;
  current_market_value?: number | null;
  valuation_date?: string | null;
  property_address?: string | null;
  property_area?: number | null;
  property_area_unit?: string | null;
  registration_number?: string | null;
  vehicle_registration?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  is_under_loan?: boolean | null;
  loan_provider?: string | null;
  loan_outstanding?: number | null;
  loan_emi?: number | null;
  loan_end_date?: string | null;
  document_reference?: string | null;
  status?: string | null;
  location?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  loan_type: string;
  loan_name?: string | null;
  taken_from: string;
  lender_type?: string | null;
  principal_amount: number;
  interest_rate?: number | null;
  interest_type?: string | null;
  outstanding_amount: number;
  emi_amount?: number | null;
  loan_start_date?: string | null;
  loan_end_date?: string | null;
  tenure_months?: number | null;
  emi_due_day?: number | null;
  auto_debit_account?: string | null;
  is_secured?: boolean | null;
  collateral_type?: string | null;
  collateral_details?: string | null;
  status?: string | null;
  linked_asset_id?: string | null;
  account_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiabilityPayment {
  id: string;
  user_id: string;
  liability_id: string;
  payment_date: string;
  amount: number;
  principal_component?: number | null;
  interest_component?: number | null;
  payment_mode?: string | null;
  reference_number?: string | null;
  outstanding_after_payment?: number | null;
  status?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Receivable {
  id: string;
  user_id: string;
  given_to: string;
  relationship?: string | null;
  contact_number?: string | null;
  email?: string | null;
  principal_amount: number;
  interest_rate?: number | null;
  interest_type?: "simple" | "compound" | null;
  interest_start_date?: string | null;
  interest_end_date?: string | null;
  interest_amount?: number | null;
  last_interest_calculated_at?: string | null;
  total_receivable: number;
  amount_received: number;
  outstanding_amount: number;
  given_date: string;
  expected_return_date?: string | null;
  actual_return_date?: string | null;
  purpose?: string | null;
  status: "pending" | "partial" | "received" | "written_off" | "disputed";
  has_written_agreement?: boolean | null;
  agreement_reference?: string | null;
  reminder_enabled?: boolean | null;
  last_reminder_sent_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Belonging {
  id: string;
  user_id: string;
  category: string;
  item_name: string;
  description?: string | null;
  material?: string | null;
  purity?: string | null;
  weight_grams?: number | null;
  quantity: number;
  purchase_value?: number | null;
  purchase_date?: string | null;
  current_estimated_value?: number | null;
  valuation_date?: string | null;
  storage_location?: string | null;
  location_details?: string | null;
  is_insured?: boolean | null;
  insurance_policy_reference?: string | null;
  has_invoice?: boolean | null;
  has_certificate?: boolean | null;
  bank_locker_details?: string | null;
  status: "in_possession" | "in_locker" | "given_away" | "sold" | "lost" | "stolen";
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentFile {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  mime_type?: string | null;
  file_size?: number | null;
  document_type?: string | null;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  is_archived: boolean;
  is_locked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentLink {
  id: string;
  user_id: string;
  document_id: string;
  entity_type: string;
  entity_id: string;
  link_description?: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at?: string;
}

export interface NetWorthSummary {
  bankBalanceTotal: number;
  assetsTotalValue: number;
  belongingsTotalValue: number;
  receivablesOutstandingTotal: number;
  liabilitiesOutstandingTotal: number;
  netWorth: number;
  updatedAt: string;
}

// AI Assistant types
export interface AIInsight {
  type: 'warning' | 'info' | 'success';
  title: string;
  detail: string;
  action?: {
    label: string;
    href: string;
  };
}

export interface AIResponse {
  summary: string;
  insights: AIInsight[];
  chat_reply: string;
}

export interface UserContext {
  profile: {
    full_name: string;
    email: string;
  };
  netWorth: {
    assets: number;
    liabilities: number;
    total: number;
  };
  accounts: {
    total: number;
    balance: number;
  };
  insurance: {
    total: number;
    overdue: number;
  };
  receivables: number;
  alerts: number;
}

export interface FamilyMember {
  id: string;
  owner_id: string;
  member_user_id: string;
  role: string;
  relation: string;
  created_at: string;
  updated_at: string;
  member_profile?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}
