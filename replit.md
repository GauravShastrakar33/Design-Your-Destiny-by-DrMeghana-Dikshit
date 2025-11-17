# Dr.M App - Wellness & Practice Management Platform

## Overview
Dr.M App is a comprehensive mobile-first wellness platform designed to help users manage spiritual practices, meditation routines, and personal growth. It offers guided practices, community engagement, challenge tracking, and personalized insights for holistic well-being. The platform includes structured programs, emotional mastery tools, money mindset rewiring, workshops, masterclasses, and community practice sessions. Users can track streaks, create custom playlists, participate in challenges, and work on their "Project of Heart" vision.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: Mobile-first responsive design with a constrained container width (`max-w-md`).
- **Typography**: Inter or DM Sans for body, Crimson Text or Playfair Display for headlines.
- **Color Themes**: Gradient themes for Wellness, Calm, Energy, Growth sections; purple accent color (#703DFA); light gray page background (#F3F3F3) with white cards.
- **Component Patterns**: Fixed bottom navigation, gradient action cards, expandable practice cards, progress bars, streak calendars, modal dialogs, segmented controls.
- **Project of Heart**: Incorporates authentic Anahata Heart Chakra SVG for the Vision tab.
- **Admin Panel**: Desktop-optimized interface with sidebar navigation, distinct from the mobile app's UI.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Vite, Wouter for routing, shadcn/ui (Radix UI), Tailwind CSS, Framer Motion for animations. State managed using React hooks and localStorage.
- **Backend**: Express.js with TypeScript, designed for future database integration and authentication. Serves frontend and community practice sessions.
- **Data Storage**: Hybrid approach using browser localStorage for user-specific data (playlists, progress, preferences) and PostgreSQL with Drizzle ORM for community practice sessions, articles, and categories.
- **Authentication**: Admin panel uses password-based authentication with Bearer tokens; public app is authentication-free. Server-side middleware (`requireAdmin`) protects admin CRUD endpoints.
- **Audio System**: Manages audio playback via an `AudioPlayer` component, tracks per-playlist progress, and auto-advances tracks.
- **AI Video Integration**: Custom chat interface connecting to an external Gradio-hosted AI video generation service (`/process_query`) for personalized video responses. Stores conversation history and video URLs in localStorage.

### Feature Specifications
- **Core Pages**: Home, Workshops, Profile, AI Insights, Project of Heart, Processes, Community Practices, Articles, Spiritual Breaths, and Admin Panel.
- **Content Management**: Full CRUD for Articles, Categories, Process Folders, Subfolders, Processes, and Spiritual Breaths via the Admin Panel.
- **Practice Library**: Supports nested categories (Folders, Subfolders) for processes, and includes Spiritual Breaths. Media (video, audio) can be associated with practices.
- **Article System**: Allows rich text editing, image uploads, category assignment, and publish/draft toggling.
- **User Progression**: Tracks streaks, allows creation of custom playlists, and offers insights based on practice tracking.

### System Design Choices
- **API Design**: RESTful APIs for data interaction, with distinct public and admin endpoints.
- **Data Fetching**: Utilizes React Query for efficient data fetching, caching, and state management.
- **Modularity**: Components and features are designed to be modular and extensible.
- **Database Schema**: Structured for managing articles, categories, and a hierarchical practice library including folders, subfolders, processes, and spiritual breaths, with foreign key constraints.

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

### Content Editing
- **React Quill**: WYSIWYG rich text editor for article content.

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

### Cloud Storage
- **AWS S3**: For media file uploads (e.g., process media, spiritual breath media).