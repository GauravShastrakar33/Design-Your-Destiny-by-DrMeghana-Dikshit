# Dr.M App - Wellness & Practice Management Platform

## Overview
Dr.M App is a comprehensive, mobile-first wellness platform aimed at supporting users in spiritual practices, meditation, and personal growth. It offers guided programs, community engagement, challenge tracking, and personalized insights for holistic well-being. Key capabilities include structured programs, emotional mastery tools, money mindset rewiring, workshops, masterclasses, and community practice sessions. Users can track streaks, create custom playlists, engage in challenges, and develop their "Project of Heart" vision. The platform's ambition is to provide a holistic ecosystem for personal transformation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a mobile-first responsive design with a constrained container width (`max-w-md`). Typography uses Inter or DM Sans for body text and Crimson Text or Playfair Display for headlines. Color themes include gradients for Wellness, Calm, Energy, and Growth sections, a purple accent (#703DFA), and a light gray page background with white cards. Common component patterns include fixed bottom navigation, gradient action cards, expandable practice cards, progress bars, streak calendars, modal dialogs, and segmented controls. The "Project of Heart" vision tab incorporates an authentic Anahata Heart Chakra SVG. The Admin Panel has a distinct desktop-optimized interface with sidebar navigation.

### Technical Implementations
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, shadcn/ui (Radix UI), Tailwind CSS, and Framer Motion for animations. State management utilizes React hooks and localStorage. The backend uses Express.js with TypeScript. Data storage employs a hybrid approach: browser localStorage for user-specific data (playlists, progress, preferences), and PostgreSQL with Drizzle ORM for community practice sessions, articles, categories, and CMS content. Authentication for the Admin panel uses password-based bearer tokens, while the public app is authentication-free. An `AudioPlayer` component manages audio playback. AI video integration is handled via a custom chat interface connected to an external Gradio-hosted AI video generation service. PDF files uploaded via admin are automatically converted to formatted HTML for inline display using `pdf2json`.

### Feature Specifications
Core pages include Home, Courses, Profile, Progress Insights, Project of Heart, Community Practices, and the Admin Panel. The Admin Panel provides full CRUD operations for Articles and Categories. A robust Course Management System (CMS) supports a hierarchical structure of programs, courses, modules, folders, lessons, and files. A Frontend Feature Mapping System allows admins to link CMS courses to specific user-facing features (All Processes, Daily Abundance, My Playlist). A global search system enables users to search across mapped content. A Daily Quotes system displays a rotating quote on the homepage, managed via the admin panel. User progression includes streak tracking and custom playlist creation. The application also supports Capacitor integration for mobile app deployment on iOS and Android.

**Consistency Calendar**: The Profile page features a dynamic Consistency Calendar that visualizes user activity history. Key characteristics:
- Shows one month at a time with navigation arrows bounded by user's earliest activity
- Uses warm amber/yellow for active days, light grey for inactive, muted grey for future dates
- Displays a flame icon (🔥) when current streak >= 7 consecutive days
- Today is highlighted with a purple ring
- All dates stored as timezone-safe YYYY-MM-DD strings
- Read-only visualization of data from `POST /api/v1/streak/mark-today` (single source of truth)

**Progress Insights**: Tracks only PROCESS and PLAYLIST activity types (Spiritual Breaths and Process Checklist features have been removed).

**Event Calendar**: The Events page (accessible via bottom navigation) displays live sessions and recordings. Key characteristics:
- **Upcoming Tab**: Shows events with status UPCOMING or currently LIVE (derived from start/end datetimes)
- **Latest Tab**: Shows completed events with recordings (only when showRecording=true AND recordingUrl exists)
- **Live Status**: Calculated at runtime from startDatetime/endDatetime, not stored in database
- **Recording Access**: Modal dialog shows passcode with copy functionality and expiry date
- **Access Control**: Events can require specific program codes (requiredProgramCode field)
- **Admin Management**: Full CRUD at /admin/events with thumbnail upload to R2
- **Decision Zone**: Admin Latest tab shows completed events needing recording decisions (no recordingUrl set)

### System Design Choices
The architecture emphasizes RESTful APIs with distinct public and admin endpoints. React Query is used for efficient data fetching and caching. Components are designed for modularity and extensibility. The database schema is structured to manage various content types, including articles, categories, CMS elements (courses, modules, lessons), programs, and feature mappings with foreign key constraints.

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
- **drizzle-zod**: Drizzle ORM and Zod integration.

### Content Editing
- **React Quill**: WYSIWYG rich text editor.

### Data Management
- **TanStack Query (React Query)**: Async state management and caching.
- **date-fns**: Date manipulation.

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

### AI Video Service
- **@gradio/client**: Connects to an external Dr.M AI video generation API (https://dr-meghana-video.wowlabz.com/).

### Cloud Storage
- **AWS S3**: For media file uploads (e.g., article images).
- **Cloudflare R2**: For CMS course content (video, audio, PDF files) with signed URLs.

### Mobile App Integration
- **Capacitor**: For building iOS and Android applications.