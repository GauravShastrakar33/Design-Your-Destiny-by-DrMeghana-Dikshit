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
- **Core Pages**: Home, Courses, Profile, AI Insights, Project of Heart, Processes (Coming Soon), Community Practices, Articles, Spiritual Breaths (Coming Soon), and Admin Panel.
- **Content Management**: Full CRUD for Articles and Categories via the Admin Panel. Processes and Spiritual Breaths features are being rebuilt separately.
- **Article System**: Allows rich text editing, image uploads, category assignment, and publish/draft toggling.
- **User Progression**: Tracks streaks, allows creation of custom playlists, and offers insights based on practice tracking.
- **Planned Features**: Processes, Spiritual Breaths, and Abundance Mastery features are planned for future development.

### CMS System (Course Management)
- **Course Structure**: Hierarchical structure with courses → modules → folders → lessons → files
- **Programs Management**: Dedicated CRUD interface at `/admin/programs` for managing programs (code + name). Courses link to programs via foreign key (`programId`).
- **Admin Pages**: 
  - `/admin/programs` - Program management with create, edit, delete functionality
  - `/admin/courses` - Course list with search, filter by program, reordering, publish/unpublish
  - `/admin/courses/create/step1` - Basic Info step (title, program dropdown, description)
  - `/admin/courses/create/step2/:id` - Thumbnail upload step
  - `/admin/courses/create/step3/:id` - Curriculum builder (modules, folders, lessons)
  - `/admin/courses/:id` - Course builder for editing existing courses
  - `/admin/courses/:courseId/lessons/:lessonId` - Lesson detail with file uploads
- **Database Tables**: programs, cms_courses (with programId FK), cms_modules, cms_module_folders, cms_lessons, cms_lesson_files
- **Media Storage**: Cloudflare R2 for video, audio, and PDF files with signed URLs
- **API Prefix**: All CMS routes use `/api/admin/v1/cms/` prefix; Programs use `/api/admin/v1/programs`

### Frontend Feature Mapping System
- **Purpose**: Maps CMS courses to frontend features (Processes, Spiritual Breaths, Abundance Mastery) through admin-managed mappings
- **Database Tables**: 
  - `frontend_features` - Stores feature codes (DYD, USM, BREATH, ABUNDANCE, PLAYLIST) with display modes
  - `feature_course_map` - Links features to courses with position ordering
  - `playlists` - User-created playlists for My Processes feature
  - `playlist_items` - Links playlists to lessons with position ordering
- **Display Modes**:
  - `modules` - DYD/USM Processes show course modules
  - `lessons` - Spiritual Breaths shows course lessons directly
  - `courses` - Abundance Mastery shows multiple courses as a list
  - `modules` - PLAYLIST (My Processes) shows modules with audio lessons for user playlists
- **Mapping Rules**:
  - DYD, USM, BREATH, PLAYLIST: Allow only 1 course mapping (single selection)
  - ABUNDANCE: Allows multiple courses with drag-reorder capability
- **Built-in Items**: Money Calendar and Rewiring Belief are hardcoded in Abundance Mastery, not stored in DB
- **Admin Pages**:
  - `/admin/processes` - DYD/USM tabs with course selection and module preview
  - `/admin/spiritual-breaths` - Course selection with lesson preview
  - `/admin/abundance-mastery` - Built-ins display + sortable CMS course list
  - `/admin/my-processes` - Course selection for PLAYLIST feature with audio lesson count preview
- **API Routes**:
  - Admin: `/admin/v1/frontend-mapping/features/:code/courses` (GET/POST/DELETE/PATCH reorder)
  - Public: `/api/public/v1/features/:code` - Returns mapped content for user app

### System Design Choices
- **API Design**: RESTful APIs for data interaction, with distinct public and admin endpoints.
- **Data Fetching**: Utilizes React Query for efficient data fetching, caching, and state management.
- **Modularity**: Components and features are designed to be modular and extensible.
- **Database Schema**: Structured for managing articles, categories, CMS courses/modules/lessons, and programs with foreign key constraints.

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
- **AWS S3**: For media file uploads (e.g., article images).
- **Cloudflare R2**: For CMS course content storage (video, audio, PDF files). Uses signed URLs for secure upload/download.

### Global Search System
- **Purpose**: Allows users to search across all mapped content (Processes, Spiritual Breaths, Abundance Mastery)
- **Search Logic**: Only searches within courses that are mapped to features via `feature_course_map`
- **Display Mode Awareness**: 
  - DYD/USM (modules mode): Returns matching modules
  - BREATH (lessons mode): Returns matching lessons
  - ABUNDANCE (courses mode): Returns matching courses
