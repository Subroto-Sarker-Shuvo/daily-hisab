import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dailyhisab.app',
  appName: 'Daily Hisab',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
