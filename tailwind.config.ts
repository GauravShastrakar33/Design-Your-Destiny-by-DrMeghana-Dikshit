import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: ".5625rem" /* 9px */,
        md: ".375rem" /* 6px */,
        sm: ".1875rem" /* 3px */,
      },
      backgroundImage: {
        "gradient-wellness":
          "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(280 65% 48%) 100%)",
        "gradient-calm":
          "linear-gradient(135deg, hsl(195 85% 48%) 0%, hsl(240 65% 55%) 100%)",
        "gradient-energy":
          "linear-gradient(135deg, hsl(40 85% 52%) 0%, hsl(0 72% 48%) 100%)",
        "gradient-growth":
          "linear-gradient(135deg, hsl(160 70% 45%) 0%, hsl(195 85% 42%) 100%)",

        // New Additions 👇
        "gradient-focus":
          "linear-gradient(135deg, hsl(260 70% 50%) 0%, hsl(220 80% 55%) 100%)",
        "gradient-sunrise":
          "linear-gradient(135deg, hsl(20 90% 65%) 0%, hsl(45 95% 70%) 100%)",
        "gradient-harmony":
          "linear-gradient(135deg, hsl(280 55% 75%) 0%, hsl(330 70% 85%) 100%)",
        "gradient-ocean":
          "linear-gradient(135deg, hsl(200 80% 50%) 0%, hsl(180 65% 55%) 100%)",
        "gradient-mystic":
          "linear-gradient(135deg, hsl(260 60% 60%) 0%, hsl(200 60% 50%) 100%)",

        "gradient-forest":
          "linear-gradient(135deg, hsl(150 50% 40%) 0%, hsl(170 60% 45%) 100%)", // Deep green → mint
        "gradient-desert":
          "linear-gradient(135deg, hsl(30 80% 70%) 0%, hsl(15 70% 60%) 100%)", // Sand → warm terracotta
        "gradient-lavender":
          "linear-gradient(135deg, hsl(260 45% 80%) 0%, hsl(280 55% 70%) 100%)", // Pale lavender → lilac
        "gradient-fire":
          "linear-gradient(135deg, hsl(0 85% 55%) 0%, hsl(25 90% 55%) 100%)", // Red → Orange
        "gradient-royal":
          "linear-gradient(135deg, hsl(250 60% 55%) 0%, hsl(260 45% 40%) 100%)", // Purple → Deep violet
        "gradient-peace":
          "linear-gradient(135deg, hsl(200 60% 90%) 0%, hsl(210 55% 75%) 100%)", // Pale blue → powder blue
        "gradient-blossom":
          "linear-gradient(135deg, hsl(340 80% 90%) 0%, hsl(350 70% 80%) 100%)", // Rose → soft pink
        "gradient-night":
          "linear-gradient(135deg, hsl(220 50% 25%) 0%, hsl(260 50% 30%) 100%)", // Deep blue → indigo
      },
      colors: {
        // Flat / base colors (regular buttons)
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        brand: {
          DEFAULT: "hsl(var(--brand-purple) / <alpha-value>)",
          foreground: "hsl(var(--brand-purple-foreground) / <alpha-value>)",
          border: "var(--brand-purple-border)",
        },
        "page-bg": "hsl(var(--page-background) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)",
        },
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
