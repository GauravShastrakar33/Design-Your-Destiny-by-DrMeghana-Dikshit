import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dyd.drmeghana',
  appName: 'Design Your Destiny by Dr. Meghana Dikshit',
  webDir: 'dist/public',
  server: {
    url: 'https://app.drmeghana.com',
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      overlay: false,
    },
  },
};

export default config;


