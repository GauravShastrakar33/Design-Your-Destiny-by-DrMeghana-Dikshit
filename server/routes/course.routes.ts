import { Router, type RequestHandler } from "express";
import { authenticateJWT as requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { courseController } from "../controllers/course.controller";

const router = Router();

const register = (
  method: "get" | "post" | "put" | "patch" | "delete",
  paths: string[],
  ...handlers: RequestHandler[]
) => {
  for (const path of paths) {
    router[method](path, ...handlers);
  }
};

// ============================================
// ADMIN API ROUTES
// ============================================

// --- Programs ---
register(
  "get",
  ["/admin/v1/programs", "/api/admin/v1/programs", "/admin/api/programs"],
  requireAuth,
  requireAdmin,
  courseController.getAllPrograms
);
register(
  "post",
  ["/admin/v1/programs", "/api/admin/v1/programs"],
  requireAuth,
  requireAdmin,
  courseController.createProgram
);
register(
  "put",
  ["/admin/v1/programs/:id", "/api/admin/v1/programs/:id"],
  requireAuth,
  requireAdmin,
  courseController.updateProgram
);
register(
  "delete",
  ["/admin/v1/programs/:id", "/api/admin/v1/programs/:id"],
  requireAuth,
  requireAdmin,
  courseController.deleteProgram
);

// --- Courses ---
register(
  "get",
  ["/admin/v1/cms/courses", "/api/admin/v1/cms/courses"],
  requireAuth,
  requireAdmin,
  courseController.getAllCourses
);
register(
  "get",
  ["/admin/v1/cms/courses/:id", "/api/admin/v1/cms/courses/:id"],
  requireAuth,
  requireAdmin,
  courseController.getCourseById
);
register(
  "get",
  [
    "/admin/v1/cms/courses/:courseId/modules",
    "/api/admin/v1/cms/courses/:courseId/modules",
  ],
  requireAuth,
  requireAdmin,
  courseController.getCourseModules
);
register(
  "post",
  ["/admin/v1/cms/courses", "/api/admin/v1/cms/courses"],
  requireAuth,
  requireAdmin,
  courseController.createCourse
);
register(
  "put",
  ["/admin/v1/cms/courses/:id", "/api/admin/v1/cms/courses/:id"],
  requireAuth,
  requireAdmin,
  courseController.updateCourse
);
register(
  "patch",
  [
    "/admin/v1/cms/courses/:id/publish",
    "/api/admin/v1/cms/courses/:id/publish",
  ],
  requireAuth,
  requireAdmin,
  courseController.toggleCoursePublish
);
register(
  "delete",
  ["/admin/v1/cms/courses/:id", "/api/admin/v1/cms/courses/:id"],
  requireAuth,
  requireAdmin,
  courseController.deleteCourse
);

// --- Modules ---
register(
  "get",
  ["/admin/v1/cms/modules", "/api/admin/v1/cms/modules", "/admin/api/modules"],
  requireAuth,
  requireAdmin,
  courseController.getModules
);
register(
  "get",
  [
    "/admin/v1/cms/modules/:id/lessons",
    "/api/admin/v1/cms/modules/:id/lessons",
  ],
  requireAuth,
  requireAdmin,
  courseController.getModuleLessons
);
register(
  "post",
  ["/admin/v1/cms/modules", "/api/admin/v1/cms/modules"],
  requireAuth,
  requireAdmin,
  courseController.createModule
);
register(
  "put",
  ["/admin/v1/cms/modules/:id", "/api/admin/v1/cms/modules/:id"],
  requireAuth,
  requireAdmin,
  courseController.updateModule
);
register(
  "delete",
  ["/admin/v1/cms/modules/:id", "/api/admin/v1/cms/modules/:id"],
  requireAuth,
  requireAdmin,
  courseController.deleteModule
);

// --- Folders ---
register(
  "get",
  ["/admin/v1/cms/folders", "/api/admin/v1/cms/folders"],
  requireAuth,
  requireAdmin,
  courseController.getFolders
);
register(
  "post",
  ["/admin/v1/cms/folders", "/api/admin/v1/cms/folders"],
  requireAuth,
  requireAdmin,
  courseController.createFolder
);
register(
  "put",
  ["/admin/v1/cms/folders/:id", "/api/admin/v1/cms/folders/:id"],
  requireAuth,
  requireAdmin,
  courseController.updateFolder
);
register(
  "delete",
  ["/admin/v1/cms/folders/:id", "/api/admin/v1/cms/folders/:id"],
  requireAuth,
  requireAdmin,
  courseController.deleteFolder
);

// --- Lessons ---
register(
  "get",
  ["/admin/v1/cms/lessons", "/api/admin/v1/cms/lessons"],
  requireAuth,
  requireAdmin,
  courseController.getLessons
);
register(
  "get",
  ["/admin/v1/cms/lessons/:id", "/api/admin/v1/cms/lessons/:id"],
  requireAuth,
  requireAdmin,
  courseController.getAdminLessonById
);
register(
  "get",
  [
    "/admin/v1/cms/lessons/:id/files",
    "/api/admin/v1/cms/lessons/:id/files",
  ],
  requireAuth,
  requireAdmin,
  courseController.getLessonFiles
);
register(
  "post",
  ["/admin/v1/cms/lessons", "/api/admin/v1/cms/lessons"],
  requireAuth,
  requireAdmin,
  courseController.createLesson
);
register(
  "put",
  ["/admin/v1/cms/lessons/:id", "/api/admin/v1/cms/lessons/:id"],
  requireAuth,
  requireAdmin,
  courseController.updateLesson
);
register(
  "delete",
  ["/admin/v1/cms/lessons/:id", "/api/admin/v1/cms/lessons/:id"],
  requireAuth,
  requireAdmin,
  courseController.deleteLesson
);

// --- Files ---
register(
  "get",
  ["/admin/v1/cms/files", "/api/admin/v1/cms/files"],
  requireAuth,
  requireAdmin,
  courseController.getFiles
);
register(
  "post",
  [
    "/admin/v1/cms/files/get-upload-url",
    "/api/admin/v1/cms/files/get-upload-url",
  ],
  requireAuth,
  requireAdmin,
  courseController.getLegacyUploadUrlForFile
);
register(
  "post",
  ["/admin/v1/cms/files/confirm", "/api/admin/v1/cms/files/confirm"],
  requireAuth,
  requireAdmin,
  courseController.confirmFileUpload
);
register(
  "post",
  ["/admin/v1/cms/files/upload-url", "/api/admin/v1/cms/files/upload-url"],
  requireAuth,
  requireAdmin,
  courseController.getUploadUrlForFile
);
register(
  "post",
  ["/admin/v1/cms/files", "/api/admin/v1/cms/files"],
  requireAuth,
  requireAdmin,
  courseController.createFile
);
register(
  "post",
  ["/admin/v1/cms/files/:id/optimize-video", "/api/admin/v1/cms/files/:id/optimize-video"],
  requireAuth,
  requireAdmin,
  courseController.optimizeVideoFile
);
register(
  "delete",
  ["/admin/v1/cms/files/:id", "/api/admin/v1/cms/files/:id"],
  requireAuth,
  requireAdmin,
  courseController.deleteFile
);

// --- Feature Map (Admin/Internal) ---
register(
  "get",
  ["/admin/v1/feature-map/:featureCode?", "/api/admin/v1/feature-map/:featureCode?"],
  requireAuth,
  requireAdmin,
  courseController.getFeatureMaps
);
register(
  "get",
  ["/admin/api/feature-mapping"],
  requireAuth,
  requireAdmin,
  courseController.getFeatureMaps
);
register(
  "post",
  ["/admin/v1/feature-map", "/api/admin/v1/feature-map"],
  requireAuth,
  requireAdmin,
  courseController.setFeatureMap
);
register(
  "delete",
  ["/admin/v1/feature-map", "/api/admin/v1/feature-map"],
  requireAuth,
  requireAdmin,
  courseController.removeFeatureMap
);

// --- Frontend Feature Mapping (Admin) ---
register(
  "get",
  ["/admin/v1/frontend-mapping/features", "/api/admin/v1/frontend-mapping/features"],
  requireAuth,
  requireAdmin,
  courseController.getFrontendFeatures
);
register(
  "get",
  [
    "/admin/v1/frontend-mapping/features/:code/courses",
    "/api/admin/v1/frontend-mapping/features/:code/courses",
  ],
  requireAuth,
  requireAdmin,
  courseController.getFeatureCourseMappings
);
register(
  "post",
  [
    "/admin/v1/frontend-mapping/features/:code/courses",
    "/api/admin/v1/frontend-mapping/features/:code/courses",
  ],
  requireAuth,
  requireAdmin,
  courseController.setFeatureMap
);
register(
  "delete",
  [
    "/admin/v1/frontend-mapping/features/:code/courses/:courseId",
    "/api/admin/v1/frontend-mapping/features/:code/courses/:courseId",
  ],
  requireAuth,
  requireAdmin,
  courseController.removeFeatureMap
);
register(
  "patch",
  [
    "/admin/v1/frontend-mapping/features/:code/courses/reorder",
    "/api/admin/v1/frontend-mapping/features/:code/courses/reorder",
  ],
  requireAuth,
  requireAdmin,
  courseController.reorderFeatureCourseMappings
);
register(
  "patch",
  [
    "/admin/v1/frontend-mapping/features/:code/lock",
    "/api/admin/v1/frontend-mapping/features/:code/lock",
  ],
  requireAuth,
  requireAdmin,
  courseController.toggleFeatureLock
);

// ============================================
// PUBLIC/USER API ROUTES
// ============================================
register(
  "get",
  ["/public/v1/courses", "/api/public/v1/courses"],
  requireAuth,
  courseController.getAllCourses
);
register(
  "get",
  ["/public/v1/courses/:id", "/api/public/v1/courses/:id"],
  requireAuth,
  courseController.getPublicCourseById
);
register(
  "get",
  ["/public/v1/modules/:id", "/api/public/v1/modules/:id"],
  requireAuth,
  courseController.getPublicModule
);
register(
  "get",
  ["/public/v1/lessons/:id", "/api/public/v1/lessons/:id"],
  requireAuth,
  courseController.getPublicLesson
);
register(
  "get",
  ["/public/v1/courses/:id/full", "/api/public/v1/courses/:id/full"],
  requireAuth,
  courseController.getPublicCourseFull
);
register(
  "get",
  ["/public/v1/files/:id/download", "/api/public/v1/files/:id/download"],
  requireAuth,
  courseController.getPublicFileDownloadUrl
);
register(
  "get",
  ["/public/v1/features/:code", "/api/public/v1/features/:code"],
  requireAuth,
  courseController.getPublicFeature
);
register(
  "get",
  ["/public/v1/playlist/source", "/api/public/v1/playlist/source"],
  requireAuth,
  courseController.getPlaylistSourceData
);
register(
  "get",
  ["/public/v1/search", "/api/public/v1/search"],
  requireAuth,
  courseController.search
);

// --- Playlists ---
register(
  "get",
  ["/public/v1/playlists", "/api/public/v1/playlists"],
  requireAuth,
  courseController.getUserPlaylists
);
register(
  "get",
  ["/public/v1/playlists/:id", "/api/public/v1/playlists/:id"],
  requireAuth,
  courseController.getPlaylist
);
register(
  "post",
  ["/public/v1/playlists", "/api/public/v1/playlists"],
  requireAuth,
  courseController.createPlaylist
);
register(
  "patch",
  ["/public/v1/playlists/:id", "/api/public/v1/playlists/:id"],
  requireAuth,
  courseController.updatePlaylist
);
register(
  "delete",
  ["/public/v1/playlists/:id", "/api/public/v1/playlists/:id"],
  requireAuth,
  courseController.deletePlaylist
);
register(
  "get",
  ["/public/v1/playlists/:id/items", "/api/public/v1/playlists/:id/items"],
  requireAuth,
  courseController.getPlaylistItems
);
register(
  "post",
  ["/public/v1/playlists/:id/items", "/api/public/v1/playlists/:id/items"],
  requireAuth,
  courseController.setPlaylistItems
);
register(
  "patch",
  [
    "/public/v1/playlists/:id/items/reorder",
    "/api/public/v1/playlists/:id/items/reorder",
  ],
  requireAuth,
  courseController.reorderPlaylistItems
);
register(
  "delete",
  [
    "/public/v1/playlists/:id/items/:itemId",
    "/api/public/v1/playlists/:id/items/:itemId",
  ],
  requireAuth,
  courseController.deletePlaylistItem
);

// --- Lesson Progress ---
register(
  "get",
  ["/v1/lesson-progress", "/api/v1/lesson-progress"],
  requireAuth,
  courseController.getLessonProgress
);
register(
  "post",
  [
    "/v1/lesson-progress/:lessonId/complete",
    "/api/v1/lesson-progress/:lessonId/complete",
  ],
  requireAuth,
  courseController.markLessonComplete
);

export default router;
