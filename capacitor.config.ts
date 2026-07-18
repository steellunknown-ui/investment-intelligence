import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Switch between local dev server and Vercel production.
 *
 * To develop locally:
 *   set CAPACITOR_ENV=development   (Windows CMD)
 *   $env:CAPACITOR_ENV="development" (PowerShell)
 *   then: npx cap sync
 *   then: Run from Android Studio
 *
 * Your phone MUST be on the same WiFi as this PC (10.69.27.149).
 *
 * For production just push to GitHub — Vercel handles it automatically.
 */
const isDev = process.env.CAPACITOR_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.investmentintelligence.app',
  appName: 'Investment Intelligence',
  webDir: 'out',
  server: isDev
    ? {
        // ── LOCAL DEV ─────────────────────────────────────────────────────
        // Points to your Next.js dev server running on this machine.
        // Make sure `npm run dev` is running before you launch from Android Studio.
        url: 'http://10.69.27.149:3000',
        cleartext: true,   // Allow plain HTTP on local network
      }
    : {
        // ── PRODUCTION (Vercel) ───────────────────────────────────────────
        url: 'https://investment-intellegince.vercel.app',
        cleartext: false,
      },
  android: {
    allowMixedContent: isDev, // Allow mixed content only in dev
    backgroundColor: '#ffffff',
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '6113114125-o92r0usael55l08m75kvtfsm8lji4veg.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    Preferences: {
      group: 'InvestmentIntelligence',
    },
  },
};

export default config;
