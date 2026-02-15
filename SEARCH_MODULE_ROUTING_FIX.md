# Search Module Routing Fix

## Problem

Module search results were causing 404 errors because of a route mismatch:

- **API was generating**: `/processes/module/{moduleId}`
- **Frontend route expects**: `/course/{courseId}/module/{moduleId}`

Since modules are nested under courses, the frontend requires **both** `courseId` and `moduleId` to render the `ModuleLessonsPage`.

---

## Solution

Updated the search API to:

1. Include `course_id` in module search results
2. Generate the correct `navigate_to` path format

---

## Changes Made

### 1. Backend - SearchResult Interface (`server/routes.ts`)

Added `course_id` field to the `SearchResult` interface:

```typescript
interface SearchResult {
  type: "module" | "lesson" | "course";
  feature: string;
  id: number;
  title: string;
  course_id?: number; // ✅ ADDED
  module_id?: number;
  navigate_to: string;
}
```

### 2. Backend - Module Search Results (`server/routes.ts`)

Updated module search to include `course_id` and generate correct path:

```typescript
// BEFORE
results.push({
  type: "module",
  feature: feature.code,
  id: module.id,
  title: module.title,
  navigate_to: `/processes/module/${module.id}`, // ❌ WRONG
});

// AFTER
results.push({
  type: "module",
  feature: feature.code,
  id: module.id,
  course_id: courseId, // ✅ ADDED
  title: module.title,
  navigate_to: `/course/${courseId}/module/${module.id}`, // ✅ CORRECT
});
```

### 3. Frontend - SearchResult Interface (`client/src/pages/SearchPage.tsx`)

Updated to match the backend response:

```typescript
interface SearchResult {
  type: "module" | "lesson" | "course";
  feature: string;
  id: number;
  title: string;
  course_id?: number; // ✅ ADDED
  module_id?: number;
  navigate_to: string;
}
```

---

## Example API Response

### Before Fix

```json
{
  "type": "module",
  "id": 27,
  "feature": "DYD",
  "title": "Anxiety Relief Code",
  "navigate_to": "/processes/module/27" // ❌ 404 Error
}
```

### After Fix

```json
{
  "type": "module",
  "id": 27,
  "course_id": 5, // ✅ ADDED
  "feature": "DYD",
  "title": "Anxiety Relief Code",
  "navigate_to": "/course/5/module/27" // ✅ Correct route
}
```

---

## Testing

To verify the fix works:

1. **Search for a module** (e.g., "Anxiety Relief")
2. **Click on a module result**
3. **Verify navigation** to `/course/{courseId}/module/{moduleId}`
4. **Confirm ModuleLessonsPage renders** correctly

---

## Files Modified

- ✅ `server/routes.ts` - Updated SearchResult interface and module search logic
- ✅ `client/src/pages/SearchPage.tsx` - Updated SearchResult interface

---

## Route Confirmation

The correct route exists in `client/src/routes/AppRoutes.tsx`:

```tsx
<Route
  path="/course/:courseId/module/:moduleId"
  component={ModuleLessonsPage}
/>
```

This route requires BOTH parameters:

- `courseId` - Parent course identifier
- `moduleId` - Module identifier

---

## No Frontend Logic Changes Required

The frontend already uses:

```typescript
const handleResultClick = (result: SearchResult) => {
  setLocation(result.navigate_to);
};
```

So once the API returns the corrected `navigate_to` path, navigation works automatically! ✅

---

## Summary

- ✅ Module search results now include `course_id`
- ✅ `navigate_to` path matches existing frontend route
- ✅ No 404 errors when clicking module search results
- ✅ Frontend TypeScript types updated for type safety
