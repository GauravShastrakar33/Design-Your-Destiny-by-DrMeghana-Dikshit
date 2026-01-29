# Dr.M App - Wellness & Practice Management Platform

## Overview
Dr.M App is a mobile-first wellness platform for spiritual practices, meditation, and personal growth. It provides guided programs, community features, challenge tracking, and personalized insights. The platform aims to offer a holistic ecosystem for personal transformation through structured programs, emotional mastery, money mindset rewiring, workshops, masterclasses, and community sessions. Users can track progress, create playlists, engage in challenges, and develop their "Project of Heart."

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform uses a mobile-first responsive design with `max-w-md` container width. Typography includes Inter/DM Sans for body text and Crimson Text/Playfair Display for headlines. Color themes feature gradients for wellness sections, a purple accent (#703DFA), and a light gray background with white cards. Common components include fixed bottom navigation, gradient action cards, expandable practice cards, progress bars, streak calendars, modal dialogs, and segmented controls. The "Project of Heart" vision tab incorporates an Anahata Heart Chakra SVG. The Admin Panel has a desktop-optimized interface with sidebar navigation.

### Technical Implementations
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, shadcn/ui (Radix UI), Tailwind CSS, and Framer Motion. State management uses React hooks and localStorage. The backend uses Express.js with TypeScript. Data storage is a hybrid: browser localStorage for user-specific data, and PostgreSQL with Drizzle ORM for community sessions, articles, categories, and CMS content. Admin panel authentication uses password-based bearer tokens, while the public app is authentication-free. An `AudioPlayer` component manages audio. AI video integration uses a custom chat interface connected to an external Gradio-hosted AI video generation service. PDF uploads are converted to HTML using `pdf2json` for inline display. Web Push Notifications are powered by Firebase Cloud Messaging (FCM).

### Feature Specifications
Core pages include Home, Courses, Profile, Progress Insights, Project of Heart, Community Practices, and the Admin Panel. The Admin Panel offers CRUD for Articles and Categories, and a robust Course Management System (CMS) with a hierarchical structure (programs, courses, modules, folders, lessons, files). A Frontend Feature Mapping System links CMS courses to user-facing features. A global search system allows content discovery. A Daily Quotes system provides rotating homepage quotes. User progression includes streak tracking and custom playlist creation. The application supports Capacitor for mobile deployment.

**Consistency Calendar**: Displays user activity history, showing one month at a time. It uses warm amber/yellow for active days, light grey for inactive, and a flame icon for streaks >= 7 days. Today is highlighted in purple. It's read-only, sourcing data from backend APIs.

**Project of Heart (POH)**: A psychology-driven, single-scrolling page for personal vision and goal setting.
- **UI Flow**: Guides users from creation (Category → Title → Why) to managing an active POH with identity/vision images, milestones, actions, and daily ratings. It includes modals for milestone creation, completion, POH completion/closure, and creating "Next" or "North Star" POHs.
- **Interactive Features**: Vision image uploads, clickable milestones, inline editable actions, and a daily rating slider.
- **Psychological Flow**: Meaning → Identity → Emotion → Direction → Action → Reflection → Hope → Continuity.
- **Backend Implementation**: Four tables (`project_of_hearts`, `poh_milestones`, `poh_actions`, `poh_daily_ratings`) with foreign key constraints manage POH data. A defined status flow (active → completed/closed_early | next → active | horizon → next) includes auto-promotion logic. API endpoints support CRUD operations, daily ratings, milestone management, and POH completion/closure.

**Progress Insights**: Tracks only PROCESS and PLAYLIST activity types.

**Lesson Progress (Daily Abundance)**: Tracks completed lessons in Daily Abundance courses.
- **Backend**: `lesson_progress` table stores user and lesson IDs.
- **API**: Endpoints to get completed lesson IDs and mark lessons as complete.
- **UI**: Displays modules and lessons with expandable cards. Videos/audios are played from R2. Completed lessons show a green checkmark; incomplete ones have a play icon and a manual "Mark as Complete" button.

**Event Calendar**: Displays live sessions and recordings.
- **Tabs**: "Upcoming" for current/future events, "Latest" for completed events with recordings.
- **Live Status**: Calculated dynamically.
- **Access Control**: Events can require specific program codes.
- **Admin Management**: Full CRUD for events, including thumbnail upload to R2.

**Dr.M Monthly Questions**: Allows users to ask one question per month and receive voice-recorded answers.
- **Database**: `drm_questions` table stores question details, user ID, status, and R2 key for the audio answer.
- **User API**: Endpoints to get user questions, specific questions with signed audio URLs, and submit new questions.
- **Admin API**: Endpoints to list questions, get question details, get R2 upload URLs for answers, and confirm answers (triggering push notifications).
- **User Flow**: Submit question → Wait → Listen to answer. Push notifications alert users when answers are available.

### System Design Choices
The architecture uses RESTful APIs with distinct public and admin endpoints. React Query handles efficient data fetching and caching. Components are modular and extensible. The database schema is structured with foreign key constraints to manage various content types (articles, categories, CMS elements, programs, feature mappings).

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
- **AWS S3**: For media file uploads.
- **Cloudflare R2**: For CMS course content (video, audio, PDF files) with signed URLs.

### Mobile App Integration
- **Capacitor**: For building iOS and Android applications.

### Push Notifications
- **Firebase**: Client-side messaging and app initialization.
- **Firebase Admin SDK**: Server-side notification sending.