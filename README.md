# Investment Intelligence Office

Welcome to the **Investment Intelligence Office** repository. This is a comprehensive, full-stack application designed to manage, track, and provide intelligent insights into personal and family financial portfolios.

## 🚀 Overview

Investment Intelligence Office acts as a centralized hub for managing personal finance, assets, liabilities, insurance, and family financial planning. Built with modern web technologies, it offers a seamless experience across web and mobile platforms.

### Key Capabilities

*   **Asset & Liability Management**: Track investments, holdings, belongings, and debts/receivables all in one place.
*   **Banking Module**: Integrated banking details management, including bank account validations (Razorpay/Penny Drop) and IFSC code lookup.
*   **Family & Nominee Management**: Securely add family members and assign nominees to specific assets or insurance policies.
*   **Insurance Tracking**: Keep a detailed record of life, health, and property insurance policies.
*   **Document Vault**: Securely upload, encrypt, and store financial documents.
*   **AI-Powered Insights**: Uses powerful open-source models via OpenRouter to provide smart, personalized financial insights and summaries.
*   **Inactivity & Nominee Access**: Automated workflows to handle prolonged user inactivity and grant secure, limited access to nominees when necessary.
*   **100% End-to-End Encryption**: All financial numbers, balances, and history snapshots are encrypted at rest using AES-256-CBC, dynamically decrypted only when requested by authorized users.
*   **Export & Reporting**: Generate beautiful, detailed, and securely decrypted financial reports in Excel.
*   **Mobile Ready**: Cross-platform mobile app support via Capacitor.

## 🛠️ Technology Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **UI Library**: [React 18](https://reactjs.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Radix UI](https://www.radix-ui.com/) components and Framer Motion for animations.
*   **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, and Row Level Security)
*   **Mobile App**: [Capacitor](https://capacitorjs.com/) for building native Android/iOS apps from web code.
*   **Emails & Notifications**: Resend / SendGrid
*   **AI Integration**: OpenRouter API (`openrouter.ai`)
*   **Security Engine**: Native Node.js `crypto` module for AES-256 End-to-End Encryption
*   **Validation**: Zod

## 📂 Project Structure

*   `app/` - Next.js App Router containing pages and API routes (`/app/api/...`).
    *   **API Routes**: Contains endpoints for `ai`, `assets`, `auth`, `banking`, `documents`, `family`, `insurance`, `nominees`, etc.
*   `components/` - Reusable React components (UI elements, forms, layouts).
*   `lib/` - Utility functions, Supabase clients, and shared logic.
*   `supabase/` - SQL migrations, schema definitions, and Row Level Security (RLS) policies.
*   `scripts/` - Utility scripts (e.g., encryption migrations).
*   `android/` - Capacitor generated Android project files.

## ⚙️ Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/investment-intelligence-office.git
    cd investment-intelligence-office
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add the necessary environment variables (Supabase URL, API keys, etc.).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

5.  **Build for Production:**
    ```bash
    npm run build
    npm run start
    ```

## 📱 Mobile App (Capacitor)

To sync and run the mobile application:

```bash
npx cap sync
npx cap open android
```

## 🔒 Security

*   **Row Level Security (RLS)**: Enforced via Supabase to ensure users can only access their own data.
*   **End-to-End Database Encryption**: All sensitive financial figures, bank balances, asset values, and document links are encrypted using `AES-256-CBC` encryption before storage. They are never stored in plain text, ensuring maximum privacy.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the issues page.