# Investment Intelligence Office — Technical Repository Audit

**Audit Date:** 2026-10-12  
**Target Repository:** `c:\Users\win 11\INVESTMENT-INTELLIGENCE-OFFICE`  
**Repository Name:** `investment-intelligence` (Version: 0.1.0)  
**Framework / Stack:** Next.js 14.1.0 (App Router), React 18, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage), Capacitor 8 (Android), OpenRouter  
**Auditor Policy:** Strict code-level verification. Unverified claims labeled as `UNVERIFIED`. Secrets redacted. No assumptions or flattering.

---

## PART 1 — Feature Verification

| Feature | Status | Evidence (File Path + Line Numbers) | 1-Line Explanation |
| :--- | :--- | :--- | :--- |
| **1. AES-256 financial data encryption** | **PARTIAL** | [encryption.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/src/lib/encryption.ts#L1-L41), [assets/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/assets/route.ts#L117-L154), [banking/accounts/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/banking/accounts/route.ts#L146-L176), [liabilities/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/liabilities/route.ts#L125-L155), [passbook/parse/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/passbook/parse/route.ts#L43-L65) | AES-256-CBC (`process.env.ENCRYPTION_KEY`) encrypts select fields in assets, banking, and liabilities, but transactions, insurance payments, and several numeric fields remain completely unencrypted plain text. |
| **2. Encrypted document vault** | **PARTIAL** | [documents/upload/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/documents/upload/route.ts#L43-L52), [documents/[id]/download/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/documents/%5Bid%5D/download/route.ts#L36-L40), [documents/[id]/request-otp/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/documents/%5Bid%5D/request-otp/route.ts#L62-L76) | Files are uploaded as raw unencrypted binaries directly into Supabase Storage; encryption is absent, though downloading is gated behind an email OTP verification step. |
| **3. Supabase RLS policies** | **WORKING** | [supabase_schema_rls.sql](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_rls.sql#L38-L58), [supabase_schema_v2_brd.sql](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L250-L768), [migrations](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase/migrations/20240101000000_document_view_otps.sql#L13-L23) | Row Level Security (RLS) is explicitly enabled with user ownership checks (`auth.uid() = user_id`) on all 29 defined database tables in SQL migrations. |
| **4. Razorpay Penny Drop bank validation** | **NOT IMPLEMENTED** | [ifsc-service.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/src/lib/ifsc-service.ts#L23-L49), [financialValidationRules.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/src/lib/financialValidationRules.ts#L16-L47), [banking/ifsc/[code]/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/banking/ifsc/%5Bcode%5D/route.ts#L14-L25) | Penny Drop fund validation API is non-existent; the repository only queries the free public `ifsc.razorpay.com` lookup endpoint and validates account numbers using regex/length checks. |
| **5. LLM integration** | **WORKING** | [ai.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/lib/ai.ts#L31-L84), [ai/chat/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/ai/chat/route.ts#L13-L49), [ai/insights/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/ai/insights/route.ts#L1-L25), [package.json](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/package.json#L19-L20) | Real OpenRouter API completions (`openai/gpt-oss-120b:free` or fallback `google/gemma-3-12b-it:free`) power chat, portfolio insights, and public bot; installed Google Gemini SDK is unused dead code. |
| **6. Inactivity-triggered nominee access** | **PARTIAL** | [vercel.json](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/vercel.json#L1-L8), [inactivity/check/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/inactivity/check/route.ts#L18-L199), [inactivity/access/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/inactivity/access/route.ts#L14-L33), [nominee-access/[token]/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/nominee-access/%5Btoken%5D/route.ts#L24-L37) | Detected by a daily Vercel cron triggering 4 reminder stages and SendGrid emails at Stage 4; however, the access endpoints have conflicting implementations and reference an untracked `nominee_access_tokens` table. |
| **7. Core modules completeness** | **WORKING / PARTIAL** | [assets/page.tsx](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/assets/page.tsx#L177-L288), [liabilities/page.tsx](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/liabilities/page.tsx#L1-L60), [insurance/page.tsx](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/insurance/page.tsx#L1-L60), [banking/page.tsx](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/banking/page.tsx#L1-L60), [documents/page.tsx](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/documents/page.tsx#L1-L60) | Assets, Liabilities, Insurance, and Banking are fully functioning with CRUD, document links, and API routes; Document Vault works but lacks file encryption; Smart Passbook has transaction delete disabled as "mock phase". |
| **8. Capacitor mobile app** | **PARTIAL** | [capacitor.config.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/capacitor.config.ts#L16-L49), [android/](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/android/app/src/main/AndroidManifest.xml#L1-L40), [PassbookPlugin.java](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/android/app/src/main/java/com/investmentintelligence/app/PassbookPlugin.java#L13-L46) | Only `android/` exists (`ios/` does not exist); it wraps the Next.js web application via WebView pointing to local/remote server URLs, supplemented by custom native Android SMS/Notification plugins. |
| **9. Authentication & session handling** | **WORKING** | [login/page.tsx](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/login/page.tsx#L58-L123), [signup/page.tsx](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/signup/page.tsx#L27-L60), [forgot-password/page.tsx](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/%28auth%29/forgot-password/page.tsx#L31-L98), [middleware.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/middleware.ts#L27-L69) | Supabase SSR cookie auth with password login, native/web Google OAuth, Supabase email OTP password reset, and a 12-hour session timeout enforced by Next.js middleware. |
| **10. Dashboard numbers origin** | **WORKING / PARTIAL** | [dashboard/net-worth/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/dashboard/net-worth/route.ts#L24-L85), [dashboard/summary/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/dashboard/summary/route.ts#L22-L76), [PortfolioChartCard.tsx](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/components/dashboard/PortfolioChartCard.tsx#L20-L35), [RiskOverviewCard.tsx](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/components/dashboard/RiskOverviewCard.tsx#L11-L16) | Core totals (Net Worth, Bank, Assets, Belongings, Receivables, Liabilities) are dynamically computed from decrypted DB rows; however, Risk Overview displays hardcoded "pending" placeholders and live stock PnL is 0. |

---

### Detailed Verification Breakdown

#### 1. AES-256 Financial Data Encryption
- **Algorithm & Mode:** `aes-256-cbc` using Node.js native `crypto` module ([encryption.ts:3](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/src/lib/encryption.ts#L3)).
- **Key Location & Size:** `process.env.ENCRYPTION_KEY` ([encryption.ts:5](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/src/lib/encryption.ts#L5)). Key must be exactly 32 bytes (256 bits).
- **IV Generation & Storage:** Generates a random 16-byte initialization vector per operation: `crypto.randomBytes(16)`. Encrypted string output format is `${ivHex}:${cipherHex}` ([encryption.ts:29-36](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/src/lib/encryption.ts#L29-L36)).
- **What is Encrypted:**
  - `bank_accounts`: `account_number`, `bank_name`, `branch_name`, `ifsc_code`, `account_holder_name`, `joint_holder_name`, `account_nominee_name`, `account_nominee_relationship`, `linked_mobile`, `debit_card_number`, `notes`, `city`, `state`, and `current_balance`.
  - `assets`: `asset_name`, `owner_name`, `property_address`, `registration_number`, `vehicle_registration`, `vehicle_make`, `vehicle_model`, `loan_provider`, `document_reference`, `location`, `notes`, and `current_market_value`.
  - `liabilities`: `loan_name`, `taken_from`, `auto_debit_account`, `collateral_details`, `account_number`, `notes`, and numeric amounts `principal_amount`, `outstanding_amount`, `emi_amount`.
  - `receivables`: `given_to`, `relationship`, `contact_number`, `email`, `purpose`, `agreement_reference`, `notes`, `principal_amount`, `interest_amount`, `total_receivable`, `amount_received`, `outstanding_amount`.
  - `belongings`: `item_name`, `description`, `storage_location`, `bank_locker_details`, `location_details`, `notes`, `insurance_policy_reference`, `weight_grams`, `quantity`, `purchase_value`, `current_estimated_value`.
  - `holdings`: `symbol`, `name`, `notes`, `quantity`, `avg_buy_price`.
  - `net_worth_snapshots`: `net_worth`, `bank_balance`, `assets_value`, `belongings_value`, `receivables_value`, `liabilities_value`.
- **What is NOT Encrypted (Plaintext Gaps):**
  - `transactions` (Smart Passbook): `raw_text` (full SMS body), `amount`, `balance_after`, `account_last4`, `upi_id`, `merchant`, `bank`, `transaction_ref` are stored 100% in plain text ([passbook/parse/route.ts:43-65](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/passbook/parse/route.ts#L43-L65)).
  - `assets`: `purchase_value`, `loan_outstanding`, `loan_emi`, `property_area`, and `ownership_percentage` are stored as plaintext numbers ([assets/route.ts:125-142](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/assets/route.ts#L125-L142)).
  - `liabilities`: `interest_rate` is stored as plaintext number ([liabilities/route.ts:132](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/liabilities/route.ts#L132)).
  - `liability_payments`: `principal_component`, `interest_component`, and `outstanding_after_payment` are stored in plain text ([liabilities/[id]/payments/route.ts:137-140](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/liabilities/%5Bid%5D/payments/route.ts#L137-L140)).
  - `insurance_payments`: Every single field (`amount`, `payment_mode`, `reference_number`, `receipt_url`, `notes`) is stored unencrypted ([insurance/policies/[id]/payments/route.ts:117-130](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/insurance/policies/%5Bid%5D/payments/route.ts#L117-L130)).
  - `bank_transactions`: `amount`, `balance_after`, `description`, `reference_number` are stored in plain text ([banking/[id]/transactions/route.ts:84-93](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/banking/%5Bid%5D/transactions/route.ts#L84-L93)).
  - `alerts`: Raw plain bank account number is injected into unencrypted notification string ([banking/accounts/route.ts:196](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/banking/accounts/route.ts#L196)).
- **Silent Degradation Risk:** If `ENCRYPTION_KEY` is missing in development or if `encrypt()` encounters an error, the function catches the exception and returns the plaintext input unaltered ([encryption.ts:18-20, 37-40](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/src/lib/encryption.ts#L18-L20)).

#### 2. Encrypted Document Vault
- **Storage Target:** Supabase Storage bucket `documents` ([documents/upload/route.ts:47](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/documents/upload/route.ts#L47)).
- **Pre-upload Encryption:** **NONE.** The route takes the `File` object from `formData`, converts it to `ArrayBuffer` -> `Uint8Array`, and passes it directly to `supabase.storage.from('documents').upload(...)` ([documents/upload/route.ts:43-51](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/documents/upload/route.ts#L43-L51)). Files reside unencrypted on Supabase cloud storage.
- **Access Control:** File downloads generate a temporary 60-second Supabase signed URL ([documents/[id]/download/route.ts:39](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/documents/%5Bid%5D/download/route.ts#L39)).
- **OTP Protection:** To view/download documents, the frontend requires OTP verification via `POST /api/documents/[id]/request-otp` and `POST /api/documents/[id]/verify-otp`. Once verified, a record in `document_view_otps` unlocks the document for a 2-minute window ([documents/route.ts:59-75](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/documents/route.ts#L59-L75)).

#### 3. Supabase RLS Table Matrix
All 29 tables found across migration files have RLS enabled and policies declared:

| Table Name | RLS Enabled | Policies Defined | Scope & Security Rule | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | YES | YES (SELECT, INSERT, UPDATE) | `id = auth.uid()` | [supabase_schema_rls.sql:38-58](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_rls.sql#L38-L58) |
| `holdings` | YES | YES (SELECT, INSERT, UPDATE, DELETE) | `user_id = auth.uid()` | [supabase_schema_rls.sql:84-110](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_rls.sql#L84-L110) |
| `nominees` | YES | YES (SELECT, INSERT, UPDATE, DELETE) | `user_id = auth.uid()` | [supabase_schema_rls.sql:136-161](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_rls.sql#L136-L161) |
| `inactivity_config` | YES | YES (SELECT, INSERT, UPDATE) | `user_id = auth.uid()` (DELETE blocked) | [supabase_schema_rls.sql:209-231](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_rls.sql#L209-L231) |
| `alerts` | YES | YES (SELECT, UPDATE) | `user_id = auth.uid()` (INSERT restricted to service role) | [supabase_schema_rls.sql:249-272](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_rls.sql#L249-L272) |
| `insurance_policies` | YES | YES (ALL) | `user_id = auth.uid()` | [supabase_schema_v2_brd.sql:250-258](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L250-L258) |
| `insurance_payments` | YES | YES (ALL) | `user_id = auth.uid()` | [supabase_schema_v2_brd.sql:284-292](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L284-L292) |
| `bank_accounts` | YES | YES (ALL) | `user_id = auth.uid()` | [supabase_schema_v2_brd.sql:341-349](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L341-L349) |
| `trading_investments` | YES | YES (ALL) | `user_id = auth.uid()` | [supabase_schema_v2_brd.sql:394-402](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L394-L402) |
| `assets` | YES | YES (ALL) | `user_id = auth.uid()` | [supabase_schema_v2_brd.sql:458-466](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L458-L466) |
| `liabilities` | YES | YES (ALL) | `user_id = auth.uid()` | [supabase_schema_v2_brd.sql:517-525](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L517-L525) |
| `liability_payments` | YES | YES (ALL) | `user_id = auth.uid()` | [supabase_schema_v2_brd.sql:557-565](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L557-L565) |
| `receivables` | YES | YES (ALL) | `user_id = auth.uid()` | [supabase_schema_v2_brd.sql:612-620](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L612-L620) |
| `belongings` | YES | YES (ALL) | `user_id = auth.uid()` | [supabase_schema_v2_brd.sql:668-676](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L668-L676) |
| `documents` | YES | YES (ALL) | `user_id = auth.uid()` | [supabase_schema_v2_brd.sql:708-716](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L708-L716) |
| `document_links` | YES | YES (ALL) | `user_id = auth.uid()` | [supabase_schema_v2_brd.sql:760-768](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L760-L768) |
| `document_view_otps` | YES | YES (SELECT, INSERT, UPDATE) | `user_id = auth.uid()` | [20240101000000_document_view_otps.sql:13-23](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase/migrations/20240101000000_document_view_otps.sql#L13-L23) |
| `family_members` | YES | YES (SELECT, INSERT, DELETE) | `owner_id = auth.uid()` | [20240103000000_create_family_hub.sql:14-30](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase/migrations/20240103000000_create_family_hub.sql#L14-L30) |
| `inactivity_tracker` | YES | YES (ALL) | `user_id = auth.uid()` | [20240201000000_nominee_inactivity_system.sql:64-72](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase/migrations/20240201000000_nominee_inactivity_system.sql#L64-L72) |
| `nominee_attempts` | YES | YES (Lockdown) | `USING (false) WITH CHECK (false)` (Service role only) | [20240201000000_nominee_inactivity_system.sql:94-103](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase/migrations/20240201000000_nominee_inactivity_system.sql#L94-L103) |
| `nominee_sessions` | YES | YES (Lockdown) | `USING (false) WITH CHECK (false)` (Service role only) | [20240201000000_nominee_inactivity_system.sql:129-138](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase/migrations/20240201000000_nominee_inactivity_system.sql#L129-L138) |
| `system_config` | YES | YES (SELECT) | `USING (true)` (Authenticated read-only) | [20240201000000_nominee_inactivity_system.sql:147-155](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase/migrations/20240201000000_nominee_inactivity_system.sql#L147-L155) |
| `user_inactivity_settings` | YES | YES (ALL) | `user_id = auth.uid()` | [20240201000000_nominee_inactivity_system.sql:188-196](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase/migrations/20240201000000_nominee_inactivity_system.sql#L188-L196) |
| `bank_transactions` | YES | YES (SELECT, INSERT, UPDATE, DELETE) | `user_id = auth.uid()` | [20240312000000_bank_transactions.sql:23-40](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase/migrations/20240312000000_bank_transactions.sql#L23-L40) |
| `audit_logs` | YES | YES (SELECT, INSERT) | `user_id = auth.uid()` | [20240312000001_activity_audit_logs.sql:15-27](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase/migrations/20240312000001_activity_audit_logs.sql#L15-L27) |
| `transactions` | YES | YES (ALL) | `user_id = auth.uid()` | [20240315000000_smart_passbook.sql:42-47](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase/migrations/20240315000000_smart_passbook.sql#L42-L47) |
| `linked_cards` | YES | YES (ALL) | `user_id = auth.uid()` | [20240315000000_smart_passbook.sql:43-50](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase/migrations/20240315000000_smart_passbook.sql#L43-L50) |
| `net_worth_snapshots` | YES | YES (ALL) | `user_id = auth.uid()` | [credit_score_migration.sql:27-35](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/credit_score_migration.sql#L27-L35) |
| `credit_profiles` | YES | YES (ALL) | `user_id = auth.uid()` | [credit_score_migration.sql:83-91](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/credit_score_migration.sql#L83-L91) |
| `nominee_access_tokens` | **UNVERIFIED** | **UNVERIFIED** | Table referenced in code ([check-inactivity:88](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/jobs/check-inactivity/route.ts#L88), [nominee-access:25](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/nominee-access/%5Btoken%5D/route.ts#L25)) but absent from all SQL migration files. | N/A |

#### 4. Razorpay Penny Drop Bank Validation
- **Status:** **NOT IMPLEMENTED**.
- **Evidence:** The only Razorpay reference in code is `https://ifsc.razorpay.com/${code}` called in [ifsc-service.ts:31](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/src/lib/ifsc-service.ts#L31) and [app/api/banking/ifsc/[code]/route.ts:14](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/banking/ifsc/%5Bcode%5D/route.ts#L14).
- **Validation Reality:** Bank account validation is strictly client/server-side digit and length checking configured for ~30 Indian banks in [financialValidationRules.ts:16-47](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/src/lib/financialValidationRules.ts#L16-L47). No live or test penny transactions or fund account validation endpoints (`POST /v1/fund_accounts/validations`) are ever contacted.

#### 5. LLM Integration
- **Provider:** OpenRouter (`https://openrouter.ai/api/v1/chat/completions`) ([ai.ts:48](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/lib/ai.ts#L48)).
- **Configured Model:** `openai/gpt-oss-120b:free` (in `.env.local:13`) with hardcoded fallback `google/gemma-3-12b-it:free` ([ai.ts:42](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/lib/ai.ts#L42)).
- **Use Cases:**
  1. Authenticated portfolio assistant (`POST /api/ai/chat`): builds system prompt using decrypted user financial snapshot (bank accounts, assets, belongings, receivables, liabilities, insurance, holdings) and streams JSON chat replies ([chat/route.ts:54-129](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/ai/chat/route.ts#L54-L129)).
  2. Portfolio summary insights (`POST /api/ai/insights`): returns top 3 actionable advice bullets ([insights/route.ts:1-25](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/ai/insights/route.ts#L1-L25)).
  3. Public educational chatbot (`POST /api/ai/public-chat`): in-memory rate-limited (5 req/min/IP) answering questions on Indian investment concepts ([public-chat/route.ts:8-80](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/ai/public-chat/route.ts#L8-L80)).
- **Real vs Mocked:** Real HTTP requests to OpenRouter. If the API fails or is rate-limited, it falls back to a hardcoded error structure ([ai.ts:151-158](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/lib/ai.ts#L151-L158)).
- **Gemini Status:** `@google/genai` and `@google/generative-ai` are installed in `package.json:19-20` and `GEMINI_API_KEY` is present in `.env.local:45`, but neither is imported or called anywhere in source code.

#### 6. Inactivity-Triggered Nominee Access Workflow
- **Trigger Mechanism:** Automated cron job declared in [vercel.json:1-8](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/vercel.json#L1-L8) calling `GET /api/inactivity/check` daily at `0 2 * * *`. The endpoint requires a `Bearer ${process.env.CRON_SECRET}` authorization header ([inactivity/check/route.ts:21-28](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/inactivity/check/route.ts#L21-L28)).
- **Detection Algorithm:** Checks difference between current timestamp and `inactivity_tracker.last_login_at` across 4 stages (5, 10, 15, 20 minutes in test mode; 15, 30, 45, 60 days in production) ([inactivity/check/route.ts:63-68](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/inactivity/check/route.ts#L63-L68)).
- **What Happens on Trigger:**
  - Stage 1, 2, 3: Sends warning emails to user via SendGrid ([inactivity/check/route.ts:208-274](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/inactivity/check/route.ts#L208-L274)).
  - Stage 4: Updates `inactivity_tracker.nominee_triggered = true`, emails the user, queries the `nominees` table, and dispatches notification emails containing a link to `/nominee-portal/{nominee.id}` ([inactivity/check/route.ts:154-193](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/inactivity/check/route.ts#L154-L193)).
- **Architectural Conflict:** Two separate access models exist:
  1. `app/api/inactivity/access/route.ts`: Nominee verifies via phone + Aadhaar/PAN hash against `inactivity_tracker.nominee_triggered`, generating a UUID session token stored in `nominee_sessions`. Fails under RLS because it uses an unauthenticated client.
  2. `app/api/jobs/check-inactivity/route.ts` & `app/api/nominee-access/[token]/route.ts`: Uses a 64-char token querying `nominee_access_tokens` (table missing from repo SQL scripts).

#### 7. Modules Verification
- **Assets (`/app/assets`):** **WORKING.** Supports movable/immovable assets, full CRUD via `/api/assets`, document linking, QuickPick presets, and encrypts values in Supabase.
- **Liabilities (`/app/liabilities`):** **WORKING.** Supports loan tracking, full CRUD via `/api/liabilities`, auto-debit accounts, linked assets, and payment history via `/api/liabilities/[id]/payments`.
- **Insurance (`/app/insurance`):** **WORKING.** Supports policy types, full CRUD via `/api/insurance/policies`, premium scheduling, payment logging, and document attachment.
- **Banking (`/app/banking`):** **WORKING.** Supports bank accounts CRUD via `/api/banking/accounts`, real-time IFSC branch lookup, account number validation, and transaction modal.
- **Document Vault (`/app/documents`):** **PARTIAL.** Upload, listing, tagging, search, document-to-entity linking, and OTP gating are functional. However, files are stored unencrypted in Supabase Storage.
- **Holdings (`/app/holdings`):** **WORKING.** Tracks stocks and equity holdings via `/api/holdings`, encrypts fields, updates net worth history.
- **Receivables (`/app/receivables`):** **WORKING.** Tracks money owed to user with auto-calculating simple/compound interest engine ([lib/interest.ts:1-68](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/lib/interest.ts#L1-L68)).
- **Belongings (`/app/belongings`):** **WORKING.** Tracks jewelry, gold, valuables with weight, purity, locker location details, and value estimation.
- **Smart Passbook (`/app/passbook`):** **PARTIAL.** The regex parser ([smsParser.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/services/smsParser.ts#L1-L606)) and parse API ([passbook/parse/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/passbook/parse/route.ts#L5-L79)) parse transactions and prevent duplicates; however, `handleDeleteTransaction` in [TransactionsDialog.tsx:121](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/components/banking/TransactionsDialog.tsx#L121) explicitly halts with `"Deletion not supported in this mock phase to prevent balance mismatch."`, and background signal detection requires native Android hardware.
- **Family Hub (`/app/family`):** **WORKING.** Enables linking family accounts and viewing aggregate family member portfolios.

#### 8. Capacitor Mobile App
- **Platforms Present:**
  - `android/`: **EXISTS** ([android/app/build.gradle](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/android/app/build.gradle#L1-L40)).
  - `ios/`: **DOES NOT EXIST.** No iOS project folder, xcworkspace, or podfiles.
- **Codebase Integration:** Built from the exact same web codebase. `capacitor.config.ts:21-34` sets `webDir: 'out'`, but in runtime points `server.url` to the dev server (`http://10.69.27.149:3000`) or production (`https://investment-intellegince.vercel.app`).
- **Native Extensions:** Custom Android Java classes implement native SMS reception (`SMSReceiver.java`), Android notification interception (`NotificationService.java`), and Capacitor bridge dispatch (`PassbookPlugin.java`).

#### 9. Authentication & Session Handling
- **Login Methods:** Email + password via Supabase Auth `signInWithPassword` ([login/page.tsx:65](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/login/page.tsx#L65)); Google OAuth via Supabase `signInWithOAuth` on web ([login/page.tsx:114](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/login/page.tsx#L114)); Native Google sign-in via `@codetrix-studio/capacitor-google-auth` on Android ([login/page.tsx:91-101](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/login/page.tsx#L91-L101)).
- **Session Handling:** Managed via `@supabase/ssr` cookies. [middleware.ts:5-69](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/middleware.ts#L5-L69) checks `session.user.last_sign_in_at` against a 12-hour timeout (`SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000`), purging `sb-*` cookies and redirecting to `/login?reason=timeout` upon expiration.
- **Password & OTP Flow:** Signup registers user via `supabase.auth.signUp` followed by `/api/auth/bootstrap` creating the user profile and initial inactivity config ([signup/page.tsx:34-56](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/signup/page.tsx#L34-L56)). Forgot password triggers an 8-digit email OTP via `supabase.auth.signInWithOtp` -> `supabase.auth.verifyOtp` -> `supabase.auth.updateUser({ password })` ([forgot-password/page.tsx:36-96](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/%28auth%29/forgot-password/page.tsx#L36-L96)).

#### 10. Dashboard Numbers
- **Net Worth & Totals:** **REAL DATA FROM DB.** `GET /api/dashboard/net-worth` executes parallel Supabase queries fetching `bank_accounts`, `assets`, `belongings`, `receivables`, and `liabilities`. Decrypts individual numeric fields in memory using `decryptNumber()` and evaluates:
  $$\text{Net Worth} = (\text{Bank} + \text{Assets} + \text{Belongings} + \text{Receivables}) - \text{Liabilities}$$
  ([dashboard/net-worth/route.ts:47-59](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/dashboard/net-worth/route.ts#L47-L59)).
- **Historical Snapshots:** **REAL DATA FROM DB.** Stored daily in `net_worth_snapshots` and rendered by `NetWorthMiniChart.tsx` and `TrendGraphCards.tsx`.
- **Secondary Cards Limitations:**
  - `PortfolioChartCard.tsx:21`: Contains a legacy `generateMockData` function (though currently displays a single "Today" point when data is present).
  - `RiskOverviewCard.tsx:11-16, 49`: Displays static placeholder text ("pending", score "—") with no underlying statistical risk model.
  - Live stock P&L is unintegrated; `totalPnL` is hardcoded to 0 in `dashboard/summary/route.ts:46`.

---

## PART 2 — Security Review

### Committed Secrets, Keys, and Tokens
| Location | Type of Secret | Status / Notes |
| :--- | :--- | :--- |
| Git commit `67ce5b0ea825af8806070ee8efd72e003f550e83` in `.env.example` | Supabase Anon Key & **Supabase Service Role Key** | **CRITICAL LEAK IN GIT HISTORY.** Deleted in subsequent commit, but plain JWT secret keys granting full administrative access bypassing all RLS remain permanently in git history. |
| [capacitor.config.ts:42](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/capacitor.config.ts#L42) | Google OAuth Client ID | Committed in source code: `serverClientId: '[REDACTED].apps.googleusercontent.com'`. |
| `.env.local` (Repo Root Workspace) | Supabase Service Role Key, OpenRouter Key, Resend Key, SendGrid Key, Cron Secret, AES-256 Key, Gemini Key | Exists unencrypted on local filesystem; excluded by `.gitignore`, but live keys are active. |
| [debug-summary.json](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/debug-summary.json#L1-L19) | Financial aggregated portfolio dump | Committed JSON file exposing actual financial balances, asset valuations, and counts. |

### Console.log of Sensitive Data (OTP, PII, Tokens)
1. **Plaintext OTP & Recipient Email:**
   - [lib/otp.ts:20](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/lib/otp.ts#L20):  
     `console.log("🔐 OTP for ${email}: ${otp} (Document: ${documentName})");`  
     Outputs raw 6-digit OTP codes and user email addresses to stdout in development mode.
2. **Complete Financial Transaction Records:**
   - [services/smsParser.ts:602-604](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/services/smsParser.ts#L602-L604):  
     `console.log(JSON.stringify(result, null, 2));`  
     Logs every parsed banking/UPI transaction object, including amounts, merchant names, bank names, account last-4 digits, UPI IDs, balances after transaction, and transaction reference numbers.
3. **Raw SMS & Banking Signal Snippets:**
   - [app/passbook/page.tsx:116](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/passbook/page.tsx#L116):  
     `console.log("🔔 Raw signal received:", data.source, data.raw?.substring(0, 60));`  
     Logs raw SMS notification bodies containing bank details to the browser console.
4. **User & Nominee Emails in Cron Jobs:**
   - [app/api/inactivity/check/route.ts:175, 186, 214, 239, 263](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/inactivity/check/route.ts#L175):  
     Logs recipient user and nominee email addresses to stdout during automated inactivity sweeps.
5. **Debug User Profiles:**
   - [scripts/read_profile.js:33-34](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/scripts/read_profile.js#L33-L34):  
     Logs user UUIDs, full names, and avatar URLs to stdout.
   - [scripts/simulate-inactivity.js:42, 67](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/scripts/simulate-inactivity.js#L42):  
     Logs user IDs and email addresses.

### API Routes Without Auth Checks
- **Global Middleware Bypass:** [middleware.ts:15-21](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/middleware.ts#L15-L21) explicitly bypasses all session verification for all `/api/*` endpoints (`if (isApi) return response`) and sets permissive CORS `Access-Control-Allow-Origin: *`. Consequently, every API route must independently verify authentication; any route omitting checks is globally open.
- **Route-Specific Findings:**
  1. [app/api/banking/ifsc/[code]/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/banking/ifsc/%5Bcode%5D/route.ts#L3-L30): Zero authentication check. Unrestricted public proxy to Razorpay IFSC API.
  2. [app/api/test-nan/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/test-nan/route.ts#L3-L10): Zero authentication check. Unrestricted test endpoint.
  3. [app/api/health/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/health/route.ts#L1-L10) & [src/app/api/health/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/src/app/api/health/route.ts#L1-L10): Public health checks (standard practice, but unauthenticated).
  4. [app/api/ai/public-chat/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/ai/public-chat/route.ts#L31-L80): Public endpoint with in-memory IP rate limiting (5 req/min).
  5. [app/api/inactivity/access/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/inactivity/access/route.ts#L5-L123): Public POST endpoint executing database lookups using standard Supabase client.
  6. [app/api/nominee-access/[token]/route.ts](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/nominee-access/%5Btoken%5D/route.ts#L7-L140): Public endpoint requiring only a URL token; uses `supabaseAdmin` service role to fetch and decrypt full portfolio records.
  7. [app/api/debug/inspect-links/route.ts:13-20](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/debug/inspect-links/route.ts#L13-L20): Checks `user`, but queries `document_links` without filtering by `.eq('user_id', user.id)`.

### Tables Without RLS
- All 29 tables defined in `.sql` migration files have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- `nominee_access_tokens`: Referenced in API routes ([check-inactivity:88](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/jobs/check-inactivity/route.ts#L88), [nominee-access:25](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/nominee-access/%5Btoken%5D/route.ts#L25)), but no migration script creates this table in the codebase. Its production RLS status is untracked and **UNVERIFIED**.

### Financial Data Stored in Plain Text
1. **`transactions` (Smart Passbook):** Completely unencrypted. `raw_text` (full bank SMS text), `amount`, `balance_after`, `account_last4`, `upi_id`, `merchant`, `bank`, and `transaction_ref` are stored in raw text ([passbook/parse/route.ts:43-65](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/passbook/parse/route.ts#L43-L65)).
2. **`insurance_payments`:** Completely unencrypted. `amount`, `payment_mode`, `reference_number`, `receipt_url`, and `notes` are inserted as plain values ([insurance/policies/[id]/payments/route.ts:117-130](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/insurance/policies/%5Bid%5D/payments/route.ts#L117-L130)).
3. **`bank_transactions`:** Completely unencrypted. `amount`, `balance_after`, `description`, `reference_number` are plain numbers/strings ([banking/[id]/transactions/route.ts:84-93](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/banking/%5Bid%5D/transactions/route.ts#L84-L93)).
4. **`assets`:** `purchase_value`, `loan_outstanding`, `loan_emi`, `property_area`, and `ownership_percentage` are stored as plain numbers ([assets/route.ts:125-142](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/assets/route.ts#L125-L142)).
5. **`liabilities`:** `interest_rate` is plain numeric text ([liabilities/route.ts:132](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/liabilities/route.ts#L132)); in `liability_payments`, `principal_component`, `interest_component`, and `outstanding_after_payment` are stored unencrypted ([liabilities/[id]/payments/route.ts:137-140](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/liabilities/%5Bid%5D/payments/route.ts#L137-L140)).
6. **`receivables`:** `interest_rate` is stored as plain numeric text ([receivables/route.ts:150](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/receivables/route.ts#L150)).
7. **`alerts`:** Unencrypted bank account numbers and bank names are embedded directly into user alert messages ([banking/accounts/route.ts:196](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/banking/accounts/route.ts#L196)).
8. **Document Storage Vault:** Binary files in Supabase Storage bucket `documents` are uploaded in original, unencrypted format ([documents/upload/route.ts:43-51](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/api/documents/upload/route.ts#L43-L51)).

---

## PART 3 — Repo Health

### Dead Code, Mock Data, and Hardcoded Values
- **Unused Dependencies:**
  - `@google/genai` (v2.13.0) and `@google/generative-ai` (v0.24.1) in `package.json:19-20` are never imported in the application.
  - `exceljs` is installed and used in `export/excel`, but redundant helper scripts duplicate logic.
- **Unused Database Tables in Migrations:**
  - `trading_investments` in [supabase_schema_v2_brd.sql:354](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/supabase_schema_v2_brd.sql#L354) is not wired to any API or page (replaced by `holdings`).
  - `credit_profiles` in [credit_score_migration.sql:44](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/credit_score_migration.sql#L44) has no matching frontend or backend implementation.
- **Duplicated Architecture:**
  - Dual app directories: Root `/app` contains 28 feature routes and pages; `/src/app/api/health` contains a duplicate health check endpoint.
  - Dual email libraries: `src/lib/resend.ts` uses Resend SDK; `lib/email.ts` and `lib/notifications.ts` use SendGrid SDK.
  - Dual Supabase client folders: `src/lib/supabase/` and `src/lib/` alongside root `lib/`.
- **Mock Data & Placeholders:**
  - [components/dashboard/PortfolioChartCard.tsx:21-35](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/components/dashboard/PortfolioChartCard.tsx#L21-L35): Dead helper function `generateMockData` generates random simulated noise over 6 months.
  - [components/dashboard/RiskOverviewCard.tsx:11-16, 49](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/components/dashboard/RiskOverviewCard.tsx#L11-L16): Hardcoded static placeholders ("pending", score "—").
  - [components/banking/TransactionsDialog.tsx:121](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/components/banking/TransactionsDialog.tsx#L121): Transaction deletion is disabled with toast `"Deletion not supported in this mock phase to prevent balance mismatch."`
- **Hardcoded Values:**
  - Private IP address `http://10.69.27.149:3000` hardcoded in [capacitor.config.ts:27](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/capacitor.config.ts#L27).
  - Hardcoded misspelled domain `https://investment-intellegince.vercel.app` hardcoded across [capacitor.config.ts:32](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/capacitor.config.ts#L32), [ai.ts:53](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/lib/ai.ts#L53), [login/page.tsx:19](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/login/page.tsx#L19), and [signup/page.tsx:71](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/signup/page.tsx#L71).
  - Hardcoded email `'merndevloops@gmail.com'` hardcoded as fallback in [lib/notifications.ts:18](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/lib/notifications.ts#L18).
- **TODO Comments:**
  - [app/receivables/page.tsx:358](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/app/receivables/page.tsx#L358): `// TODO: Add UPI from user profile/settings if available`
  - [android/app/src/main/res/xml/data_extraction_rules.xml:8](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/android/app/src/main/res/xml/data_extraction_rules.xml#L8): `<!-- TODO: Use <include> and <exclude> to control what is backed up. -->`

### Scratch, Debug, and Loose Files
- **Committed node_modules:**  
  **1,538 files** inside `backend/node_modules/` are tracked and committed directly to Git (`git ls-files backend/node_modules`).
- **Committed Debug Dumps:**  
  [debug-summary.json](file:///c:/Users/win%2011/INVESTMENT-INTELLIGENCE-OFFICE/debug-summary.json#L1-L19) is committed in repository root with user portfolio figures.
- **Scratch Scripts in `scripts/` (24 Files):**  
  `debug-decrypt-error.ts`, `debug-decrypt.ts`, `debug-net-worth.ts`, `enhance-excel.js`, `fetch-api.ts`, `fix-const.js`, `make_bucket_public.js`, `migrate-encryption.ts`, `migrate-history-encryption.ts`, `read_profile.js`, `refactor_colors.js`, `simulate-inactivity.js`, `test-cbc.js`, `test-db-cols.ts`, `test-db.ts`, `test-decrypt-direct.js`, `test-format.js`, `test-holdings-decrypt.ts`, `test-holdings.ts`, `test-json.js`, `test-parser.ts`, `test-post-holdings.ts`.
- **Loose `.sql` Files in Root (16 Files):**  
  `add_avatar_url_to_profiles.sql`, `add_debit_card_column.sql`, `add_package_name_to_transactions.sql`, `avatar_storage_policies.sql`, `avatars_storage_policies.sql`, `create_avatars_bucket.sql`, `create_transactions_table.sql`, `credit_score_migration.sql`, `fix_data_persistence.sql`, `fix_transactions_schema.sql`, `onboarding_migration.sql`, `receivables_interest_migration.sql`, `setup_documents_rls.sql`, `storage_policies.sql`, `supabase_schema_rls.sql`, `supabase_schema_v2_brd.sql`.

### Missing Error Handling on External API Calls
- **OpenRouter (`lib/ai.ts:48-84`):** Throws raw error on network or non-200 responses; in `app/api/ai/chat/route.ts:40-47`, catches error and returns HTTP 500 without retry logic or model fallback.
- **Inactivity Admin User Fetch (`app/api/inactivity/check/route.ts:145-151`):** Calls `supabase.auth.admin.getUserById(tracker.user_id)`. If this call fails or returns null, `userEmail` remains undefined; subsequent email sending silently skips notifying the user.

### Test Files and CI Configuration
- **Automated Tests:** **0**. No Jest, Vitest, Playwright, Cypress, or Mocha configurations. There is no `test` script in `package.json` (`npm test` does not exist).
- **Stub Tests:** 2 boilerplate Android stub tests (`ExampleUnitTest.kt` and `ExampleUnitTest.java`).
- **CI/CD Pipeline:** **0**. No `.github/workflows` directory exists, and no CI/CD configuration files (GitHub Actions, GitLab CI, CircleCI) are present in the repository.

---

## PART 4 — Users and Usage

- **Count of rows in users/profiles table:** **Not verifiable from the repo.**  
  *(No seed data or database dumps for `auth.users` or `public.profiles` exist within repository code. The committed `debug-summary.json` file records aggregated financial counts from a test run, but actual user counts cannot be verified from the codebase alone.)*

---

## PART 5 — Resume Verdict

### Claims Safe to Put on a Resume
- **"Architected a comprehensive personal finance office using Next.js 14 App Router, React 18, and TypeScript"**: Verified. Clean page architecture across 10+ financial domains with server/client boundaries.
- **"Built multi-module portfolio tracking for Indian financial instruments"**: Verified. Implements tracking for bank accounts, real estate, vehicles, gold/belongings, liabilities, insurance policies, receivables, and equity holdings.
- **"Implemented database-level Row Level Security (RLS) on PostgreSQL via Supabase"**: Verified. 29 tables explicitly configure RLS policies isolating records by `auth.uid() = user_id`.
- **"Integrated OpenRouter LLM completions for context-aware portfolio insights"**: Verified. Contextually aggregates user asset and debt summaries to generate structured financial recommendations.
- **"Developed cross-platform Android mobile app using Capacitor 8 with custom native plugins"**: Verified. Android platform configured with custom Java plugins (`PassbookPlugin`, `SMSReceiver`, `NotificationService`) for bank signal detection.
- **"Engineered an automated time-based inactivity monitoring and multi-stage alert engine"**: Verified. Vercel cron triggers scheduled progressive reminder sweeps (Stages 1–4) with SendGrid email dispatches.
- **"Designed dynamic portfolio Net Worth aggregation and financial trend visualization"**: Verified. Dynamic aggregation engine balances liquid cash, physical assets, receivables, and liabilities with Recharts visualizations.
- **"Implemented application-level AES-256-CBC field encryption for banking and financial records"**: Verified. Utilizes Node.js `crypto` with per-record random IVs to encrypt critical fields before database persistence.
- **"Built an OTP-verified document access mechanism for financial vault files"**: Verified. Supabase signed download URLs are protected by timed email OTP verification.

### Claims NOT Safe to Put on a Resume
- **"100% End-to-End Encryption across the entire database"**: **UNSAFE.**  
  *Reason:* All passbook transactions, insurance payments, bank transactions, and various asset/liability numerical fields are stored in plain text. Bank account numbers are also logged in plain text in the `alerts` table.
- **"End-to-End Encrypted Document Vault"**: **UNSAFE.**  
  *Reason:* Documents are uploaded as raw, unencrypted binary files to Supabase Storage. The files are not encrypted before upload or at rest; only the access link generation is OTP-gated.
- **"Integrated Razorpay Penny Drop bank account validation"**: **UNSAFE.**  
  *Reason:* Penny Drop API is completely absent. The repository only calls the free public Razorpay IFSC metadata lookup endpoint (`ifsc.razorpay.com`) and performs local regex length checks.
- **"Cross-platform iOS and Android mobile app"**: **UNSAFE.**  
  *Reason:* Only the `android/` directory exists. No `ios/` folder or Xcode project exists in the repository.
- **"Integrated Google Gemini AI for smart financial analytics"**: **UNSAFE.**  
  *Reason:* `@google/genai` and `@google/generative-ai` are unused dead dependencies in `package.json`. AI features are powered exclusively by OpenRouter.
- **"Enterprise-grade automated test suite and CI/CD pipelines"**: **UNSAFE.**  
  *Reason:* There are 0 automated test suites (`package.json` has no test command) and 0 CI/CD workflows configured in the repository.
- **"Production-ready clean repository architecture"**: **UNSAFE.**  
  *Reason:* 1,538 files of `backend/node_modules` are committed to Git, 16 loose `.sql` files litter the root directory, 24 ad-hoc scratch scripts exist in `scripts/`, and an administrative Supabase service role secret was previously committed to git history.
