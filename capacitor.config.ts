import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dyd.drmeghana",
  appName: "Design Your Destiny by Dr. Meghana Dikshit",
  webDir: "dist/public",

  server: {
    // url: "https://app.drmeghana.com",
    androidScheme: "https", // fix
    hostname: "localhost", // fix
  },

  plugins: {
    CapacitorHttp: {
      enabled: true, // This patches 'fetch' to use native layer automatically
    },
    StatusBar: {
      overlaysWebView: false,
      style: "LIGHT", // Dark icons for the light content area or potentially purple bar
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: false,
    },
    SystemBars: {
      insetsHandling: "disable",
    },
    EdgeToEdge: {
      backgroundColor: "#cbb9fa",
      statusBarColor: "#cbb9fa",
      navigationBarColor: "#00000000",
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: "#cbb9fa",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#999999",
    },
  },
};

export default config;
