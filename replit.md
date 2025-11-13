# Dr.M App - Wellness & Practice Management Platform

## Overview

Dr.M App is a comprehensive mobile-first wellness application designed to help users manage spiritual practices, meditation routines, and personal growth. It offers guided practices, community engagement, challenge tracking, and personalized insights for holistic well-being. The platform includes structured programs (DYD, USM), emotional mastery tools, money mindset rewiring, workshops, masterclasses, and community practice sessions. Users can track streaks, create custom playlists, participate in challenges (7, 21, 90-day), and work on their "Project of Heart" vision.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Frameworks & Tools**: React 18 with TypeScript, Vite, Wouter for routing, shadcn/ui (built on Radix UI), Tailwind CSS, Framer Motion.
**State Management**: Local component state using React hooks and localStorage for client-side persistence.
**Styling**: Mobile-first responsive design, custom CSS variables, gradient backgrounds.
**Data Fetching**: TanStack Query is configured but currently unused.

### Backend Architecture

**Server Framework**: Express.js with TypeScript.
**Current Implementation**: Minimal backend, primarily serving the frontend. Core application logic and data persistence are client-side.
**Future Considerations**: Designed with a storage abstraction layer and PostgreSQL session management for future database integration and authentication.

### Data Storage Strategy

**Current**: All user data is stored in browser localStorage (playlists, progress, challenges, preferences, streaks, "Project of Heart").
**Planned**: Migration to PostgreSQL using Drizzle ORM.

### Authentication & Authorization

**Current**: No authentication implemented (single-user client-side app).
**Future Implementation**: Planned traditional username/password authentication using Express sessions stored in PostgreSQL.

### Design System

**Typography**: Inter or DM Sans for primary text, Crimson Text or Playfair Display for quotes/headlines.
**Color Themes**: Specific gradient themes for Wellness, Calm, Energy, Growth sections.
**Component Patterns**: Fixed bottom navigation, gradient action cards, expandable practice cards, progress bars, streak calendars, modal dialogs.
**Layout**: Mobile-first with constrained container width (`max-w-md`).

### Audio System

**Overview**: Manages and plays audio content for practices, affirmations, and journaling.
**Core Components**: Centralized audio library metadata, `AudioPlayer` component (HTML5 player with play/pause, seek, speed, two modes).
**Playlist Progress**: Tracks per-playlist progress in localStorage, saves every 3 seconds, auto-advances tracks, marks complete at 90% duration.

### Dr.M AI Video Integration

**Overview**: Custom chat interface integrating with a Gradio-hosted AI video generation service.
**Functionality**: Connects to an external API (`/process_query`) for personalized video responses. Displays a 4-section layout (header, video player, chat history with thumbnails, input). Stores last 3 conversations and video URLs in localStorage. Auto-plays Dr.M's response video with optional subtitles.

### Feature Specifications

**Home Page**: Welcome header (Inter, Bold, 20pt), high-contrast yellow "JOIN NOW" button.
**Workshops Page**: "MASTERCLASSES" header (Montserrat, grey), rectangular tab system (purple active, light purple inactive). Enhanced masterclass cards with `subtitle`, `endTime`, `isLive`, improved thumbnail sizing, "LIVE" badge, larger typography, and larger purple gradient "JOIN" button.
**Project of Heart Page**: White background with "PROJECT OF HEART" title. Heart Chakra theme (#A8E6CF) preserved for specific elements. Rectangular tab system. White cards with subtle borders. Yellow primary CTAs and purple secondary actions. Typography uses Playfair Display for quotes.
**Project of Heart Card Layout**: Two-column layout: Left (70%) with authentic Anahata Heart Chakra SVG (green #5FB77D, 12 symmetrically rotated lotus petals, Star of David) and description. Right (30%) with circular progress ring around a gold star icon and an achievement badge showing star count. Milestone messages are enhanced with motivational quotes and star counts. The chakra symbol uses clean SVG design with no glowing effects or animations for a professional, spiritual aesthetic.

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

- **TanStack Query (React Query)**: Async state management and caching (configured).
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