import { Router } from "express";
import { authenticateJWT as requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { courseController } from "../controllers/course.controller";

const router = Router();

// ============================================
// ADMIN API ROUTES
// ============================================

// --- Programs ---
router.get("/admin/v1/programs", requireAuth, requireAdmin, courseController.getAllPrograms);
router.post("/admin/v1/programs", requireAuth, requireAdmin, courseController.createProgram);
router.put("/admin/v1/programs/:id", requireAuth, requireAdmin, courseController.updateProgram);
router.delete("/admin/v1/programs/:id", requireAuth, requireAdmin, courseController.deleteProgram);

// --- Courses ---
router.get("/admin/v1/cms/courses", requireAuth, requireAdmin, courseController.getAllCourses);
router.get("/admin/v1/cms/courses/:id", requireAuth, requireAdmin, courseController.getCourseById);
router.post("/admin/v1/cms/courses", requireAuth, requireAdmin, courseController.createCourse);
router.put("/admin/v1/cms/courses/:id", requireAuth, requireAdmin, courseController.updateCourse);
router.delete("/admin/v1/cms/courses/:id", requireAuth, requireAdmin, courseController.deleteCourse);

// --- Modules ---
router.get("/admin/v1/cms/modules", requireAuth, requireAdmin, courseController.getModules);
router.post("/admin/v1/cms/modules", requireAuth, requireAdmin, courseController.createModule);
router.put("/admin/v1/cms/modules/:id", requireAuth, requireAdmin, courseController.updateModule);
router.delete("/admin/v1/cms/modules/:id", requireAuth, requireAdmin, courseController.deleteModule);

// --- Folders ---
router.post("/admin/v1/cms/folders", requireAuth, requireAdmin, courseController.createFolder);
router.put("/admin/v1/cms/folders/:id", requireAuth, requireAdmin, courseController.updateFolder);
router.delete("/admin/v1/cms/folders/:id", requireAuth, requireAdmin, courseController.deleteFolder);

// --- Lessons ---
router.post("/admin/v1/cms/lessons", requireAuth, requireAdmin, courseController.createLesson);
router.put("/admin/v1/cms/lessons/:id", requireAuth, requireAdmin, courseController.updateLesson);
router.delete("/admin/v1/cms/lessons/:id", requireAuth, requireAdmin, courseController.deleteLesson);

// --- Files ---
router.post("/admin/v1/cms/files/upload-url", requireAuth, requireAdmin, courseController.getUploadUrlForFile);
router.post("/admin/v1/cms/files", requireAuth, requireAdmin, courseController.createFile);
router.delete("/admin/v1/cms/files/:id", requireAuth, requireAdmin, courseController.deleteFile);

// --- Feature Map (Admin/Internal) ---
router.get("/admin/v1/feature-map/:featureCode?", requireAuth, requireAdmin, courseController.getFeatureMaps);
router.post("/admin/v1/feature-map", requireAuth, requireAdmin, courseController.setFeatureMap);
router.delete("/admin/v1/feature-map", requireAuth, requireAdmin, courseController.removeFeatureMap);

// --- Frontend Feature Mapping (Admin) ---
router.get("/admin/v1/frontend-mapping/features", requireAuth, requireAdmin, courseController.getFrontendFeatures);
router.get("/admin/v1/frontend-mapping/features/:code/courses", requireAuth, requireAdmin, courseController.getFeatureCourseMappings);
router.post("/admin/v1/frontend-mapping/features/:code/courses", requireAuth, requireAdmin, courseController.setFeatureMap);
router.delete("/admin/v1/frontend-mapping/features/:code/courses/:courseId", requireAuth, requireAdmin, courseController.removeFeatureMap);
router.patch("/admin/v1/frontend-mapping/features/:code/courses/reorder", requireAuth, requireAdmin, courseController.reorderFeatureCourseMappings);
router.patch("/admin/v1/frontend-mapping/features/:code/lock", requireAuth, requireAdmin, courseController.toggleFeatureLock);

// ============================================
// PUBLIC/USER API ROUTES
// ============================================
// NOTE: Reusing the same service for some endpoints, but auth checks are slightly different. 
// User endpoints are authenticated, but lack admin requirement.
router.get("/public/v1/courses", requireAuth, courseController.getAllCourses);
router.get("/public/v1/courses/:id", requireAuth, courseController.getCourseById);
router.get("/public/v1/features/:featureCode", requireAuth, courseController.getFeatureMaps); // feature course mapping
router.get("/public/v1/files/:id/download", requireAuth, courseController.getPublicFileDownloadUrl);

// New public endpoints
router.get("/public/v1/features/:code", requireAuth, courseController.getPublicFeature);
router.get("/public/v1/playlist/source", requireAuth, courseController.getPlaylistSourceData);
router.get("/public/v1/search", requireAuth, courseController.search);

// --- Playlists ---
router.get("/public/v1/playlists", requireAuth, courseController.getUserPlaylists);
router.post("/public/v1/playlists", requireAuth, courseController.createPlaylist);
router.delete("/public/v1/playlists/:id", requireAuth, courseController.deletePlaylist);
router.get("/public/v1/playlists/:id/items", requireAuth, courseController.getPlaylistItems);
router.post("/public/v1/playlists/:id/items", requireAuth, courseController.setPlaylistItems);
router.patch("/public/v1/playlists/:id/items/reorder", requireAuth, courseController.reorderPlaylistItems);
router.delete("/public/v1/playlists/:id/items/:itemId", requireAuth, courseController.deletePlaylistItem);

// --- Lesson Progress ---
router.get("/v1/lesson-progress", requireAuth, courseController.getLessonProgress);
router.post("/v1/lesson-progress/:lessonId/complete", requireAuth, courseController.markLessonComplete);

export default router;
