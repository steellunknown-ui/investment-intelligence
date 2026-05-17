import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.investmentintelligence.app',
  appName: 'Investment Intelligence',
  webDir: 'out',
  server: {
    // Use live Vercel URL — this ensures we get the latest web features instantly
    url: 'https://investment-intellegince.vercel.app',
    cleartext: true, // Allow HTTP for local testing if needed, though Vercel is HTTPS
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorCookies: {
      enabled: true,
    },
  },
};

export default config;
