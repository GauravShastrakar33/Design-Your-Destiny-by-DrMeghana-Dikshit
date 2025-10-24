# Dr.M App - Design Guidelines

## Design Approach

**Reference-Based Approach** inspired by premium wellness apps (Calm, Headspace, Peloton) combined with Material Design interaction patterns. This mobile-first application emphasizes visual clarity, calming aesthetics, and intuitive navigation for daily practice management.

---

## Core Design Elements

### Typography Hierarchy

**Primary Font**: Inter or DM Sans (Google Fonts)
**Secondary Font**: Crimson Text or Playfair Display for quotes/headlines

- Page Titles: text-2xl to text-3xl, font-bold
- Section Headers: text-xl, font-semibold
- Card Titles: text-lg, font-medium
- Body Text: text-base, font-normal
- Small Labels/Meta: text-sm, font-medium
- Calendar/Stats: text-xs to text-sm, font-semibold

### Layout System & Spacing

**Container Width**: max-w-md mx-auto (mobile-optimized, centered)
**Spacing Units**: Consistent use of 3, 4, 6, 8, 12, 16 units
- Page padding: px-4 py-6
- Section gaps: space-y-6 to space-y-8
- Card padding: p-4 to p-6
- Button padding: px-6 py-3

---

## Navigation Structure

### Bottom Navigation Bar
- Fixed position at bottom (fixed bottom-0 w-full)
- Height: h-16, with safe-area padding
- Five equally-spaced icon+label tabs
- Active state: bold text, filled icon
- Inactive state: regular weight, outline icon
- Icons: Use Heroicons (outline for inactive, solid for active)
- Spacing between icon and label: space-y-1

---

## Component Library

### Home Page Components

**Progress Tracking Section**:
- Mini progress bar: rounded-full height of h-2, gradient fill showing percentage
- Text above: "Today's Practice: X/Y minutes"
- 7-day streak calendar: Grid of 7 circular day indicators (w-10 h-10 each)
  - Completed days: filled circle with checkmark
  - Current day: outlined with pulse animation
  - Future days: muted outline
- Horizontal layout on larger screens (sm:flex)

**Action Cards** (4 main buttons):
- Grid: grid-cols-2 gap-4
- Card dimensions: aspect-square or min-h-32
- Each card has:
  - Large icon at top (w-12 h-12)
  - Title centered below
  - Subtle gradient background (unique per card)
  - Rounded corners: rounded-2xl
  - Shadow: shadow-lg on tap
  - Tap animation: scale-95 active state

### Processes Page Components

**Segmented Control** (DYD/USM Toggle):
- Horizontal pill-shaped container: rounded-full, p-1 background
- Two equal-width buttons within
- Active button: solid background, rounded-full
- Inactive button: transparent
- Smooth sliding animation between states
- Width: w-full max-w-xs mx-auto

**Practice Cards**:
- Full-width cards with rounded-xl borders
- Left-aligned icon (w-10 h-10) + title
- Expandable accordion pattern
- Collapsed state: shows icon, title, chevron-down
- Expanded state:
  - Three-segment control (Video/Audio/Script)
  - Content area below showing selected format
  - Video: 16:9 aspect ratio embedded player
  - Audio: compact audio player with waveform visualization
  - Script: scrollable text with max-h-64

**Media Players**:
- Video: rounded-lg overflow-hidden, controls overlay
- Audio: Compact bar with play/pause, progress bar, timestamp
- Script: Clean typography, generous line-height (leading-relaxed)

### Design Your Practice Page

**Collapsible Category Lists**:
- Two main sections: USM and DYD
- Header: text-lg font-semibold with chevron icon
- Collapsed: shows only header bar
- Expanded: reveals practice items with checkboxes

**Practice Checkboxes**:
- Each item: flex row with checkbox + label
- Checkbox: w-5 h-5 rounded accent color
- Checked state: filled with checkmark
- Label: text-base, tap-friendly padding (py-3)
- Divider between items: subtle border-b

