# Dr.M App - Wellness & Practice Management Platform

## Overview
Dr.M App is a comprehensive mobile-first wellness application designed to help users manage spiritual practices, meditation routines, and personal growth. It offers guided practices, community engagement, challenge tracking, and personalized insights for holistic well-being. The platform includes structured programs, emotional mastery tools, money mindset rewiring, workshops, masterclasses, and community practice sessions. Users can track streaks, create custom playlists, participate in challenges, and work on their "Project of Heart" vision.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: Mobile-first responsive design with a focus on constrained container width (`max-w-md`).
- **Typography**: Inter or DM Sans for primary text, Crimson Text or Playfair Display for quotes/headlines.
- **Color Themes**: Specific gradient themes for Wellness, Calm, Energy, Growth sections; purple accent color (#703DFA) for active states and icons; light gray page background (#F3F3F3) with white cards.
- **Component Patterns**: Fixed bottom navigation, gradient action cards, expandable practice cards, progress bars, streak calendars, modal dialogs, segmented controls.
- **Project of Heart**: Incorporates authentic Anahata Heart Chakra SVG with 12 lotus petals and Star of David for the Vision tab.
- **Admin Panel**: Desktop-optimized interface with sidebar navigation, distinct from the mobile app's UI.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Vite, Wouter for routing, shadcn/ui (Radix UI), Tailwind CSS, Framer Motion for animations. State managed using React hooks and localStorage.
- **Backend**: Express.js with TypeScript, currently minimal, serving frontend and community practice sessions. Designed for future database integration and authentication.
- **Data Storage**: Hybrid approach using browser localStorage for user-specific data (playlists, progress, preferences) and PostgreSQL with Drizzle ORM for community practice sessions, articles, and categories.
- **Authentication**: Admin panel uses password-based authentication with Bearer tokens; public app is authentication-free. Server-side middleware (`requireAdmin`) protects admin CRUD endpoints.
- **Audio System**: Manages audio playback via an `AudioPlayer` component (HTML5), tracks per-playlist progress in localStorage, and auto-advances tracks.
- **AI Video Integration**: Custom chat interface connecting to an external Gradio-hosted AI video generation service (`/process_query`) for personalized video responses. Stores conversation history and video URLs in localStorage.

### Feature Specifications
- **Home Page**: Welcome header, high-contrast "JOIN NOW" button.
- **Workshops Page**: "MASTERCLASSES" header, rectangular tab system, enhanced masterclass cards with live indicators and larger typography.
- **Profile Page**: Reordered sections: Profile Card, Streak Calendar, AI Insights, My Prescription, Settings. Features a full-width gradient profile card, clickable AI Insights card, expandable My Prescription card, and settings options.
- **AI Insights Page**: Practice tracking insights with weekly and monthly views, segmented view toggle, and dedicated cards for playlists and process checklists.
- **Project of Heart Page**: White background with "PROJECT OF HEART" title, heart chakra theme, rectangular tab system. Features a "Start Your Journey" button, a two-column Vision tab with Anahata Heart Chakra SVG and progress ring, and milestone tracking (up to 6 stars).
- **Processes Page**: Organizes practices into collapsible categories (e.g., Wealth Code Activation, Birth story-Specialisation) for the DYD tab, and a flat list for the USM tab. Uses Radix UI Collapsible components.
- **Community Practices Page**: Displays real-time community practice sessions fetched from a PostgreSQL database, with session cards and "JOIN" functionality opening meeting links.
- **Articles Page**: Mobile-first article listing displaying published articles grouped by category in horizontal scrollable sections. Fetches real data from PostgreSQL. Each article card shows image and title, clicking navigates to full article view.
- **Article Detail Page**: Full article view with hero image, category badge, title, publication date, and formatted HTML content (from React Quill WYSIWYG editor). Gracefully handles 404 for unpublished/missing articles.
- **Admin Panel**: Desktop-optimized interface for managing platform features. Includes a dashboard, sidebar navigation, and full CRUD management for Community Practices (sessions) and Articles via table interfaces. Features include:
  - **Articles Management**: Create/edit/delete articles with React Quill rich text editor, image upload to public/articles/ folder, category assignment, and publish/draft toggle. Table view shows title, category, published status, creation date, and actions.
  - **Category Management**: Create new categories on-the-fly from article form dialog.

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
- **React Quill**: WYSIWYG rich text editor for article content with HTML output.

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

## Recent Changes

### Practice Library Management (November 2024)
Complete practice library management system with AWS S3 media storage:

**Database Schema:**
- **Process Folders Table**: ID (serial), name (varchar), type (varchar - "DYD", "USM"), displayOrder (integer)
- **Process Subfolders Table**: ID (serial), name (varchar), folderId (integer FK with CASCADE), displayOrder (integer)
- **Processes Table**: ID (serial), title (varchar), description (text nullable), folderId (integer FK with CASCADE, NOT NULL), subfolderId (integer FK with CASCADE, nullable), videoUrl (varchar), audioUrl (varchar), scriptUrl (varchar), iconName (varchar), displayOrder (integer)
- **Spiritual Breaths Table**: ID (serial), title (varchar), description (text), videoUrl (varchar), audioUrl (varchar), displayOrder (integer)

**API Endpoints:**
- Public Routes:
  - `GET /api/process-library` - Returns folders grouped by type with nested subfolders and processes
  - `GET /api/processes` - Returns all processes (flat list)
  - `GET /api/spiritual-breaths` - Returns all spiritual breaths
- Admin Routes (Bearer token required):
  - Process Folders: GET, POST, PUT, DELETE at `/api/admin/process-folders`
  - Process Subfolders: GET, POST, PUT, DELETE at `/api/admin/process-subfolders`
  - Processes: GET, POST, PUT, DELETE at `/api/admin/processes`
  - Spiritual Breaths: GET, POST, PUT, DELETE at `/api/admin/spiritual-breaths`
  - Media Upload: POST `/api/admin/upload/process-media` and `/api/admin/upload/spiritual-breath-media` (AWS S3)

**AWS S3 Integration:**
- S3 upload service with credential validation
- Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME
- Graceful error handling when credentials not configured
- Supports video, audio, and document file uploads (up to 100MB)

**Security & Validation:**
- All admin endpoints protected with Bearer token authentication
- Foreign key constraints with CASCADE delete to prevent orphaned records
- FolderId required (NOT NULL) for processes
- Zod validation for all request bodies
- File type validation for uploads

**Admin Features:**
- Tabbed interface for managing Folders, Subfolders, Processes, and Spiritual Breaths
- Full CRUD operations with table views
- Dialog forms with validation for required fields
- File upload support with current URL display when editing
- Parent folder/subfolder selection dropdowns
- Display order management for custom sorting

**Technical Implementation:**
- React Query for data fetching with proper cache invalidation
- Multer with memory storage for S3 uploads
- Nested response structure grouped by folder type for mobile UI
- Form validation preventing submission with invalid required fields

### Articles Feature (November 2024)
Complete articles management system with the following capabilities:

**Database Schema:**
- **Categories Table**: ID (serial), name (varchar)
- **Articles Table**: ID (serial), title (varchar), categoryId (integer FK), imageUrl (varchar), content (text/HTML), isPublished (boolean), createdAt (timestamp)

**API Endpoints:**
- Public Routes:
  - `GET /api/categories` - Returns all categories
  - `GET /api/articles` - Returns only published articles
  - `GET /api/articles/:id` - Returns article only if published (404 otherwise)
- Admin Routes (Bearer token required):
  - `GET /api/admin/articles` - Returns all articles including drafts
  - `POST /api/admin/articles` - Create article with Zod validation
  - `PUT /api/admin/articles/:id` - Update article with Zod validation
  - `DELETE /api/admin/articles/:id` - Delete article
  - `POST /api/admin/categories` - Create category with Zod validation
  - `POST /api/admin/upload/article-image` - Upload article image (saved to public/articles/)

**Security & Validation:**
- All admin endpoints protected with Bearer token authentication
- Request body validation using Zod schemas (insertArticleSchema, insertCategorySchema)
- Published flag enforced server-side - unpublished articles return 404 on public endpoints
- Image uploads restricted to admin users with authentication check

**User Features:**
- Browse articles by category on mobile-optimized interface
- Click article cards to view full content with formatted text
- Graceful error handling for missing/unpublished articles

**Admin Features:**
- Table view of all articles with status badges (Published/Draft)
- Create/edit articles with React Quill WYSIWYG editor supporting:
  - Headers (H1, H2, H3)
  - Text formatting (bold, italic, underline, strike)
  - Lists (ordered, unordered)
  - Blockquotes and code blocks
  - Links
- Image upload with preview
- Category dropdown with inline category creation
- Publish/draft toggle
- Edit and delete functionality

**Technical Implementation:**
- React Query for data fetching with proper cache invalidation
- Custom queryFn for admin authentication headers
- Mobile-first responsive design following app patterns
- HTML content safely rendered with Tailwind prose classes
- 404 handling returns null instead of throwing to show proper fallback UI