- **API Routes**:
  - `GET /api/public/v1/search?q=keyword` - Search across mapped content
  - `GET /api/public/v1/modules/:id` - Get module with lessons
  - `GET /api/public/v1/lessons/:id` - Get lesson with files (signed R2 URLs)
  - `GET /api/public/v1/courses/:id` - Get course with modules
- **Deep-Link Routes**:
  - `/processes/module/:id` - Process module detail page
  - `/processes/lesson/:id` - Process lesson detail page
  - `/spiritual-breaths/lesson/:id` - Spiritual breath lesson detail page
  - `/abundance-mastery/course/:id` - Abundance course detail page
- **Frontend Page**: `/search` with debounced input (300ms), grouped results by type

### Mobile App (Capacitor)
- **Setup**: Capacitor integrated for iOS and Android builds
- **Configuration**: `capacitor.config.ts` with webDir pointing to `dist/public`
- **Platform Separation**: 
  - Mobile app loads `/` (user routes only)
  - Admin panel (`/admin`) stays web-only (no navigation to it in user app)
- **Build Commands**:
  - `npm run build` - Build web assets
  - `npx cap sync` - Sync web assets to native projects
  - `npx cap open ios` - Open iOS project in Xcode
  - `npx cap open android` - Open Android project in Android Studio
- **Native Projects**: `ios/` and `android/` folders contain platform-specific code

### Daily Quotes System
- **Purpose**: Display one inspirational quote per day on HomePage with round-robin rotation
- **Database Table**: `daily_quotes` with columns (id, quoteText, author, isActive, displayOrder, lastShownDate, createdAt, updatedAt)
- **Rotation Logic**: 
  - Shows same quote to all users for the entire day
  - Quotes with NULL lastShownDate are shown first (ordered by displayOrder)
  - After all quotes shown, restarts from oldest shown quote
  - Deterministic: no randomness, consistent order
- **API Routes**:
  - `GET /api/quotes/today` - Returns today's quote (public)
  - `GET /api/admin/quotes` - List all quotes (admin)
  - `POST /api/admin/quotes` - Create quote (admin)
  - `PUT /api/admin/quotes/:id` - Update quote (admin)
  - `DELETE /api/admin/quotes/:id` - Soft delete (sets isActive=false)
- **Admin Page**: `/admin/quotes` for managing quotes with add/edit/toggle active status

## Recent Changes
- **December 2025**: Added Daily Quote feature with round-robin rotation. Displays one quote per day on HomePage, managed via admin panel at `/admin/quotes`. Removed "More Quotes" button.
- **December 2025**: Added Capacitor integration for mobile app deployment. User app runs on iOS/Android via Capacitor, admin panel remains web-only.
- **December 2025**: Renamed "Abundance Mastery" to "Daily Abundance" across user-facing pages (HomePage, MoneyMasteryPage, SearchPage).
- **December 2025**: Added Bulk Upload Students feature in Admin → Students page. Allows uploading CSV files with full_name, email, phone columns. Program is assigned from modal dropdown (not CSV). Default password is User@123. Max 1000 rows per upload. Returns detailed error reporting with row numbers. API: `POST /api/admin/students/bulk-upload` and `GET /api/admin/students/sample-csv`.
- **December 2025**: PDF files uploaded via admin are now automatically extracted to formatted HTML and displayed inline in Processes/Spiritual Breaths pages instead of showing a PDF download button. Uses pdf2json library (NOT pdf-parse) for better line-by-line preservation. The `convertTextToFormattedHtml` function in server/routes.ts applies:
  - Preserves intentional line breaks within paragraphs using `<br>` tags
  - Empty lines create separate paragraph blocks
  - Strict header detection (≤3 words, <35 chars, no commas, keyword-based)
  - Proper `<ul>`/`<ol>` list handling
  - Re-upload existing PDFs to regenerate scriptHtml with new conversion logic.
- **December 2025**: Removed 4 features from user app: Emotional Mastery (deleted completely), Music Journaling (deleted completely), Articles (removed from UI, admin panel preserved), Level Up (removed from UI, code kept for future use).
- **December 2025**: Added My Processes (PLAYLIST) admin page at `/admin/my-processes` for mapping a course to provide audio lessons for user playlists.
- **December 2025**: Implemented global search system - searches only mapped content, deep-link pages for modules/lessons/courses with signed R2 URLs.
- **December 2025**: Implemented frontend feature mapping system - allows admins to map CMS courses to Processes (DYD/USM), Spiritual Breaths, and Abundance Mastery features via new admin pages.
- **December 2025**: Removed Practice Library functionality (process_folders, process_subfolders, processes, spiritual_breaths tables and APIs) to rebuild Processes, Spiritual Breaths, and Abundance Mastery as separate features.