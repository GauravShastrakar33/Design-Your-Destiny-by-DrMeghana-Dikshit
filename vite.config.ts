import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  base: "/", // standard relative paths for capacitor

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
      polyfill: true, // 🔧 Ensure ESM polyfills are included
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-motion": ["framer-motion"],
          "vendor-pdf": ["pdfjs-dist", "react-pdf"],
          "vendor-charts": ["recharts"],
          "vendor-firebase": ["firebase/app", "firebase/messaging"],
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-accordion",
            "@radix-ui/react-slider",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-alert-dialog",
          ],
        },
      },
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
