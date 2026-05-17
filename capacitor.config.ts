import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.investmentintelligence.app',
  appName: 'Investment Intelligence',
  webDir: 'out',
  server: {
    url: 'https://investment-intellegince.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: 'REPLACE_WITH_YOUR_GOOGLE_WEB_CLIENT_ID',
      forceCodeForRefreshToken: true,
    },
    Preferences: {
      group: 'InvestmentIntelligence',
    },
  },
};

export default config;
