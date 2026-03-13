import { courseRepository } from "../repositories/course.repository";
import { getSignedGetUrl, getSignedPutUrl } from "../r2Upload";
import { db } from "../db";
import { eq, inArray } from "drizzle-orm";
import { InsertProgram, InsertCmsCourse, InsertCmsModule, InsertCmsModuleFolder, InsertCmsLesson, InsertCmsLessonFile, frontendFeatures, InsertPlaylist } from "@shared/schema";
import { 
  generateCourseThumnailKey,
  generateLessonFileKey
} from "../r2Upload"; // assuming these exist, we'll refactor imports later

export class CourseServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "CourseServiceError";
  }
}

export const courseService = {
  // --- PROGRAMS ---
  async getAllPrograms() {
    return await courseRepository.getAllPrograms();
  },

  async createProgram(data: InsertProgram) {
    const existing = await courseRepository.getProgramByCode(data.code);
    if (existing) throw new CourseServiceError("A program with this code already exists", 409);
    return await courseRepository.createProgram({ ...data, code: data.code.toUpperCase() });
  },

  async updateProgram(id: number, data: Partial<InsertProgram>) {
    const program = await courseRepository.updateProgram(id, data);
    if (!program) throw new CourseServiceError("Program not found", 404);
    return program;
  },

  async deleteProgram(id: number) {
    const program = await courseRepository.getProgramById(id);
    if (!program) throw new CourseServiceError("Program not found", 404);

    const courses = await courseRepository.getAllCourses();
    const linkedCourses = courses.filter(c => c.programId === id);
    if (linkedCourses.length > 0) {
      throw new CourseServiceError(`This program is linked to ${linkedCourses.length} course(s). Please reassign or delete those courses first.`, 400);
    }
    await courseRepository.deleteProgram(id);
    return program;
  },

  // --- COURSES ---
  async getAllCourses(search?: string, programId?: number, sortOrder: "asc" | "desc" = "asc") {
    let courses = await courseRepository.getAllCourses(sortOrder);
    const mappedCourses = await courseRepository.getAllFeatureMaps();
    const mappedIds = new Set(mappedCourses.map(m => m.courseId));

    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(c => c.title.toLowerCase().includes(searchLower));
    }
    if (programId) {
      courses = courses.filter(c => c.programId === programId);
    }

    return await Promise.all(courses.map(async (course) => {
      let thumbnailSignedUrl = null;
      if (course.thumbnailKey) {
        const signedResult = await getSignedGetUrl(course.thumbnailKey);
        if (signedResult.success && signedResult.url) {
          thumbnailSignedUrl = signedResult.url;
        }
      }
      return { ...course, thumbnailSignedUrl, isMapped: mappedIds.has(course.id) };
    }));
  },

  async getCourseById(id: number) {
    const course = await courseRepository.getCourseById(id);
    if (!course) throw new CourseServiceError("Course not found", 404);

    let programCode = null;
    if (course.programId) {
      const program = await courseRepository.getProgramById(course.programId);
      if (program) programCode = program.code;
    }

    let thumbnailSignedUrl = null;
    if (course.thumbnailKey) {
      const signedResult = await getSignedGetUrl(course.thumbnailKey);
      if (signedResult.success && signedResult.url) {
        thumbnailSignedUrl = signedResult.url;
      }
    }

    const modules = await courseRepository.getModulesByCourseId(id);
    const modulesWithContent = await Promise.all(modules.map(async (module) => {
      const folders = await courseRepository.getFoldersByModuleId(module.id);
      const lessons = await courseRepository.getLessonsByModuleId(module.id);
      
      const lessonsWithFiles = await Promise.all(lessons.map(async (lesson) => {
        const files = await courseRepository.getFilesByLessonId(lesson.id);
        return { ...lesson, files };
      }));
      return { ...module, folders, lessons: lessonsWithFiles };
    }));

    return { ...course, programCode, thumbnailSignedUrl, modules: modulesWithContent };
  },

  async createCourse(data: InsertCmsCourse, adminId: number | null) {
    const position = (await courseRepository.getMaxCoursePosition()) + 1;
    return await courseRepository.createCourse({ ...data, position, createdByAdminId: adminId });
  },

  async updateCourse(id: number, data: Partial<InsertCmsCourse>) {
    const existing = await courseRepository.getCourseById(id);
    if (!existing) throw new CourseServiceError("Course not found", 404);
    
    // Position updates handled separately generally, but passed through if provided
    return await courseRepository.updateCourse(id, data as any);
  },

  async deleteCourse(id: number) {
    const course = await courseRepository.getCourseById(id);
    if (!course) throw new CourseServiceError("Course not found", 404);

    // Ensure it's not mapped
    const maps = await courseRepository.getAllFeatureMaps();
    const isMapped = maps.some(m => m.courseId === id);
    if (isMapped) {
      throw new CourseServiceError("Cannot delete mapped course. Unmap it from all features first.", 400);
    }

    const modules = await courseRepository.getModulesByCourseId(id);
    for (const module of modules) {
      await this.deleteModule(module.id);
    }
    
    return await courseRepository.deleteCourse(id);
  },

  // --- MODULES ---
  async createModule(data: InsertCmsModule) {
    const position = (await courseRepository.getMaxModulePosition(data.courseId)) + 1;
    return await courseRepository.createModule({ ...data, position });
  },

  async updateModule(id: number, data: Partial<InsertCmsModule>) {
    const module = await courseRepository.updateModule(id, data as any);
    if (!module) throw new CourseServiceError("Module not found", 404);
    return module;
  },

  async deleteModule(id: number) {
    const folders = await courseRepository.getFoldersByModuleId(id);
    for (const folder of folders) {
      await this.deleteFolder(folder.id);
    }

    const lessons = await courseRepository.getLessonsByModuleId(id);
    for (const lesson of lessons) {
      if (!lesson.folderId) {
        await this.deleteLesson(lesson.id);
      }
    }
    
    const module = await courseRepository.deleteModule(id);
    if (!module) throw new CourseServiceError("Module not found", 404);
    return module;
  },

  // --- FOLDERS ---
  async createFolder(data: InsertCmsModuleFolder) {
    const position = (await courseRepository.getMaxFolderPosition(data.moduleId)) + 1;
    return await courseRepository.createFolder({ ...data, position });
  },

  async updateFolder(id: number, data: Partial<InsertCmsModuleFolder>) {
    const folder = await courseRepository.updateFolder(id, data as any);
    if (!folder) throw new CourseServiceError("Folder not found", 404);
    return folder;
  },

  async deleteFolder(id: number) {
    const lessons = await courseRepository.getLessonsByFolderId(id);
    for (const lesson of lessons) {
      await this.deleteLesson(lesson.id);
    }
    const folder = await courseRepository.deleteFolder(id);
    if (!folder) throw new CourseServiceError("Folder not found", 404);
    return folder;
  },

  // --- LESSONS ---
  async createLesson(data: InsertCmsLesson) {
    const position = (await courseRepository.getMaxLessonPosition(data.moduleId, data.folderId || undefined)) + 1;
    return await courseRepository.createLesson({ ...data, position });
  },

  async updateLesson(id: number, data: Partial<InsertCmsLesson>) {
    const lesson = await courseRepository.updateLesson(id, data as any);
    if (!lesson) throw new CourseServiceError("Lesson not found", 404);
    return lesson;
  },

  async deleteLesson(id: number) {
    const files = await courseRepository.getFilesByLessonId(id);
    for (const file of files) {
      await this.deleteFile(file.id);
    }
    const lesson = await courseRepository.deleteLesson(id);
    if (!lesson) throw new CourseServiceError("Lesson not found", 404);
    return lesson;
  },

  // --- FILES ---
  async getUploadUrlForFile(lessonId: number, filename: string, contentType: string, type: "video" | "audio" | "document") {
    const lesson = await courseRepository.getLessonById(lessonId);
    if (!lesson) throw new CourseServiceError("Lesson not found", 404);

    const module = await courseRepository.getModuleById(lesson.moduleId);
    if (!module) throw new CourseServiceError("Module not found", 404);

    const course = await courseRepository.getCourseById(module.courseId);
    if (!course) throw new CourseServiceError("Course not found", 404);

    let programCode = "GEN";
    if (course.programId) {
      const program = await courseRepository.getProgramById(course.programId);
      if (program) programCode = program.code;
    }

    const key = generateLessonFileKey(programCode, course.id, module.id, lesson.id, filename);
    const result = await getSignedPutUrl(key, contentType);

    if (!result.success) throw new CourseServiceError(result.error || "Failed to generate upload URL", 500);

    return { key: result.key, signedUrl: result.uploadUrl };
  },

  async createFile(data: InsertCmsLessonFile) {
    const position = (await courseRepository.getMaxFilePosition(data.lessonId)) + 1;
    return await courseRepository.createFile({ ...data, position });
  },

  async deleteFile(id: number) {
    const file = await courseRepository.getFileById(id);
    if (!file) throw new CourseServiceError("File not found", 404);
    // Note: Actual R2 deletion should be handled if we need strict cleanup, 
    // but the original code just did DB deletion for safety/history.
    return await courseRepository.deleteFile(id);
  },

  async getFileDownloadUrl(id: number) {
    const file = await courseRepository.getFileById(id);
    if (!file) throw new CourseServiceError("File not found", 404);

    const result = await getSignedGetUrl(file.r2Key);
    if (!result.success || !result.url) {
      throw new CourseServiceError("Failed to generate download URL", 500);
    }
    return { url: result.url };
  },

  // --- FEATURE MAPPING ---
  async getAllFrontendFeatures() {
    return await courseRepository.getAllFrontendFeatures();
  },

  async getFrontendFeatureByCode(code: string) {
    const feature = await courseRepository.getFrontendFeatureByCode(code);
    if (!feature) throw new CourseServiceError("Unknown feature code", 404);
    return feature;
  },

  async getFeatureMaps() {
    return await courseRepository.getAllFeatureMaps();
  },

  async getFeatureMap(featureCode: string) {
    const feature = await this.getFrontendFeatureByCode(featureCode);
    return await courseRepository.getFeatureMapsByFeatureId(feature.id);
  },

  async setFeatureMap(featureCode: string, courseId: number, position: number = 0) {
    const feature = await this.getFrontendFeatureByCode(featureCode);
    await courseRepository.createFeatureMap(feature.id, courseId, position);
    return { success: true };
  },

  async removeFeatureMap(featureCode: string, courseId: number) {
    const feature = await this.getFrontendFeatureByCode(featureCode);
    await courseRepository.deleteFeatureMap(feature.id, courseId);
    return { success: true };
  },

  async clearFeatureCourseMappings(featureId: number) {
    await courseRepository.clearFeatureCourseMappings(featureId);
    return { success: true };
  },

  async reorderFeatureCourseMappings(featureId: number, courseIds: number[]) {
    // Basic array index update
    for (let i = 0; i < courseIds.length; i++) {
        await courseRepository.updateFeatureCourseMappingPosition(featureId, courseIds[i], i);
    }
    return { success: true };
  },

  async toggleFeatureLock(featureId: number, locked: boolean) {
    await courseRepository.toggleFeatureLock(featureId, locked);
    return { success: true };
  },

  async getModulesForCourse(courseId: number) {
    return await courseRepository.getModulesByCourseId(courseId);
  },

  async getLessonsForCourse(courseId: number) {
    return await courseRepository.getLessonsForCourse(courseId);
  },

  async getPlaylistSourceData(courseId: number) {
    return await courseRepository.getPlaylistSourceData(courseId);
  },

  // --- PLAYLISTS ---
  async getUserPlaylists(userId: number) {
    return await courseRepository.getUserPlaylists(userId);
  },

  async getPlaylist(id: number) {
    const playlist = await courseRepository.getPlaylistById(id);
    if (!playlist) throw new CourseServiceError("Playlist not found", 404);
    return playlist;
  },

  async createPlaylist(data: InsertPlaylist) {
    return await courseRepository.createPlaylist(data);
  },

  async deletePlaylist(id: number) {
    const success = await courseRepository.deletePlaylist(id);
    if (!success) throw new CourseServiceError("Playlist not found", 404);
    return true;
  },

  async getPlaylistItems(playlistId: number) {
    const items = await courseRepository.getPlaylistItems(playlistId);
    return await Promise.all(items.map(async (item) => {
      const lesson = await courseRepository.getLessonById(item.lessonId);
      return {
        ...item,
        lesson: lesson || { id: item.lessonId, title: "Unknown Lesson", description: null }
      };
    }));
  },

  async setPlaylistItems(playlistId: number, lessonIds: number[]) {
    // Validate all lessons belong to mapped PLAYLIST course and have audio
    for (const lessonId of lessonIds) {
      const inMappedCourse = await courseRepository.isLessonInMappedCourse(lessonId, "PLAYLIST");
      if (!inMappedCourse) throw new CourseServiceError(`Lesson ${lessonId} is not in the mapped playlist course`, 400);

      const hasAudio = await courseRepository.doesLessonHaveAudio(lessonId);
      if (!hasAudio) throw new CourseServiceError(`Lesson ${lessonId} has no audio files`, 400);
    }

    const items = lessonIds.map((lessonId, index) => ({
      playlistId,
      lessonId,
      position: index,
    }));

    return await courseRepository.setPlaylistItems(playlistId, items);
  },

  async reorderPlaylistItems(playlistId: number, orderedItemIds: number[]) {
    for (let i = 0; i < orderedItemIds.length; i++) {
      await courseRepository.updatePlaylistItemPosition(playlistId, orderedItemIds[i], i);
    }
  },

  async deletePlaylistItem(playlistId: number, itemId: number) {
    const success = await courseRepository.deletePlaylistItem(playlistId, itemId);
    if (!success) throw new CourseServiceError("Playlist item not found", 404);
    return true;
  },

  // --- LESSON PROGRESS ---
  async getCompletedLessonIds(userId: number) {
    return await courseRepository.getCompletedLessonIds(userId);
  },

  async markLessonComplete(userId: number, lessonId: number) {
    return await courseRepository.markLessonComplete(userId, lessonId);
  }
};
