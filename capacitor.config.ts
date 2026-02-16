import type { CapacitorConfig } from "@capacitor/cli";


const config: CapacitorConfig = {
  appId: "com.dyd.drmeghana",
  appName: "Design Your Destiny by Dr. Meghana Dikshit",
  webDir: "dist/public",

  server: {
    // url: "https://app.drmeghana.com",
    androidScheme: "https",  // fix
    hostname: "localhost", // fix
  },

  plugins: {
    CapacitorHttp: {
      enabled: true, // This patches 'fetch' to use native layer automatically
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#703DFA",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: "#703DFA",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#999999",
    },
  },


};

export default config;
