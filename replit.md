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
- Playlist progress tracking (`@app:playlist_progress`) - per-playlist resume data
- Daily completion stats (`@app:daily_completions`) - per-playlist daily completion tracking
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

### Audio System

**Audio Library** (`client/src/lib/audioLibrary.ts`): Centralized audio metadata management with three collections:
- **Practices**: Audio files for meditation practices (Vibration Elevation, Neurolinking, Wealth Code Activations 1 & 2)
- **Affirmations**: Guided breathwork audio (Memory Development Breath)
- **Journaling Audios**: Background music for meditation journaling (Deep Theta Music)
- Helper function `findAudioByTitle()` searches across all collections for audio file matching

**AudioPlayer Component** (`client/src/components/AudioPlayer.tsx`): Reusable HTML5 audio player with:
- Play/pause round button with visual feedback
- Seekable progress bar with gradient fill
- Time display (current time / total duration)
- Playback speed controls (1x, 1.25x, 1.5x, 2x) via dropdown Select
- Two modes:
  - `basic`: Simple playback, no progress tracking
  - `playlist`: Enables progress callbacks with 90% completion tracking
- External control props:
  - `isActive`: Allows parent to pause player when another starts
  - `onPlay`: Callback when playback starts
  - `onEnded`: Callback when audio finishes (enables sequential playback)
  - `autoPlay`: Auto-loads and plays when src changes
  - `initialTime`: Resume playback from specific position (for playlist mode)
  - `onProgressUpdate`: Callback fired during playback with time/duration (for saving progress)
  - `onComplete`: Callback fired at 90% completion (for completion tracking)

**Audio Integration Points**:
- **ProcessesPage**: Practice cards display AudioPlayer in Audio tab when audio file exists
- **SpiritualBreathsPage**: Guided affirmation section uses AudioPlayer for Memory Development Breath
- **MyPracticePlaylistPage**: Sequential playlist playback with single AudioPlayer that auto-advances through tracks, full progress tracking and resume functionality
- **MusicJournalingPage**: Each journaling track has full-featured AudioPlayer, only one plays at a time

**Technical Pattern**: 
- AudioPlayer uses HTML5 `<audio>` element, no external media libraries
- Parent components control playback via `isActive` prop to ensure single-player-at-a-time behavior
- Playlist mode supports auto-advance via `onEnded` callback and `autoPlay` prop
- Currently playing track highlighted in UI with primary color styling

**Playlist Progress System** (`client/src/lib/storage.ts`):
- **Per-Playlist Progress Tracking**: Each playlist maintains independent resume state (current track + timestamp)
- **Resume Functionality**: Users can stop a playlist and return later to continue from exact position
- **Practice Name Matching**: Progress saved using practice names from playlist (stable identifiers)
- **Throttled Saves**: Progress auto-saved every 3 seconds during playback to minimize localStorage writes
- **Immediate Track Advance**: When track ends, next track's progress immediately saved to prevent regression
- **90% Completion Rule**: Tracks marked complete when reaching 90% duration (ensures completion even if user skips final seconds)
- **Per-Playlist Daily Stats**: Completion tracking maintains separate stats for each playlist on each day
- **Progress Persistence**: 
  - Saved on manual stop (user can resume)
  - Saved during playback (every 3 seconds)
  - Saved on track advance (immediate)
  - Cleared only on playlist completion (all tracks finished)
- **Storage Keys**:
  - `@app:playlist_progress`: Map of `playlistId -> { currentTrackId, currentTime }`
  - `@app:daily_completions`: Nested map of `date -> playlistId -> { completedTracks, totalTracks }`

### Dr.M AI Video Integration

**Overview**: Custom chat interface integrated with Gradio-hosted AI video generation service at https://dr-meghana-video.wowlabz.com/

**Implementation** (`client/src/pages/DrMPage.tsx`, `client/src/lib/gradioClient.ts`):
- **Gradio Client**: Uses `@gradio/client` npm package to connect to external video generation API
- **4-Section Layout**:
  1. Compact header with Dr.M avatar and title
  2. Main video player with auto-play and subtitle support
  3. Chat history showing last 3 conversations with video thumbnails
  4. Input field with send button (always visible at bottom)
- **API Integration**: 
  - Endpoint: `/process_query` with parameters `{ user_name: string, question: string }`
  - Response: Array with [introVideo, answerVideo, relatedVideoHtml, textResponse]
  - Video extraction handles multiple possible response formats (string URLs or objects)
  - HTML stripping applied to text responses for clean display
  - Quota messages (e.g., "📊 X questions remaining") automatically filtered from chat display
- **Conversation Storage**: 
  - Key: `@app:drm_conversations`
  - Maintains last 3 conversations with full video URLs and text responses
  - Persists across page reloads
- **Loading States**: Horizontal progress bar appears during API calls (30-180 second response times)
- **Video Playback**: 
  - Auto-plays Dr.M's personalized answer video when response arrives
  - Supports optional subtitle tracks if provided by API
  - Native HTML5 video player with full controls
- **Video Thumbnails** (November 2025 update):
  - Clickable video preview (80×56px) next to each Dr.M response in chat history
  - Gradient background (purple-900 to violet-800) with centered play icon
  - Click any thumbnail to replay that video in the main player
  - Currently playing video highlighted with purple border and ring effect
  - Provides quick access to review any of the last 3 video responses

**Technical Notes**:
- Gradio API has daily usage quotas/limits
- Quota messages intelligently filtered via `isQuotaMessage()` pattern matching
- Robust video URL extraction handles multiple response structures
- Error handling with user-friendly toast notifications
- All user interactions tagged with `data-testid` attributes for testing

### Future Integration Points

Based on attached design documents and feature requests:
- **Zoom API**: For joining live masterclass sessions (links present, integration not implemented)
- **Push Notifications**: For practice reminders (UI exists but notification system not implemented)
- **Backend Progress Tracking**: `/api/track-progress` endpoint for AudioPlayer playlist mode
- **Expanded Audio Library**: Add more practice audio files, affirmations, and journaling tracks as assets become available
- **AI Insights**: Mentioned in UI with "unlocks in 7 days" - planned feature not implemented