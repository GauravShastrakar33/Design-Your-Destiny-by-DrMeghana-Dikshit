import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.drm.app',
  appName: 'Dr.M App',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
