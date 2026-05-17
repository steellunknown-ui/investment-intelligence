import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.investmentintelligence.app',
  appName: 'Investment Intelligence',
  webDir: 'out',
  server: {
    // Use live Vercel URL — no need to build static files
    url: 'https://investment-intellegince.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorCookies: {
      enabled: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: 'rmzgzczmrbooegftrzxn.supabase.co', // Use standard or Supabase client ID
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
