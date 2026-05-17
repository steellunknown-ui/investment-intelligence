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
      serverClientId: '6113114125-o92r0usael55l08m75kvtfsm8lji4veg.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
