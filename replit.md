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

**Profile Page** (Updated November 2025): Clean design with light gray page background (#F3F3F3) and white cards. Purple accent color (#703DFA) for icons. Features reordered sections: Profile Card → Streak Calendar → AI Insights → My Prescription → Settings.
- **Page Background**: Light gray (#F3F3F3) creating contrast with white cards
- **Profile Card**: Full-width gradient background with centered content (max-w-md), reduced padding (py-4), bold "PROFILE" header (text-xl, Montserrat font), Playfair_Display font for karmic affirmation quote
- **AI Insights Card**: White background, black title (uppercase, left-aligned), dark gray description, purple Sparkles icon right, full card clickable with navigation to /ai-insights, gray ChevronRight indicator
- **My Prescription Card**: White background, black title (uppercase, left-aligned), dark gray description, purple Heart icon right, expandable/collapsible to show/hide prescription details (Morning/Afternoon/Evening practices), purple ChevronDown indicator rotates on toggle
- **Settings Card**: White background, black title (uppercase, left-aligned), dark gray description, purple Settings icon right, all options visible by default (Account, Notifications, Get Support, Logout), only Account submenu expandable with reset options. All icons purple except Logout (red)

**AI Insights Page** (Updated November 2025): Clean design with light gray page background (#F3F3F3) and white cards. Purple accent color (#703DFA) for icons and active states. Features practice tracking insights with weekly and monthly views.
- **Page Background**: Light gray (#F3F3F3) creating contrast with white cards
- **Header**: White background, sticky at top, grey bold uppercase title "AI INSIGHTS" (Montserrat font), no emoji, grey back arrow button
- **View Toggle (Segmented Buttons)**: White container, two buttons (Weekly View / Monthly View). Active state: purple background (#703DFA) with white text. Inactive state: grey text on white background
- **Weekly View Cards**: All cards white background with purple icons (#703DFA). Playlist cards show Music icon, Process Checklist card shows CheckSquare icon. Cards display practice activity and most practiced items
- **Monthly View Card**: White background, title shows "{Month} {Year} Progress" (no emoji), purple Music icon for Playlist Practices section, purple CheckSquare icon for Process Checklist section, horizontal progress bars, inspirational quote (no emoji)

**Project of Heart Page**: White background with "PROJECT OF HEART" title. Heart Chakra theme (#A8E6CF) preserved for specific elements. Rectangular tab system. White cards with subtle borders. Yellow primary CTAs (#E5AC19) and purple secondary actions. Typography uses Playfair Display for quotes.
- **Journey Tab**: "Start Your Journey" button features reduced height (size="sm"), 92% width (w-11/12), centered with mx-auto, yellow background (#E5AC19), rounded pill shape
- **Vision Tab**: Two-column layout: Left (70%) with authentic Anahata Heart Chakra SVG (green #5FB77D, 12 symmetrically rotated lotus petals, Star of David) and description. Right (30%) with circular progress ring around a gold star icon and an achievement badge showing star count. The chakra symbol uses clean SVG design with no glowing effects or animations for a professional, spiritual aesthetic.

**Project of Heart Milestones** (Updated November 2025):
- **Star Progression**: Maximum 6 stars (Vision: 1, Cycle 1: +1, Cycle 2: +2, Cycle 3: +2)
- **Milestone Display**: Purple auto-checking checkboxes (#703DFA) with star emojis
  - ⭐ Set Project of Heart — Your first star begins here. (1+ stars)
  - ⭐⭐ Cycle 1 — You took the first step. (2+ stars)
  - ⭐⭐⭐⭐ Cycle 2 — You stayed consistent. (4+ stars)
  - ⭐⭐⭐⭐⭐⭐ Cycle 3 — You grew stronger. (6+ stars)
- **Self-Evaluation**: No longer awards stars, serves as reflection tool only
- **Progress Ring**: Fills based on 6 max stars (100% at 6 stars)

**Processes Page** (Updated November 2025): Organized practice structure with collapsible category dropdowns for DYD tab. Clean design with light gray page background (#F3F3F3) and white cards. Purple accent color (#703DFA) for icons.
- **Page Background**: Light gray (#F3F3F3) creating contrast with white cards
- **Header**: White background, sticky at top, grey bold uppercase title "PROCESSES" (Montserrat font), grey back arrow button
- **Segmented Control**: Custom rectangular buttons (rounded-lg). Active state: purple background (#703DFA) with white text. Inactive state: grey text on transparent background
- **DYD Tab**: Practices grouped into expandable categories using Radix UI Collapsible
  - **Wealth Code Activation** (4 practices): WCA 1-4
  - **Birth story-Specialisation** (6 practices): Birth Story Healing, Adoption, Miscarriage, Cesarean, Clearing the Birth Energy, Pre-Birth Story Process
  - **Anxiety Relief Code** (2 practices): ARC 1-2
  - **Happiness Code Activation** (2 practices): HAC 1-2
  - **Story Burning** (standalone practice)
- **USM Tab**: Flat list of 9 individual practices (Recognition, Vibration Elevation, Neurolinking, EET, Hoponopono, Soul Connection, Donald Duck, Inner Child Healing, Journaling)
- **Category Cards**: White background, purple icons (#703DFA) without background circles, purple chevron, dark text (grey-900)
- **Practice Cards**: White background, purple icons (#703DFA) without background circles, purple chevron, dark text (grey-900)
- **Category Interaction**: Click category header to expand/collapse sub-practices. Chevron rotates 180° when expanded. Sub-practices indented (ml-4). Multiple categories can be open simultaneously
- **Technical Implementation**: Container uses `key={selectedCategory}` to force complete re-render when switching tabs, preventing React reconciliation issues with Collapsible components

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