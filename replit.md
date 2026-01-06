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
- Fully API-driven via `/api/v1/consistency/range` and `/api/v1/consistency/month`
- Read-only UI with no localStorage writes; data sourced from backend APIs only

**Project of Heart (POH)**: A psychology-driven single-scrolling page following a meaning-to-reflection flow:
- **Routes**: `/heart` and `/project-of-heart` (main page), `/project-of-heart/history` (history page)
- **UI Flow**:
  1. **Start Screen**: When no active POH, shows Heart Chakra context + explanation + "Create My Project of Heart" CTA
  2. **Creation Flow**: Step-by-step (Category → Title → Why) with animated transitions
  3. **Main Screen** (when active POH exists):
     - Heart Chakra context header
     - Active POH Card (identity + vision images + milestones combined)
     - Actions + Daily Rating Card
     - Next POH Card (read-only)
     - North Star Card (read-only, renamed from "Horizon")
     - Re-align buttons and View Past Projects link
- **Modals**:
  - Milestone Creation Modal (max 5 milestones)
  - Milestone Achievement Confirmation ("It's ready to be marked")
  - Complete/Close POH Modal (with min 20 char reflection)
  - Create Next POH Modal (title + category)
  - Create North Star Modal (title + category)
  - Re-align Modal (conditional editing based on POH type)
- **Interactive Features**:
  - Vision images: Click to upload/replace (R2 storage)
  - Milestones: Click to achieve with animation
  - Actions: Inline editable with save on blur
  - Daily Rating: Slider 0-10 with API save on release
- **UI Terminology**: "Horizon" displayed as "North Star" (backend still uses status="horizon")
- **History Page**: Shows past projects with status (Completed/Closed Early), achieved milestones, and reflections
- **Color Scheme**: Purple (#703DFA), Green (#5FB77D), Gold (#E5AC19 for acknowledgement accents)
- **Psychological Flow**: Meaning → Identity → Emotion → Direction → Action → Reflection → Hope → Continuity

**POH Backend Implementation**:
- **Database Tables**: 4 tables with foreign key constraints
  - `project_of_hearts`: Main POH records (UUID IDs, userId FK, title, why, category, status, startedAt, endedAt, closingReflection)
  - `poh_milestones`: Milestones per POH (UUID IDs, pohId FK, text, achieved, achievedAt, orderIndex)
  - `poh_actions`: Top 3 daily actions (UUID IDs, pohId FK, text, orderIndex)
  - `poh_daily_ratings`: One rating per user per day (UUID IDs, userId FK, pohId FK, localDate UNIQUE per user, rating 0-10)
- **Status Flow**: active → completed/closed_early | next → active | horizon → next
- **Auto-Promotion**: When ACTIVE completes/closes, NEXT promotes to ACTIVE (with startedAt set), HORIZON promotes to NEXT
- **API Endpoints** (all require JWT authentication):
  - `GET /api/poh/current` - Returns {active, next, horizon} with full milestones/actions
  - `POST /api/poh` - Create POH (auto-assigns slot: active→next→horizon or NO_SLOT_AVAILABLE)
  - `PUT /api/poh/:id` - Update title/why/category
  - `POST /api/poh/:id/milestones` - Create milestone (max 5 per POH)
  - `PUT /api/poh/milestone/:id` - Edit milestone text (MILESTONE_LOCKED if achieved)
  - `POST /api/poh/milestone/:id/achieve` - Achieve milestone (locks it)
  - `PUT /api/poh/:id/actions` - Replace all actions (max 3, min 1 char each)
  - `POST /api/poh/rate` - Create/update daily rating (one per user per day)
  - `POST /api/poh/:id/complete` - Complete POH (min 20 char reflection, triggers auto-promote)
  - `POST /api/poh/:id/close` - Close early (min 20 char reflection, triggers auto-promote)
  - `GET /api/poh/history` - Get completed/closed POHs with milestones
- **Categories**: career, health, relationships, wealth (Zod enum validated)

**Progress Insights**: Tracks only PROCESS and PLAYLIST activity types (Spiritual Breaths and Process Checklist features have been removed).

**Event Calendar**: The Events page (accessible via bottom navigation) displays live sessions and recordings. Key characteristics:
- **Upcoming Tab**: Shows events with status UPCOMING or currently LIVE (derived from start/end datetimes)
- **Latest Tab**: Shows completed events with recordings (only when showRecording=true AND recordingUrl exists)
- **Live Status**: Calculated at runtime from startDatetime/endDatetime, not stored in database
- **Recording Access**: Modal dialog shows passcode with copy functionality and expiry date
- **Access Control**: Events can require specific program codes (requiredProgramCode field)
- **Admin Management**: Full CRUD at /admin/events with thumbnail upload to R2
- **Decision Zone**: Admin Latest tab shows completed events needing recording decisions (no recordingUrl set)

**Web Push Notifications**: Firebase Cloud Messaging (FCM) powers browser push notifications for user engagement.
- **Database**: `device_tokens` table stores FCM tokens per user (userId FK, token, platform, createdAt)
- **Frontend Files**:
  - `client/src/lib/firebase.ts`: Firebase app initialization
  - `client/src/lib/notifications.ts`: Permission request, token registration, foreground handling
  - `client/public/firebase-messaging-sw.js`: Service worker for background notifications
- **Backend Files**:
  - `server/lib/firebaseAdmin.ts`: Firebase Admin SDK initialization, sendPushNotification function
- **Environment Variables**:
  - `FIREBASE_SERVICE_ACCOUNT`: JSON service account key (required for sending notifications)
- **API Endpoints**:
  - `POST /api/v1/notifications/register-device` - Register device token (requires JWT auth)
  - `DELETE /api/v1/notifications/unregister-device` - Remove all device tokens for user (requires JWT auth)
  - `POST /admin/api/notifications/test` - Send test notification to all devices (admin only)
- **User Flow**: Profile page > Settings > Notifications toggle enables push notifications
- **Token Cleanup**: Failed/invalid tokens are automatically removed from database when notifications fail

**Dr.M Monthly Questions**: A personal Q&A feature where users can ask Dr. M one question per month and receive voice-recorded answers.
- **Routes**: `/drm` (main page), `/dr-m/questions/:id` (deep link to specific question)
- **Database Table**: `drm_questions` with fields:
  - id (serial primary key)
  - userId (FK to users)
  - questionText (max 240 characters)
  - askedAt (timestamp)
  - monthYear (YYYY-MM format, unique per user)
  - status (PENDING | ANSWERED)
  - audioR2Key (R2 storage path for voice answer)
  - answeredAt (timestamp when answered)
- **User API Endpoints** (require JWT authentication):
  - `GET /api/v1/drm/questions` - Get user's questions + current month status
  - `GET /api/v1/drm/questions/:id` - Get specific question with signed audio URL
  - `POST /api/v1/drm/questions` - Submit new question (240 char limit, one per month)
- **Admin API Endpoints**:
  - `GET /admin/api/drm/questions` - List all questions with user names
  - `GET /admin/api/drm/questions/:id` - Get question with audio URL
  - `POST /admin/api/drm/questions/:id/answer` - Get R2 upload URL for audio
  - `POST /admin/api/drm/questions/:id/confirm-answer` - Confirm upload, mark answered, send push notification
- **Audio Storage**: R2 at `drm-audio/questions/{id}/answer.webm`
- **User Flow**: Submit question → Wait for response → Listen to voice answer
- **Push Notification**: Users receive notification when Dr. M answers their question

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

### Push Notifications
- **Firebase**: Client-side messaging and app initialization.
- **Firebase Admin SDK**: Server-side notification sending.