**Save Button**:
- Fixed at bottom or sticky within scroll
- Full-width (or centered with max-w-xs)
- Height: h-12, rounded-full
- Gradient background
- Clear label: "Save My Playlist"

### Spiritual Breaths Page

**Video Tutorial Cards**:
- Full-width video containers
- 16:9 aspect ratio
- Rounded corners: rounded-xl
- Title above: text-lg font-medium
- Vertical stack: space-y-6

**Audio Affirmation Cards**:
- Paired below each video
- Compact audio player
- Soft background panel: p-4 rounded-lg
- Label: "Guided Affirmation"

### Articles Page

**Hero Banner**:
- Full-width background image
- Height: h-48 to h-64
- Overlay gradient (dark to transparent)
- Title: "Dr. M's Guide" - text-3xl font-bold, white text
- Motivational quote: text-lg, italic, centered
- Positioned: bottom padding (pb-8)

**Category Sections**:
- Vertical stack with category headers
- Header: text-xl font-semibold, mb-4
- Each section: mb-8

**Article Cards** (Horizontal Scroll):
- Horizontal scrollable container: flex overflow-x-auto
- Gap between cards: gap-4
- Each card:
  - Width: w-64 (fixed width for scroll)
  - Aspect ratio: 3:4 or square
  - Rounded corners: rounded-xl
  - Background: full cover image
  - Title overlay at bottom: p-4, gradient overlay
  - Title text: text-base font-semibold, white text
  - Shadow: shadow-md
  - Tap animation: scale-105 transform

**Scroll Behavior**:
- Hide scrollbar (scrollbar-hide)
- Snap scroll: snap-x snap-mandatory
- Cards snap to start: snap-start

---

## Animations

**Framer Motion Implementation**:
- Page transitions: fade-in from opacity 0 to 1 (duration: 0.3s)
- Card taps: scale transform (0.95) with spring animation
- Accordion expand: height animation with ease-in-out
- Progress bar fill: width animation from 0 to percentage
- Streak calendar: stagger animation for days
- Bottom nav icons: subtle bounce on tap

**Performance**:
- Use transform and opacity only for animations
- Limit simultaneous animations
- Disable animations for reduced-motion preference

---

## Mobile Responsiveness

**Breakpoint Strategy**:
- Mobile-first: base styles for mobile (320px+)
- Small tablets: sm: (640px+) - slight layout adjustments
- Max width: max-w-md for all content (prevents desktop sprawl)

**Touch Targets**:
- Minimum tap area: 44x44px (h-11 w-11 minimum)
- Generous spacing between interactive elements
- Increased padding for mobile comfort

**Safe Areas**:
- Top padding for status bar: pt-safe
- Bottom padding for navigation: pb-safe (additional to nav bar)

---

## Visual Treatments

**Card Styles**:
- Elevated cards: shadow-lg with rounded-2xl
- Bordered cards: border border-gray-200 with rounded-xl
- Gradient backgrounds for feature cards (health/wellness themed)

**Segmented Controls**:
- Material Design pill style
- Smooth sliding indicator
- Clear active/inactive states

**Loading States**:
- Skeleton screens for content loading
- Spinner for media loading
- Shimmer effect for placeholder cards

---

## Images

**Required Images**:

1. **Articles Banner**: Serene, wellness-themed hero image (yoga, meditation, nature)
2. **Article Category Cards**: 6 categories × 3-4 articles = ~20 unique cover images
   - Health: fitness, nutrition imagery
   - Brain Performance: focus, productivity themes
   - Relationships: connection, communication visuals
   - Book Recommendations: book covers/reading scenes
   - Parenting: family, child development
   - Spirituality: meditation, mindfulness imagery
3. **Practice Icons**: Icon-based, not photographic
4. **Breathwork Tutorials**: Video thumbnails (calm, centered compositions)

**Image Treatment**:
- All images: rounded corners (rounded-xl to rounded-2xl)
- Hero banner: overlay gradient for text readability
- Article cards: subtle darkening at bottom for title contrast
- Aspect ratios: 16:9 for videos, 3:4 or 1:1 for article cards