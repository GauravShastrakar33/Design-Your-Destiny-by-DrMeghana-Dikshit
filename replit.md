# Dr.M App - Wellness & Practice Management Platform

## Overview
Dr.M App is a comprehensive mobile-first wellness application designed to help users manage spiritual practices, meditation routines, and personal growth. It offers guided practices, community engagement, challenge tracking, and personalized insights for holistic well-being. The platform includes structured programs, emotional mastery tools, money mindset rewiring, workshops, masterclasses, and community practice sessions. Users can track streaks, create custom playlists, participate in challenges, and work on their "Project of Heart" vision.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: Mobile-first responsive design with a focus on constrained container width (`max-w-md`).
- **Typography**: Inter or DM Sans for primary text, Crimson Text or Playfair Display for quotes/headlines.
- **Color Themes**: Specific gradient themes for Wellness, Calm, Energy, Growth sections; purple accent color (#703DFA) for active states and icons; light gray page background (#F3F3F3) with white cards.
- **Component Patterns**: Fixed bottom navigation, gradient action cards, expandable practice cards, progress bars, streak calendars, modal dialogs, segmented controls.
- **Project of Heart**: Incorporates authentic Anahata Heart Chakra SVG with 12 lotus petals and Star of David for the Vision tab.
- **Admin Panel**: Desktop-optimized interface with sidebar navigation, distinct from the mobile app's UI.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Vite, Wouter for routing, shadcn/ui (Radix UI), Tailwind CSS, Framer Motion for animations. State managed using React hooks and localStorage.
- **Backend**: Express.js with TypeScript, currently minimal, serving frontend and community practice sessions. Designed for future database integration and authentication.
- **Data Storage**: Hybrid approach using browser localStorage for user-specific data (playlists, progress, preferences) and PostgreSQL with Drizzle ORM for community practice sessions.
- **Authentication**: Admin panel uses password-based authentication with Bearer tokens; public app is authentication-free. Server-side middleware (`requireAdmin`) protects admin CRUD endpoints.
- **Audio System**: Manages audio playback via an `AudioPlayer` component (HTML5), tracks per-playlist progress in localStorage, and auto-advances tracks.
- **AI Video Integration**: Custom chat interface connecting to an external Gradio-hosted AI video generation service (`/process_query`) for personalized video responses. Stores conversation history and video URLs in localStorage.

### Feature Specifications
- **Home Page**: Welcome header, high-contrast "JOIN NOW" button.
- **Workshops Page**: "MASTERCLASSES" header, rectangular tab system, enhanced masterclass cards with live indicators and larger typography.
- **Profile Page**: Reordered sections: Profile Card, Streak Calendar, AI Insights, My Prescription, Settings. Features a full-width gradient profile card, clickable AI Insights card, expandable My Prescription card, and settings options.
- **AI Insights Page**: Practice tracking insights with weekly and monthly views, segmented view toggle, and dedicated cards for playlists and process checklists.
- **Project of Heart Page**: White background with "PROJECT OF HEART" title, heart chakra theme, rectangular tab system. Features a "Start Your Journey" button, a two-column Vision tab with Anahata Heart Chakra SVG and progress ring, and milestone tracking (up to 6 stars).
- **Processes Page**: Organizes practices into collapsible categories (e.g., Wealth Code Activation, Birth story-Specialisation) for the DYD tab, and a flat list for the USM tab. Uses Radix UI Collapsible components.
- **Community Practices Page**: Displays real-time community practice sessions fetched from a PostgreSQL database, with session cards and "JOIN" functionality opening meeting links.
- **Admin Panel**: Desktop-optimized interface for managing platform features. Includes a dashboard, sidebar navigation, and full CRUD management for Community Practices (sessions) via a table interface. Placeholder sections for other features.

## External Dependencies

### Third-Party UI Libraries
- **Radix UI**: Accessible component primitives.
- **shadcn/ui**: Components built on Radix UI and Tailwind CSS.
- **Lucide React**: Icon library.
- **Embla Carousel**: Carousel/slider functionality.

### Animation & Interaction
- **Framer Motion**: Declarative animations.

### Forms & Validation
- **React Hook Form**: Form state management.
- **Zod**: TypeScript-first schema validation.
- **drizzle-zod**: Bridge between Drizzle ORM and Zod.

### Data Management
- **TanStack Query (React Query)**: Async state management and caching.
- **date-fns**: Date manipulation and formatting.

### Database & ORM
- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **@neondatabase/serverless**: Neon database driver.
- **drizzle-kit**: Database migrations.

### Styling
- **Tailwind CSS**: Utility-first CSS framework.
- **tailwindcss-animate**: Animation utilities.
- **class-variance-authority**: Type-safe variant management.
- **clsx** + **tailwind-merge**: Class name composition.

### Build Tools
- **Vite**: Fast build tool and dev server.
- **TypeScript**: Type safety.
- **esbuild**: JavaScript bundler.
- **PostCSS**: CSS processing.

### Replit-Specific Integrations
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay.
- **@replit/vite-plugin-cartographer**: Code exploration tool.
- **@replit/vite-plugin-dev-banner**: Development mode banner.

### AI Video Service
- **@gradio/client**: For connecting to the external Dr.M AI video generation API (https://dr-meghana-video.wowlabz.com/).