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
      serverClientId: '143187123616-9q2o9g0i7j1u0g7u5u2u2u2u2u2u2u2u.apps.googleusercontent.com', // Placeholder - User needs to provide real Web Client ID
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
