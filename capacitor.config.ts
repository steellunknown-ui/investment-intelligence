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
      serverClientId: '6113114125-o92r0usael55l08m75kvtfsm8lji4veg.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    Preferences: {
      group: 'InvestmentIntelligence',
    },
  },
};

export default config;
