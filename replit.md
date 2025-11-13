# Dr.M App - Wellness & Practice Management Platform

## Overview

Dr.M App is a comprehensive mobile-first wellness application designed to help users manage spiritual practices, meditation routines, and personal growth. It offers guided practices, community engagement, challenge tracking, and personalized insights for holistic well-being. The platform includes structured programs (DYD, USM), emotional mastery tools, money mindset rewiring, workshops, masterclasses, and community practice sessions. Users can track streaks, create custom playlists, participate in challenges (7, 21, 90-day), and work on their "Project of Heart" vision.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Home Page Styling Updates (November 2025)

**Welcome Header**:
- **Font**: Changed from "Bebas Neue" to Inter, Bold
- **Font Size**: 20pt (text-xl)
- **Text**: "Welcome back, Champion 🎖️"

**JOIN NOW Button**:
- **Background**: Yellow (#E5AC19) - changed from purple gradient
- **Text Color**: Dark (#0D131F) - changed from white
- **Font**: Inter, 20pt (text-xl), Bold
- **Border Radius**: Fully rounded (rounded-full) - changed from rounded-xl
- **Visual**: High contrast (8.3:1 ratio), prominent yellow button with dark text

### Workshops Page Complete Redesign (November 2025)

**Header Section**:
- **Title**: "MASTERCLASSES" in grey (text-gray-500), Montserrat font, left-aligned with px-6 padding for good left margin
- **Separator Line**: Horizontal grey line (border-gray-200) added between header and tab section
- **Icons**: Purple search/notification icons with light purple circular backgrounds on the right

**Tab System**:
- **Shape**: Rectangular with rounded corners (rounded-md, 6px border-radius) - changed from pill shape
- **Active Tab**: Purple background (#703DFA) with white text
- **Inactive Tabs**: Light purple background (#F3F0FF) with grey text
- Balanced spacing with pt-3 added after separator line

**Upcoming Masterclass Cards**:
- **Data Model**: Enhanced with `subtitle`, `endTime`, and `isLive` fields
- **Thumbnail**: 
  - Height h-44 (176px) - optimized for card balance
  - Red "LIVE" badge positioned top-right on live sessions (bg-red-500, white bold text)
- **Info Section Layout**:
  - **Row 1**: Calendar icon (w-4 h-4, purple) + Date (text-sm, font-medium) on left, Timing (text-xs, smaller) on right, all on same line
  - **Row 2**: Title (text-base, bold) + Subtitle (text-sm, truncated) on left, JOIN button on right
- **Typography**: All sizes increased for better readability
  - Calendar date: text-sm
  - Timing: text-xs (smaller than date)
  - Title: text-base
  - Subtitle: text-sm
- **JOIN Button**: Larger size (px-4 py-2, text-sm), purple gradient, shows only on live sessions
- **Visual Styling**: White cards, rounded corners, subtle borders, reduced spacing for compact appearance

### Project of Heart Page Theme Update (November 2025)

**Header Section**:
- **Background**: White with back button for navigation
- **Title**: "PROJECT OF HEART" in Montserrat font (all caps, grey text-gray-500)
- **Layout**: Centered title with back button on left

**Page Background**:
- **Color**: Standardized to #F3F3F3 to match homepage and other pages

**Special Preservation**:
- **Heart Chakra**: Green heart chakra theme (#A8E6CF) intentionally preserved for heart icon and related elements

**Tabs System**:
- **Style**: Rectangular with rounded corners (matching Workshops page)
- **Active Tab**: Purple background (#703DFA) with white text
- **Inactive Tabs**: Light purple background (#F3F0FF) with grey text

**Cards**:
- **Background**: White with subtle borders
- **Styling**: Clean, consistent cards across all tabs (Vision, Journey, Reflect)

**Button Color Scheme**:
- **Primary CTAs**: Yellow (#E5AC19) with dark text (#0D131F)
  - "Set Vision & Earn ⭐"
  - "Begin Self-Evaluation"
  - "Start Your Journey"
  - "Commit to Action"
  - "Complete Reflection & Earn 🏅"
- **Secondary Actions**: Purple (#703DFA) with white text
  - "Save Reflection"
  - Edit buttons (ghost variant)

**Typography**:
- **Headings**: Dark color (#3D3D3D) using Playfair Display for quotes
- **Body Text**: Medium grey (#6B7280) for secondary information
- **Labels**: Light grey for form labels and metadata

### Project of Heart Page Refinements (November 2025)

**Growth Card Improvements**:
- **Spacing**: Reduced top padding from py-6 to py-3 for tighter header-to-card spacing
- **Layout**: Removed "Your growth" header text; stars count now displays below the circular progress indicator (vertically centered)
- **Milestones**: Removed all checkmark icons for cleaner appearance

**Milestone Messages - Enhanced Motivation**:
- **Structure**: Each milestone now has clear visual hierarchy with larger font (text-sm) and increased spacing (space-y-2)
- **First Milestone**: "Set PROJECT OF HEART" (bold, dark color #3D3D3D)
- **Cycle Milestones**: Motivational quotes in purple italic bold (#703DFA) with star counts on separate line below:
  - "You showed up for yourself." → 4 stars
  - "You stayed consistent." → 8 stars
  - "You transformed." → 12 stars
- **Final Milestone**: "Self Evaluate Golden Star" (bold, dark color)

**Journey Tab**:
- **Button**: "Start Your Journey" made smaller (py-3 instead of h-24) and more rounded (2rem border-radius)
- **Cleanup**: Removed blinking affirmations text from bottom of page for cleaner design

**Reflect Tab**:
- **Quote Card**: Changed background from grey (#F5F5F5) to purple (#703DFA) with white text
- **Completion Icon**: Uses Award icon instead of checkmark for self-evaluation completion

## System Architecture

### Frontend Architecture

**Frameworks & Tools**: React 18 with TypeScript, Vite, Wouter for routing, shadcn/ui (built on Radix UI) for components, Tailwind CSS for styling, Framer Motion for animations.
**State Management**: Primarily local component state using React hooks and localStorage for client-side persistence of user data (playlists, challenges, preferences, streaks). No global state management library is currently used.
**Styling**: Mobile-first responsive design, custom CSS variables, and gradient backgrounds for different app sections (wellness, calm, energy, growth).
**Data Fetching**: TanStack Query (React Query) is configured but currently unused, as functionality is client-side.

### Backend Architecture

**Server Framework**: Express.js with TypeScript.
**Current Implementation**: Minimal backend; primarily serves the frontend. All core application logic and data persistence are currently client-side.
**Future Considerations**: Designed with a storage abstraction layer (`server/storage.ts`) and PostgreSQL session management dependencies for future database integration and authentication.

### Data Storage Strategy

**Current**: All user data is stored in browser localStorage. This includes practice playlists, progress tracking, daily completions, challenge progress, beliefs, user preferences, streak data, and "Project of Heart" details.
**Planned**: Migration to PostgreSQL using Drizzle ORM. A basic user table schema is already defined (`shared/schema.ts`).
**Design Decision**: Starting with localStorage enables rapid prototyping and offline functionality, with a prepared migration path to PostgreSQL.

### Authentication & Authorization

**Current**: No authentication implemented; the app functions as a single-user client-side application.
**Future Implementation**: Planned traditional username/password authentication using Express sessions stored in PostgreSQL, with user schemas and Zod validation already in place.

### Design System

**Typography**: Inter or DM Sans for primary text, Crimson Text or Playfair Display for quotes/headlines.
**Color Themes**: Utilizes specific gradient themes for different sections (Wellness, Calm, Energy, Growth).
**Component Patterns**: Includes a fixed bottom navigation bar, gradient action cards, expandable practice cards (video/audio/script), progress bars, streak calendars, and modal dialogs.
**Layout**: Mobile-first with constrained container width (`max-w-md`) for optimal mobile viewing.

### Audio System

**Overview**: Manages and plays audio content for practices, affirmations, and journaling.
**Core Components**:
- **Audio Library**: Centralized metadata for practices, affirmations, and journaling audios.
- **AudioPlayer Component**: Reusable HTML5 audio player with play/pause, seek bar, time display, playback speed control, and two modes (`basic`, `playlist`).
**Integration Points**: Used across various pages for meditation practices, guided affirmations, and background music.
**Playlist Progress System**: Tracks per-playlist progress (current track + timestamp) in localStorage, saves progress every 3 seconds, advances tracks automatically, and marks tracks complete at 90% duration.

### Dr.M AI Video Integration

**Overview**: Custom chat interface integrating with a Gradio-hosted AI video generation service.
**Functionality**:
- Connects to an external API (`/process_query`) to generate personalized video responses from Dr.M.
- Displays a 4-section layout: header, main video player, chat history (last 3 conversations with video thumbnails), and input field.
- Stores the last 3 conversations and video URLs in localStorage.
- Auto-plays Dr.M's response video and supports optional subtitles.
- Provides clickable video thumbnails in chat history to replay videos.
- Handles API loading states and filters quota messages.

## External Dependencies

### Third-Party UI Libraries

- **Radix UI**: Accessible component primitives.
- **shadcn/ui**: Components built on Radix UI and Tailwind CSS.
- **Lucide React**: Icon library.
- **Embla Carousel**: Carousel/slider functionality.

### Animation & Interaction

- **Framer Motion**: Declarative animations for UI elements.

### Forms & Validation

- **React Hook Form**: Form state management.
- **Zod**: TypeScript-first schema validation.
- **drizzle-zod**: Bridge between Drizzle ORM and Zod.

### Data Management

- **TanStack Query (React Query)**: Async state management and caching (configured).
- **date-fns**: Date manipulation and formatting.

### Database & ORM

- **Drizzle ORM**: TypeScript ORM for PostgreSQL.
- **@neondatabase/serverless**: Neon database driver for serverless PostgreSQL.
- **drizzle-kit**: Database migrations and schema management.

### Styling

- **Tailwind CSS**: Utility-first CSS framework.
- **tailwindcss-animate**: Animation utilities for Tailwind.
- **class-variance-authority**: Type-safe variant management.
- **clsx** + **tailwind-merge**: Class name composition.

### Build Tools

- **Vite**: Fast build tool and dev server.
- **TypeScript**: Type safety.
- **esbuild**: JavaScript bundler for server-side.
- **PostCSS**: CSS processing.

### Replit-Specific Integrations

- **@replit/vite-plugin-runtime-error-modal**: Development error overlay.
- **@replit/vite-plugin-cartographer**: Code exploration tool.
- **@replit/vite-plugin-dev-banner**: Development mode banner.

### AI Video Service

- **@gradio/client**: For connecting to the external Dr.M AI video generation API (https://dr-meghana-video.wowlabz.com/).