import { Request, Response } from "express";
import { courseService, CourseServiceError } from "../services/course.service";
import { 
  insertProgramSchema, 
  insertCmsCourseSchema,
  insertCmsModuleSchema,
  insertCmsModuleFolderSchema,
  insertCmsLessonSchema,
  insertCmsLessonFileSchema
} from "@shared/schema";
import { logAudit } from "../utils/audit";
import {
  generateCourseThumnailKey,
  generateLessonFileKey,
  getSignedGetUrl,
  getSignedPutUrl,
} from "../r2Upload";

const handleServiceError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof CourseServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
};

const FEATURE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const featureCache = new Map<string, { data: any; timestamp: number }>();
const moduleCache = new Map<number, { data: any; timestamp: number }>();
const courseCache = new Map<number, { data: any; timestamp: number }>();
const lessonCache = new Map<number, { data: any; timestamp: number }>();

export const courseController = {
  // --- PROGRAMS ---
  getAllPrograms: async (req: Request, res: Response) => {
    try {
      const programs = await courseService.getAllPrograms();
      res.json(programs);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch programs");
    }
  },

  createProgram: async (req: Request, res: Response) => {
    try {
      const { code, name, level } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: "Code and name are required" });
      }

      const program = await courseService.createProgram({
        code, name, level: level ? parseInt(level) : 1
      });

      if (req.user) {
        logAudit({
          req, userId: req.user.sub, userEmail: req.user.email,
          action: "CREATE", entityType: "PROGRAM", entityId: program.id, newValues: program,
        });
      }
      res.status(201).json(program);
    } catch (error) {
      handleServiceError(res, error, "Failed to create program");
    }
  },

  updateProgram: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const program = await courseService.updateProgram(id, req.body);

      // Audit logic skipped for brevity, ideally would fetch old values
      if (req.user) {
        logAudit({
          req, userId: req.user.sub, userEmail: req.user.email,
          action: "UPDATE", entityType: "PROGRAM", entityId: program.id, newValues: program,
        });
      }
      res.json(program);
    } catch (error) {
      handleServiceError(res, error, "Failed to update program");
    }
  },

  deleteProgram: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await courseService.deleteProgram(id);

      if (req.user) {
        logAudit({
          req, userId: req.user.sub, userEmail: req.user.email,
          action: "DELETE", entityType: "PROGRAM", entityId: deleted.id, oldValues: deleted,
        });
      }
      res.json({ success: true });
    } catch (error) {
      handleServiceError(res, error, "Failed to delete program");
    }
  },

  // --- COURSES ---
  getAllCourses: async (req: Request, res: Response) => {
    try {
      const search = req.query.search ? String(req.query.search) : undefined;
      const programId = req.query.programId ? parseInt(String(req.query.programId)) : undefined;
      const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";

      const courses = await courseService.getAllCourses(search, programId, sortOrder);
      res.json(courses);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch courses");
    }
  },

  getCourseById: async (req: Request, res: Response) => {
    try {
      const data = await courseService.getAdminCourseById(parseInt(req.params.id));
      res.json(data);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch course");
    }
  },

  getPublicCourseById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const cached = courseCache.get(id);
      if (cached && Date.now() - cached.timestamp < FEATURE_CACHE_DURATION) {
        return res.json(cached.data);
      }

      const data = await courseService.getCourseById(id);
      const { modules, ...course } = data;
      const responseData = { course, modules };
      
      courseCache.set(id, { data: responseData, timestamp: Date.now() });
      res.json(responseData);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch course");
    }
  },

  getPublicModule: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // Check cache
      const cached = moduleCache.get(id);
      if (cached && Date.now() - cached.timestamp < FEATURE_CACHE_DURATION) {
        return res.json(cached.data);
      }

      const data = await courseService.getPublicModule(id);
      
      // Update cache
      moduleCache.set(id, { data, timestamp: Date.now() });
      res.json(data);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch module");
    }
  },

  getPublicLesson: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // Check cache
      const cached = lessonCache.get(id);
      if (cached && Date.now() - cached.timestamp < FEATURE_CACHE_DURATION) {
        return res.json(cached.data);
      }

      const data = await courseService.getPublicLesson(id);
      
      // Update cache
      lessonCache.set(id, { data, timestamp: Date.now() });
      res.json(data);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch lesson");
    }
  },

  getPublicCourseFull: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = await courseService.getPublicCourseFull(id);
      res.json({ course: data.course, modules: data.modules });
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch course full details");
    }
  },

  createCourse: async (req: Request, res: Response) => {
    try {
      const parsed = insertCmsCourseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid course data", details: parsed.error.errors });
      }

      const adminId = req.user?.sub || null;
      const course = await courseService.createCourse(parsed.data, adminId);

      if (req.user) {
        logAudit({
          req, userId: req.user.sub, userEmail: req.user.email,
          action: "CREATE", entityType: "CMS_COURSE", entityId: course.id, newValues: course,
        });
      }

      res.status(201).json(course);
    } catch (error) {
      handleServiceError(res, error, "Failed to create course");
    }
  },

  updateCourse: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const course = await courseService.updateCourse(id, req.body);

      if (req.user) {
        logAudit({
          req, userId: req.user.sub, userEmail: req.user.email,
          action: "UPDATE", entityType: "CMS_COURSE", entityId: course.id, newValues: course,
        });
      }

      res.json(course);
    } catch (error) {
      handleServiceError(res, error, "Failed to update course");
    }
  },

  deleteCourse: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await courseService.deleteCourse(id);

      if (req.user) {
        logAudit({
          req, userId: req.user.sub, userEmail: req.user.email,
          action: "DELETE", entityType: "CMS_COURSE", entityId: id, oldValues: deleted,
        });
      }

      res.json({ success: true, message: "Course deleted successfully" });
    } catch (error) {
      handleServiceError(res, error, "Failed to delete course");
    }
  },

  toggleCoursePublish: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { isPublished } = req.body;
      if (typeof isPublished !== "boolean") {
        return res.status(400).json({ error: "isPublished must be a boolean" });
      }

      const course = await courseService.toggleCoursePublish(id, isPublished);
      res.json(course);
    } catch (error) {
      handleServiceError(res, error, "Failed to toggle course publish");
    }
  },

  // --- FEATURE MAPPING ---
  getFrontendFeatures: async (req: Request, res: Response) => {
    try {
      const features = await courseService.getAllFrontendFeatures();
      res.json(features);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch frontend features");
    }
  },

  getFeatureCourseMappings: async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const feature = await courseService.getFrontendFeatureByCode(code);
      const mappings = await Promise.all(
        (await courseService.getFeatureMap(code)).map(async (mapping: any) => {
          const course = await courseService.getCourseById(mapping.courseId);
          return {
            ...mapping,
            course: {
              id: course.id,
              title: course.title,
            },
          };
        })
      );
      res.json({ feature, mappings });
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch feature course mappings");
    }
  },

  getFeatureMaps: async (req: Request, res: Response) => {
    try {
      let maps;
      if (req.params.featureCode) {
        maps = await courseService.getFeatureMap(req.params.featureCode);
      } else {
        maps = await courseService.getFeatureMaps();
      }
      res.json(maps);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch feature maps");
    }
  },

  setFeatureMap: async (req: Request, res: Response) => {
    try {
      const { code } = req.params; // If coming from /admin/v1/frontend-mapping/features/:code/courses
      const featureCode = code || req.body.featureCode;
      const { courseId } = req.body;

      if (!featureCode || !courseId) {
        return res.status(400).json({ error: "Missing featureCode or courseId" });
      }

      const feature = await courseService.getFrontendFeatureByCode(featureCode);
      if (feature.mappingLocked) {
        return res.status(403).json({ error: "Mapping is locked. Unlock mapping before making changes." });
      }

      // For DYD, USM, BREATH, PLAYLIST - only 1 course allowed, replace existing
      if (["DYD", "USM", "BREATH", "PLAYLIST"].includes(featureCode)) {
        await courseService.clearFeatureCourseMappings(feature.id);
      }

      let position = 0;
      if (featureCode === "ABUNDANCE") {
        const existing = await courseService.getFeatureMap(featureCode);
        position = existing.length > 0 ? Math.max(...existing.map(m => (m as any).position)) + 1 : 0;
      }

      const mapping = await courseService.setFeatureMap(featureCode, parseInt(courseId), position);
      
      if (req.user) {
        logAudit({
          req, userId: req.user.sub, userEmail: req.user.email,
          action: "MAP", entityType: "FEATURE_COURSE_MAP", entityId: `${feature.id}-${courseId}`,
          relatedEntityId: feature.code, newValues: mapping,
        });
      }
      res.status(201).json(mapping);
    } catch (error) {
      handleServiceError(res, error, "Failed to map course to feature");
    }
  },

  removeFeatureMap: async (req: Request, res: Response) => {
    try {
      const { code, courseId: paramCourseId } = req.params;
      const featureCode = code || (req.query.featureCode as string);
      const courseId = paramCourseId || (req.query.courseId as string);

      if (!featureCode || !courseId) {
        return res.status(400).json({ error: "Missing featureCode or courseId" });
      }

      const feature = await courseService.getFrontendFeatureByCode(featureCode);
      if (feature.mappingLocked) {
        return res.status(403).json({ error: "Mapping is locked. Unlock mapping before making changes." });
      }

      await courseService.removeFeatureMap(featureCode, parseInt(courseId));
      if (req.user) {
        logAudit({
          req, userId: req.user.sub, userEmail: req.user.email,
          action: "UNMAP", entityType: "FEATURE_COURSE_MAP", entityId: `${feature.id}-${courseId}`,
          relatedEntityId: feature.code, oldValues: { featureId: feature.id, courseId: parseInt(courseId) },
        });
      }
      res.json({ success: true });
    } catch (error) {
      handleServiceError(res, error, "Failed to remove feature map");
    }
  },

  reorderFeatureCourseMappings: async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const { courseIds } = req.body;

      if (!Array.isArray(courseIds)) {
        return res.status(400).json({ error: "courseIds must be an array" });
      }

      const feature = await courseService.getFrontendFeatureByCode(code);
      if (feature.mappingLocked) {
        return res.status(403).json({ error: "Mapping is locked. Unlock mapping before making changes." });
      }

      await courseService.reorderFeatureCourseMappings(feature.id, courseIds.map(id => parseInt(id)));
      res.json({ success: true });
    } catch (error) {
      handleServiceError(res, error, "Failed to reorder feature course mappings");
    }
  },

  toggleFeatureLock: async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const { locked } = req.body;

      if (typeof locked !== "boolean") {
        return res.status(400).json({ error: "Request body must contain 'locked' boolean field" });
      }

      const feature = await courseService.getFrontendFeatureByCode(code);
      await courseService.toggleFeatureLock(feature.id, locked);

      res.json({ success: true, code: feature.code, mappingLocked: locked });
    } catch (error) {
      handleServiceError(res, error, "Failed to toggle feature mapping lock");
    }
  },

  getPublicFeature: async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const light = req.query.light === "true";
      const cacheKey = `${code}${light ? "_light" : ""}`;

      // Check cache
      const cached = featureCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < FEATURE_CACHE_DURATION) {
        return res.json(cached.data);
      }

      const feature = await courseService.getFrontendFeatureByCode(code);
      const mappings = (await courseService.getFeatureMap(code)) as any[];

      let responseData: any;

      if (feature.displayMode === "modules") {
        if (mappings.length === 0) {
          responseData = { feature, course: null, modules: [] };
        } else {
          const courseId = mappings[0].courseId;
          const data = light 
            ? await courseService.getCourseSummaryById(courseId)
            : await courseService.getCourseById(courseId);
          const { modules, ...course } = data;
          responseData = { feature, course, modules };
        }
      } else if (feature.displayMode === "lessons") {
        if (mappings.length === 0) {
          responseData = { feature, course: null, lessons: [] };
        } else {
          const courseId = mappings[0].courseId;
          const course = await courseService.getCourseById(courseId);
          const lessons = await courseService.getLessonsForCourse(courseId);
          responseData = { feature, course, lessons };
        }
      } else if (feature.displayMode === "courses") {
        const builtIns = code === "ABUNDANCE" ? [
          { id: "builtin-money-calendar", title: "Money Calendar", isBuiltIn: true },
          { id: "builtin-rewiring-belief", title: "Rewiring Belief", isBuiltIn: true },
        ] : [];

        const mappedCourses = await Promise.all(mappings.map(async (m) => {
          const data = await courseService.getCourseById(m.courseId);
          return {
            id: data.id,
            title: data.title,
            description: data.description,
            thumbnailKey: data.thumbnailKey,
            thumbnailUrl: data.thumbnailUrl,
            position: m.position,
            isBuiltIn: false,
          };
        }));

        responseData = { feature, builtIns, courses: mappedCourses };
      } else {
        responseData = { feature, mappings };
      }

      // Update cache
      featureCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      res.json(responseData);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch public feature");
    }
  },

  getPlaylistSourceData: async (req: Request, res: Response) => {
    try {
      const feature = await courseService.getFrontendFeatureByCode("PLAYLIST");
      const mappings = (await courseService.getFeatureMap("PLAYLIST")) as any[];
      if (mappings.length === 0) return res.json({ course: null, modules: [] });

      const courseId = mappings[0].courseId;
      const data = await courseService.getPlaylistSourceData(courseId);
      if (!data) return res.json({ course: null, modules: [] });

      // Generate signed URL for course thumbnail
      let thumbnailUrl = null;
      if (data.course.thumbnailKey) {
        const signedResult = await getSignedGetUrl(data.course.thumbnailKey);
        if (signedResult.success && signedResult.url) {
          thumbnailUrl = signedResult.url;
        }
      }

      // Generate signed URLs for audio files
      const modulesWithUrls = await Promise.all(data.modules.map(async (module: any) => {
        const lessonsWithUrls = await Promise.all(module.lessons.map(async (lesson: any) => {
          const audioFilesWithUrls = await Promise.all(lesson.audioFiles.map(async (file: any) => {
            const result = await getSignedGetUrl(file.r2Key, 3600);
            return { ...file, signedUrl: result.success ? result.url : null };
          }));
          return { ...lesson, audioFiles: audioFilesWithUrls };
        }));
        return { ...module, lessons: lessonsWithUrls };
      }));

      res.json({ course: { ...data.course, thumbnailUrl }, modules: modulesWithUrls });
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch playlist source");
    }
  },

  search: async (req: Request, res: Response) => {
    try {
      const query = ((req.query.q as string) || "").trim().toLowerCase();
      if (!query) return res.json({ results: [] });

      const allowedFeatures = ["DYD", "USM", "BREATH", "ABUNDANCE"];
      const results: any[] = [];

      const features = await courseService.getAllFrontendFeatures();

      for (const feature of features) {
        if (!allowedFeatures.includes(feature.code)) continue;

        const mappings = (await courseService.getFeatureMap(feature.code)) as any[];
        if (mappings.length === 0) continue;

        if (feature.displayMode === "modules") {
          for (const mapping of mappings) {
            const courseId = mapping.courseId;
            const modules = await courseService.getModulesForCourse(courseId);

            for (const module of modules) {
              if (module.title.toLowerCase().includes(query)) {
                results.push({
                  type: "module", feature: feature.code, id: module.id, course_id: courseId,
                  title: module.title, navigate_to: `/course/${courseId}/module/${module.id}`,
                });
              }
              const lessons = await courseService.getLessonsForCourse(courseId);
              for (const lesson of lessons) {
                if (lesson.moduleId === module.id && lesson.title.toLowerCase().includes(query)) {
                  results.push({
                    type: "lesson", feature: feature.code, id: lesson.id, title: lesson.title,
                    module_id: lesson.moduleId, navigate_to: `/processes/lesson/${lesson.id}`,
                  });
                }
              }
            }
          }
        } else if (feature.displayMode === "lessons") {
          for (const mapping of mappings) {
            const courseId = mapping.courseId;
            const lessons = await courseService.getLessonsForCourse(courseId);
            for (const lesson of lessons) {
              if (lesson.title.toLowerCase().includes(query)) {
                results.push({
                  type: "lesson", feature: feature.code, id: lesson.id, title: lesson.title,
                  navigate_to: `/spiritual-breaths/lesson/${lesson.id}`,
                });
              }
            }
          }
        } else if (feature.displayMode === "courses") {
          for (const mapping of mappings) {
            const course = await courseService.getCourseById(mapping.courseId);
            if (course.title.toLowerCase().includes(query)) {
              results.push({
                type: "course", feature: feature.code, id: course.id, title: course.title,
                navigate_to: `/challenge/${course.id}`,
              });
            }
          }
        }
      }
      res.json({ results });
    } catch (error) {
      handleServiceError(res, error, "Search failed");
    }
  },

  // --- PLAYLISTS ---
  getUserPlaylists: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const playlists = await courseService.getUserPlaylists(req.user.sub);
      res.json(playlists);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch playlists");
    }
  },

  createPlaylist: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const { title } = req.body;
      if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
      const playlist = await courseService.createPlaylist({ userId: req.user.sub, title });
      res.status(201).json(playlist);
    } catch (error) {
      handleServiceError(res, error, "Failed to create playlist");
    }
  },

  updatePlaylist: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const id = parseInt(req.params.id);
      const { title } = req.body;
      if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

      const data = await courseService.getPlaylist(id);
      if (data.playlist.userId !== req.user.sub) return res.status(403).json({ error: "Access denied" });

      const playlist = await courseService.updatePlaylist(id, title.trim());
      res.json(playlist);
    } catch (error) {
      handleServiceError(res, error, "Failed to update playlist");
    }
  },

  getPlaylist: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const id = parseInt(req.params.id);
      const data = await courseService.getPlaylist(id);
      if (data.playlist.userId !== req.user.sub) return res.status(403).json({ error: "Access denied" });
      res.json(data);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch playlist");
    }
  },

  deletePlaylist: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const id = parseInt(req.params.id);
      const data = await courseService.getPlaylist(id);
      if (data.playlist.userId !== req.user.sub) return res.status(403).json({ error: "Access denied" });
      await courseService.deletePlaylist(id);
      res.json({ success: true });
    } catch (error) {
      handleServiceError(res, error, "Failed to delete playlist");
    }
  },

  getPlaylistItems: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const playlistId = parseInt(req.params.id);
      const data = await courseService.getPlaylist(playlistId);
      if (data.playlist.userId !== req.user.sub) return res.status(403).json({ error: "Access denied" });
      const items = await courseService.getPlaylistItems(playlistId);
      res.json(items);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch playlist items");
    }
  },

  setPlaylistItems: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const playlistId = parseInt(req.params.id);
      const data = await courseService.getPlaylist(playlistId);
      if (data.playlist.userId !== req.user.sub) return res.status(403).json({ error: "Access denied" });

      const { lessonIds } = req.body;
      if (!Array.isArray(lessonIds)) return res.status(400).json({ error: "lessonIds must be an array" });

      const items = await courseService.setPlaylistItems(playlistId, lessonIds);
      res.json(items);
    } catch (error) {
      handleServiceError(res, error, "Failed to set playlist items");
    }
  },

  reorderPlaylistItems: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const playlistId = parseInt(req.params.id);
      const data = await courseService.getPlaylist(playlistId);
      if (data.playlist.userId !== req.user.sub) return res.status(403).json({ error: "Access denied" });

      const { orderedItemIds } = req.body;
      if (!Array.isArray(orderedItemIds)) return res.status(400).json({ error: "orderedItemIds must be an array" });

      await courseService.reorderPlaylistItems(playlistId, orderedItemIds.map(id => parseInt(id)));
      res.json({ success: true });
    } catch (error) {
      handleServiceError(res, error, "Failed to reorder playlist items");
    }
  },

  deletePlaylistItem: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const { id: playlistIdStr, itemId: itemIdStr } = req.params;
      const playlistId = parseInt(playlistIdStr);
      const itemId = parseInt(itemIdStr);

      const data = await courseService.getPlaylist(playlistId);
      if (data.playlist.userId !== req.user.sub) return res.status(403).json({ error: "Access denied" });

      await courseService.deletePlaylistItem(playlistId, itemId);
      res.json({ success: true });
    } catch (error) {
      handleServiceError(res, error, "Failed to delete playlist item");
    }
  },

  // --- MODULES ---
  getModules: async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(String(req.query.courseId));
      if (!courseId) return res.status(400).json({ error: "courseId is required" });
      const modules = await courseService.getCourseById(courseId).then(c => c.modules);
      res.json(modules);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch modules");
    }
  },

  getCourseModules: async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.courseId);
      if (isNaN(courseId)) return res.status(400).json({ error: "Valid courseId is required" });
      const modules = await courseService.getModulesForCourse(courseId);
      res.json(modules);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch modules");
    }
  },

  createModule: async (req: Request, res: Response) => {
    try {
      const parsed = insertCmsModuleSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid module data", details: parsed.error.errors });
      
      const module = await courseService.createModule(parsed.data);
      if (req.user) {
        logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "CREATE", entityType: "CMS_MODULE", entityId: module.id, newValues: module });
      }
      res.status(201).json(module);
    } catch (error) {
      handleServiceError(res, error, "Failed to create module");
    }
  },

  updateModule: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const module = await courseService.updateModule(id, req.body);
      if (req.user) {
        logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "UPDATE", entityType: "CMS_MODULE", entityId: id, newValues: module });
      }
      res.json(module);
    } catch (error) {
      handleServiceError(res, error, "Failed to update module");
    }
  },

  deleteModule: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await courseService.deleteModule(id);
      if (req.user) {
        logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "DELETE", entityType: "CMS_MODULE", entityId: id, oldValues: deleted });
      }
      res.json({ success: true, message: "Module deleted" });
    } catch (error) {
      handleServiceError(res, error, "Failed to delete module");
    }
  },

  // --- FOLDERS ---
  createFolder: async (req: Request, res: Response) => {
    try {
      const parsed = insertCmsModuleFolderSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid folder data" });
      const folder = await courseService.createFolder(parsed.data);
      if (req.user) logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "CREATE", entityType: "CMS_FOLDER", entityId: folder.id, newValues: folder });
      res.status(201).json(folder);
    } catch (error) {
      handleServiceError(res, error, "Failed to create folder");
    }
  },

  updateFolder: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const folder = await courseService.updateFolder(id, req.body);
      if (req.user) logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "UPDATE", entityType: "CMS_FOLDER", entityId: id, newValues: folder });
      res.json(folder);
    } catch (error) {
      handleServiceError(res, error, "Failed to update folder");
    }
  },

  deleteFolder: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await courseService.deleteFolder(id);
      if (req.user) logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "DELETE", entityType: "CMS_FOLDER", entityId: id, oldValues: deleted });
      res.json({ success: true, message: "Folder deleted" });
    } catch (error) {
      handleServiceError(res, error, "Failed to delete folder");
    }
  },

  getFolders: async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(String(req.query.moduleId));
      if (isNaN(moduleId)) return res.status(400).json({ error: "moduleId is required" });
      const folders = await courseService.getFoldersForModule(moduleId);
      res.json(folders);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch folders");
    }
  },

  // --- LESSONS ---
  createLesson: async (req: Request, res: Response) => {
    try {
      const parsed = insertCmsLessonSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid lesson data" });
      const lesson = await courseService.createLesson(parsed.data);
      if (req.user) logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "CREATE", entityType: "CMS_LESSON", entityId: lesson.id, newValues: lesson });
      res.status(201).json(lesson);
    } catch (error) {
      handleServiceError(res, error, "Failed to create lesson");
    }
  },

  updateLesson: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const lesson = await courseService.updateLesson(id, req.body);
      if (req.user) logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "UPDATE", entityType: "CMS_LESSON", entityId: id, newValues: lesson });
      res.json(lesson);
    } catch (error) {
      handleServiceError(res, error, "Failed to update lesson");
    }
  },

  deleteLesson: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await courseService.deleteLesson(id);
      if (req.user) logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "DELETE", entityType: "CMS_LESSON", entityId: id, oldValues: deleted });
      res.json({ success: true, message: "Lesson deleted" });
    } catch (error) {
      handleServiceError(res, error, "Failed to delete lesson");
    }
  },

  getLessons: async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(String(req.query.moduleId));
      if (isNaN(moduleId)) return res.status(400).json({ error: "moduleId is required" });

      const folderId =
        req.query.folderId === undefined
          ? undefined
          : parseInt(String(req.query.folderId));

      const lessons = await courseService.getLessonsForModule(
        moduleId,
        folderId === undefined || !Number.isNaN(folderId) ? folderId : undefined
      );
      res.json(lessons);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch lessons");
    }
  },

  getModuleLessons: async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(req.params.id);
      if (isNaN(moduleId)) return res.status(400).json({ error: "Valid moduleId is required" });
      const lessons = await courseService.getLessonsForModule(moduleId);
      res.json(lessons);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch lessons");
    }
  },

  getAdminLessonById: async (req: Request, res: Response) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await courseService.getAdminLessonById(lessonId);
      res.json(lesson);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch lesson");
    }
  },

  // --- FILES ---
  getFiles: async (req: Request, res: Response) => {
    try {
      const lessonId = parseInt(String(req.query.lessonId));
      if (isNaN(lessonId)) return res.status(400).json({ error: "lessonId is required" });
      const files = await courseService.getFilesForLesson(lessonId);
      res.json(files);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch files");
    }
  },

  getLessonFiles: async (req: Request, res: Response) => {
    try {
      const lessonId = parseInt(req.params.id);
      const files = await courseService.getFilesForLesson(lessonId);
      res.json(files);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch files");
    }
  },

  getPublicFileDownloadUrl: async (req: Request, res: Response) => {
    try {
      const fileId = parseInt(req.params.id);
      const result = await courseService.getFileDownloadUrl(fileId);
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch download URL");
    }
  },

  getUploadUrlForFile: async (req: Request, res: Response) => {
    try {
      const { lessonId, filename, contentType, type } = req.body;
      if (!lessonId || !filename || !contentType || !type) {
        return res.status(400).json({ error: "Missing required file upload parameters" });
      }
      const url = await courseService.getUploadUrlForFile(parseInt(lessonId), filename, contentType, type);
      res.json(url);
    } catch (error) {
      handleServiceError(res, error, "Failed to get upload URL");
    }
  },

  getLegacyUploadUrlForFile: async (req: Request, res: Response) => {
    try {
      const {
        filename,
        contentType,
        lessonId,
        fileType,
        courseId,
        moduleId,
        programCode,
        uploadType,
      } = req.body;

      if (!filename || !contentType) {
        return res.status(400).json({ error: "filename and contentType are required" });
      }

      let key: string;
      if (uploadType === "thumbnail" && courseId && programCode) {
        key = generateCourseThumnailKey(String(programCode), Number(courseId));
      } else if (lessonId && fileType && courseId && moduleId && programCode) {
        key = generateLessonFileKey(
          String(programCode),
          Number(courseId),
          Number(moduleId),
          Number(lessonId),
          String(fileType)
        );
      } else {
        return res.status(400).json({
          error:
            "Invalid upload parameters. For thumbnails: programCode, courseId required. For lesson files: programCode, courseId, moduleId, lessonId, fileType required.",
        });
      }

      const upload = await getSignedPutUrl(key, String(contentType));
      if (!upload.success || !upload.uploadUrl || !upload.key) {
        return res.status(500).json({ error: upload.error || "Failed to get upload URL" });
      }

      const signed = await getSignedGetUrl(upload.key);
      res.json({
        uploadUrl: upload.uploadUrl,
        key: upload.key,
        publicUrl: upload.publicUrl ?? null,
        signedUrl: signed.success ? signed.url ?? null : null,
      });
    } catch (error) {
      handleServiceError(res, error, "Failed to get upload URL");
    }
  },

  createFile: async (req: Request, res: Response) => {
    try {
      const parsed = insertCmsLessonFileSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid file data" });
      const file = await courseService.createFile(parsed.data);
      if (req.user) logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "CREATE", entityType: "CMS_FILE", entityId: file.id, newValues: file });
      res.status(201).json(file);
    } catch (error) {
      handleServiceError(res, error, "Failed to register file");
    }
  },

  confirmFileUpload: async (req: Request, res: Response) => {
    return courseController.createFile(req, res);
  },

  optimizeVideoFile: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid file ID" });
      const result = await courseService.optimizeVideoFile(id);
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Failed to optimize video file");
    }
  },

  deleteFile: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await courseService.deleteFile(id);
      if (req.user) logAudit({ req, userId: req.user.sub, userEmail: req.user.email, action: "DELETE", entityType: "CMS_FILE", entityId: id, oldValues: deleted });
      res.json({ success: true, message: "File deleted" });
    } catch (error) {
      handleServiceError(res, error, "Failed to delete file");
    }
  },

  // --- LESSON PROGRESS ---
  getLessonProgress: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const completedLessonIds = await courseService.getCompletedLessonIds(req.user.sub);
      res.json({ completedLessonIds });
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch lesson progress");
    }
  },

  markLessonComplete: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });
      const lessonId = parseInt(req.params.lessonId);
      if (isNaN(lessonId)) return res.status(400).json({ error: "Invalid lesson ID" });
      const result = await courseService.markLessonComplete(req.user.sub, lessonId);
      res.json({ success: true, alreadyCompleted: result.alreadyCompleted });
    } catch (error) {
      handleServiceError(res, error, "Failed to mark lesson complete");
    }
  }
};
