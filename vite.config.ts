import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],

  base: "./", // standard relative paths for capacitor

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  root: path.resolve(import.meta.dirname, "client"),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2020", // 📱 Better compatibility for older Android WebViews
    modulePreload: {
      polyfill: true // 🔧 Ensure ESM polyfills are included
    },
  },

  publicDir: path.resolve(import.meta.dirname, "client/public"),

  server: {
    fs: {
      strict: false, // ✅ allow serving files outside root (important for Replit public)
    },
    port: 5173, // optional: helps when debugging locally
  },
});
