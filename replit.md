# Dr.M App - Wellness & Practice Management Platform

## Overview

Dr.M App is a comprehensive mobile-first wellness application designed to help users manage their spiritual practices, meditation routines, and personal growth journeys. The app combines guided practices, community engagement, challenge tracking, and personalized insights to support holistic well-being.

The platform offers structured programs (DYD - Design Your Destiny, USM - Universal Success Meditation), emotional mastery tools, money mindset rewiring, workshops/masterclasses, and community practice sessions. Users can track streaks, create custom playlists, participate in challenges (7-day, 21-day, 90-day), and work on their "Project of Heart" - a personal vision and goal-setting framework.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter is used for client-side routing, providing a lightweight alternative to React Router. All routes are defined in `client/src/App.tsx` with a component-based structure.

**State Management**: 
- Local component state using React hooks (useState, useEffect)
- LocalStorage for client-side persistence of user data (playlists, beliefs, challenges, streak data, preferences)
- No global state management library - data is managed at the component level and persisted to localStorage

**UI Component Library**: shadcn/ui components built on Radix UI primitives, providing accessible, customizable components. The design system uses Tailwind CSS with custom color schemes and gradients inspired by premium wellness apps (Calm, Headspace, Peloton).

**Styling Approach**:
- Tailwind CSS for utility-first styling
- Custom CSS variables for theming (light/dark mode support)
- Mobile-first responsive design with max-width container (max-w-md)
- Custom gradient backgrounds for different app sections (wellness, calm, energy, growth)

**Animation**: Framer Motion for smooth transitions, card interactions, and micro-animations.

**Data Fetching**: TanStack Query (React Query) is configured but currently unused. The app is primarily client-side with localStorage persistence.

### Backend Architecture

**Server Framework**: Express.js with TypeScript, serving both API endpoints and the Vite-built frontend in production.

**Current Implementation**: Minimal backend - the server is scaffolded but has no active routes. All functionality is currently client-side with localStorage.

**Storage Interface**: A storage abstraction layer (`server/storage.ts`) with an in-memory implementation (`MemStorage`) is defined but not utilized. This provides a foundation for future database integration.

**Session Management**: Dependencies for `connect-pg-simple` are included for PostgreSQL session storage, indicating planned authentication functionality.

### Data Storage Strategy

**Current**: All user data is stored in browser localStorage:
- Practice playlists (`dr-m-playlists`)
- Challenge progress (`@app:active_challenge`, `@app:challenge_history`)
- Belief pairs for rewiring (`@app:rewiring_beliefs`)
- User preferences (karmic affirmation, accountability partner, streak visibility)
- Streak tracking data
- Daily practice logs
- Project of Heart vision and reflections

**Planned**: PostgreSQL database via Drizzle ORM. Configuration exists (`drizzle.config.ts`) for schema-based migrations with a simple user table defined in `shared/schema.ts`.

**Design Decision**: Starting with localStorage allows rapid prototyping and offline-first functionality. Migration path to PostgreSQL is prepared through the storage abstraction layer and Drizzle schema definitions.

### Authentication & Authorization

**Current State**: No authentication implemented. The app operates as a single-user client-side application.

**Prepared Infrastructure**: 
- User schema defined in `shared/schema.ts` with username/password fields
- Zod validation schemas for user input
- Session storage dependencies installed

**Future Implementation**: Traditional username/password authentication with Express sessions stored in PostgreSQL.

### Design System

**Typography**: Inter or DM Sans for primary text, with Crimson Text or Playfair Display for quotes/headlines. Font loading configured via Google Fonts.

**Color Themes**:
- Wellness gradient: Purple to violet
- Calm gradient: Blue to indigo  
- Energy gradient: Orange to red
- Growth gradient: Teal to cyan

**Component Patterns**:
- Bottom navigation bar (fixed, 5 tabs)
- Action cards with gradients and icons
- Expandable practice cards with video/audio/script formats
- Progress bars and streak calendars
- Modal dialogs for data entry and confirmations

**Layout System**: Mobile-first with consistent spacing units (3, 4, 6, 8, 12, 16). Container width constrained to max-w-md for optimal mobile viewing.

## External Dependencies

### Third-Party UI Libraries

- **Radix UI**: Comprehensive set of accessible component primitives (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, tooltip, toggle)
- **shadcn/ui**: Pre-built components using Radix UI and Tailwind CSS (configured in `components.json`)
- **Lucide React**: Icon library for consistent iconography throughout the app
- **cmdk**: Command menu component (included but not visibly used in current implementation)
- **Embla Carousel**: Carousel/slider functionality for horizontal scrolling content

### Animation & Interaction

- **Framer Motion**: Declarative animations for page transitions, card interactions, progress animations, and micro-interactions

### Forms & Validation

- **React Hook Form**: Form state management (dependency present, usage limited)
- **@hookform/resolvers**: Integration between React Hook Form and Zod
- **Zod**: TypeScript-first schema validation
- **drizzle-zod**: Bridge between Drizzle ORM schemas and Zod validation

### Data Management

- **TanStack Query (React Query)**: Async state management and caching (configured but not actively used)
- **date-fns**: Date manipulation and formatting library

### Database & ORM

- **Drizzle ORM**: TypeScript ORM for PostgreSQL with type-safe queries
- **@neondatabase/serverless**: Neon database driver for serverless PostgreSQL (indicates planned Neon deployment)
- **drizzle-kit**: CLI tool for database migrations and schema management

### Styling

- **Tailwind CSS**: Utility-first CSS framework
- **tailwindcss-animate**: Animation utilities for Tailwind
- **class-variance-authority**: Type-safe variant management for components
- **clsx** + **tailwind-merge**: Class name composition utilities

### Build Tools

- **Vite**: Fast build tool and dev server with React plugin
- **TypeScript**: Type safety across the codebase
- **esbuild**: JavaScript bundler used for server-side build
- **PostCSS**: CSS processing with Autoprefixer

### Replit-Specific Integrations

- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code exploration tool
- **@replit/vite-plugin-dev-banner**: Development mode banner

### Future Integration Points

Based on attached design documents and feature requests:
- **Zoom API**: For joining live masterclass sessions (links present, integration not implemented)
- **Push Notifications**: For practice reminders (UI exists but notification system not implemented)
- **Video/Audio Streaming**: Embedded players for practice content (placeholders exist)
- **AI Insights**: Mentioned in UI with "unlocks in 7 days" - planned feature not implemented