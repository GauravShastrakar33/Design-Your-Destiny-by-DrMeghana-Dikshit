# Dr.M App - Wellness & Practice Management Platform

## Overview

Dr.M App is a comprehensive mobile-first wellness application designed to help users manage spiritual practices, meditation routines, and personal growth. It offers guided practices, community engagement, challenge tracking, and personalized insights for holistic well-being. The platform includes structured programs, emotional mastery tools, money mindset rewiring, workshops, and community practice sessions. Users can track streaks, create custom playlists, participate in challenges, and define a "Project of Heart" for personal vision and goal-setting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with React 18 and TypeScript, using Vite for development and Wouter for client-side routing. State is managed locally with React hooks and persisted in `localStorage`. The UI is built with shadcn/ui components (based on Radix UI) and styled using Tailwind CSS, featuring a mobile-first responsive design with custom gradients and color schemes. Framer Motion is used for animations. TanStack Query is configured but not actively used, as the app primarily uses client-side localStorage.

### Backend

The backend uses Express.js with TypeScript, currently serving only the frontend with minimal active routes. A storage abstraction layer is in place for future database integration. Session management dependencies (`connect-pg-simple`) are included, anticipating future authentication with PostgreSQL.

### Data Storage Strategy

Currently, all user data (playlists, progress, challenges, beliefs, preferences, streaks, daily logs, Project of Heart) is stored in browser `localStorage`. A migration path to PostgreSQL using Drizzle ORM is planned, with schema definitions (`shared/schema.ts`) already in place.

### Authentication & Authorization

Authentication is not yet implemented, with the app operating as a single-user client-side application. Infrastructure for user authentication (schema, Zod validation, session storage dependencies) is prepared for future integration with Express sessions and PostgreSQL.

### Design System

The app uses Inter or DM Sans for primary text and Crimson Text or Playfair Display for headings. Color themes include various gradients (Wellness, Calm, Energy, Growth). Common components include a bottom navigation bar, gradient action cards, expandable practice cards, progress bars, and modal dialogs, all adhering to a mobile-first layout with consistent spacing.

### Audio System

An integrated audio system features a centralized `audioLibrary.ts` for managing audio metadata (Practices, Affirmations, Journaling Audios). The `AudioPlayer` component provides playback controls (play/pause, seek, speed) and supports two modes: `basic` and `playlist`. The `playlist` mode offers advanced features like 90% completion tracking, progress saving, resume functionality, and daily completion statistics, all persisted in `localStorage`.

### Dr.M AI Assistant Integration

The Dr.M AI Assistant is a Gradio-powered wellness assistant integrated via `@gradio/client`. It features a split-layout interface (video display top 65%, form bottom 35%). Users submit questions via a form, and the assistant responds with video content. The integration handles various Gradio response formats and includes loading, error, and welcome states. It prioritizes user experience with a persistent form, automatic workflow, and robust error handling with fallback options to the Gradio interface.

## External Dependencies

### Third-Party UI Libraries

- **Radix UI**: Accessible component primitives.
- **shadcn/ui**: Pre-built components based on Radix UI and Tailwind CSS.
- **Lucide React**: Icon library.
- **Embla Carousel**: Carousel/slider functionality.

### Animation & Interaction

- **Framer Motion**: Declarative animations for UI elements.

### Forms & Validation

- **React Hook Form**: Form state management.
- **@hookform/resolvers**: Integration with Zod.
- **Zod**: TypeScript-first schema validation.
- **drizzle-zod**: Bridge between Drizzle ORM schemas and Zod.

### Data Management

- **TanStack Query (React Query)**: Configured for async state management (not actively used).
- **date-fns**: Date manipulation and formatting.

### Database & ORM

- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **@neondatabase/serverless**: Neon database driver.
- **drizzle-kit**: CLI for database migrations.

### Styling

- **Tailwind CSS**: Utility-first CSS framework.
- **tailwindcss-animate**: Animation utilities for Tailwind.
- **class-variance-authority**: Type-safe variant management.
- **clsx** + **tailwind-merge**: Class name composition utilities.

### Build Tools

- **Vite**: Fast build tool and dev server.
- **TypeScript**: Type safety.
- **esbuild**: JavaScript bundler.
- **PostCSS**: CSS processing.

### Replit-Specific Integrations

- **@replit/vite-plugin-runtime-error-modal**: Development error overlay.
- **@replit/vite-plugin-cartographer**: Code exploration tool.
- **@replit/vite-plugin-dev-banner**: Development mode banner.

### AI Integration

- **@gradio/client**: Library for integrating with Gradio applications.