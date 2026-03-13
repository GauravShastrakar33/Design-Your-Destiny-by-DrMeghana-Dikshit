import { db } from "../db";
import { 
  programs,
  cmsCourses, 
  cmsModules, 
  cmsModuleFolders, 
  cmsLessons, 
  cmsLessonFiles,
  featureCourseMap,
  frontendFeatures,
  playlists as playlistsTable,
  playlistItems as playlistItemsTable,
  lessonProgress as lessonProgressTable,
  type InsertProgram,
  type InsertCmsCourse,
  type InsertCmsModule,
  type InsertCmsModuleFolder,
  type InsertCmsLesson,
  type InsertCmsLessonFile,
  type Playlist,
  type InsertPlaylist,
  type PlaylistItem,
  type InsertPlaylistItem,
  type LessonProgress,
} from "@shared/schema";
import { eq, asc, desc, sql, and, inArray } from "drizzle-orm";

export class CourseRepository {
  // --- PROGRAMS ---
  async getAllPrograms() {
    return await db.select().from(programs).orderBy(asc(programs.name));
  }

  async getProgramById(id: number) {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program;
  }

  async getProgramByCode(code: string) {
    const [program] = await db.select().from(programs).where(eq(programs.code, code));
    return program;
  }

  async createProgram(program: InsertProgram) {
    const [newProgram] = await db.insert(programs).values(program).returning();
    return newProgram;
  }

  async updateProgram(id: number, data: Partial<InsertProgram>) {
    const [updated] = await db.update(programs).set(data).where(eq(programs.id, id)).returning();
    return updated;
  }

  async deleteProgram(id: number) {
    const [deleted] = await db.delete(programs).where(eq(programs.id, id)).returning();
    return deleted;
  }

  // --- COURSES ---
  async getAllCourses(sortOrder: "asc" | "desc" = "asc") {
    return await db.select().from(cmsCourses).orderBy(sortOrder === "desc" ? sql`${cmsCourses.position} DESC` : asc(cmsCourses.position));
  }

  async getCourseById(id: number) {
    const [course] = await db.select().from(cmsCourses).where(eq(cmsCourses.id, id));
    return course;
  }

  async createCourse(course: InsertCmsCourse & { position: number; createdByAdminId: number | null }) {
    const [newCourse] = await db.insert(cmsCourses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, data: Partial<InsertCmsCourse & { position: number }>) {
    const [updated] = await db.update(cmsCourses).set(data).where(eq(cmsCourses.id, id)).returning();
    return updated;
  }

  async deleteCourse(id: number) {
    const [deleted] = await db.delete(cmsCourses).where(eq(cmsCourses.id, id)).returning();
    return deleted;
  }

  async getMaxCoursePosition() {
    const [maxPos] = await db.select({ max: sql<number>`COALESCE(MAX(position), 0)` }).from(cmsCourses);
    return maxPos?.max || 0;
  }

  async updateCoursePosition(id: number, position: number) {
    return await db.update(cmsCourses).set({ position }).where(eq(cmsCourses.id, id)).returning();
  }

  // --- MODULES ---
  async getModulesByCourseId(courseId: number) {
    return await db.select().from(cmsModules).where(eq(cmsModules.courseId, courseId)).orderBy(asc(cmsModules.position));
  }

  async getModuleById(id: number) {
    const [module] = await db.select().from(cmsModules).where(eq(cmsModules.id, id));
    return module;
  }

  async createModule(module: InsertCmsModule & { position: number }) {
    const [newModule] = await db.insert(cmsModules).values(module).returning();
    return newModule;
  }

  async updateModule(id: number, data: Partial<InsertCmsModule & { position: number }>) {
    const [updated] = await db.update(cmsModules).set(data).where(eq(cmsModules.id, id)).returning();
    return updated;
  }

  async deleteModule(id: number) {
    const [deleted] = await db.delete(cmsModules).where(eq(cmsModules.id, id)).returning();
    return deleted;
  }

  async getMaxModulePosition(courseId: number) {
    const [maxPos] = await db.select({ max: sql<number>`COALESCE(MAX(position), 0)` }).from(cmsModules).where(eq(cmsModules.courseId, courseId));
    return maxPos?.max || 0;
  }

  // --- FOLDERS ---
  async getFoldersByModuleId(moduleId: number) {
    return await db.select().from(cmsModuleFolders).where(eq(cmsModuleFolders.moduleId, moduleId)).orderBy(asc(cmsModuleFolders.position));
  }

  async getFolderById(id: number) {
    const [folder] = await db.select().from(cmsModuleFolders).where(eq(cmsModuleFolders.id, id));
    return folder;
  }

  async createFolder(folder: InsertCmsModuleFolder & { position: number }) {
    const [newFolder] = await db.insert(cmsModuleFolders).values(folder).returning();
    return newFolder;
  }

  async updateFolder(id: number, data: Partial<InsertCmsModuleFolder & { position: number }>) {
    const [updated] = await db.update(cmsModuleFolders).set(data).where(eq(cmsModuleFolders.id, id)).returning();
    return updated;
  }

  async deleteFolder(id: number) {
    const [deleted] = await db.delete(cmsModuleFolders).where(eq(cmsModuleFolders.id, id)).returning();
    return deleted;
  }

  async getMaxFolderPosition(moduleId: number) {
    const [maxPos] = await db.select({ max: sql<number>`COALESCE(MAX(position), 0)` }).from(cmsModuleFolders).where(eq(cmsModuleFolders.moduleId, moduleId));
    return maxPos?.max || 0;
  }

  // --- LESSONS ---
  async getLessonsByModuleId(moduleId: number) {
    return await db.select().from(cmsLessons).where(eq(cmsLessons.moduleId, moduleId)).orderBy(asc(cmsLessons.position));
  }

  async getLessonsByFolderId(folderId: number) {
    return await db.select().from(cmsLessons).where(eq(cmsLessons.folderId, folderId)).orderBy(asc(cmsLessons.position));
  }

  async getLessonById(id: number) {
    const [lesson] = await db.select().from(cmsLessons).where(eq(cmsLessons.id, id));
    return lesson;
  }

  async createLesson(lesson: InsertCmsLesson & { position: number }) {
    const [newLesson] = await db.insert(cmsLessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: number, data: Partial<InsertCmsLesson & { position: number }>) {
    const [updated] = await db.update(cmsLessons).set(data).where(eq(cmsLessons.id, id)).returning();
    return updated;
  }

  async deleteLesson(id: number) {
    const [deleted] = await db.delete(cmsLessons).where(eq(cmsLessons.id, id)).returning();
    return deleted;
  }

  async getMaxLessonPosition(moduleId: number, folderId?: number) {
    const conditions = [eq(cmsLessons.moduleId, moduleId)];
    if (folderId) {
      conditions.push(eq(cmsLessons.folderId, folderId));
    } else {
      conditions.push(sql`${cmsLessons.folderId} IS NULL`);
    }
    
    const [maxPos] = await db.select({ max: sql<number>`COALESCE(MAX(position), 0)` })
      .from(cmsLessons)
      .where(and(...conditions));
    return maxPos?.max || 0;
  }

  // --- FILES ---
  async getFilesByLessonId(lessonId: number) {
    return await db.select().from(cmsLessonFiles).where(eq(cmsLessonFiles.lessonId, lessonId)).orderBy(asc(cmsLessonFiles.position));
  }

  async getFileById(id: number) {
    const [file] = await db.select().from(cmsLessonFiles).where(eq(cmsLessonFiles.id, id));
    return file;
  }

  async createFile(file: InsertCmsLessonFile & { position: number }) {
    const [newFile] = await db.insert(cmsLessonFiles).values(file).returning();
    return newFile;
  }

  async deleteFile(id: number) {
    const [deleted] = await db.delete(cmsLessonFiles).where(eq(cmsLessonFiles.id, id)).returning();
    return deleted;
  }

  async getMaxFilePosition(lessonId: number) {
    const [maxPos] = await db.select({ max: sql<number>`COALESCE(MAX(position), 0)` }).from(cmsLessonFiles).where(eq(cmsLessonFiles.lessonId, lessonId));
    return maxPos?.max || 0;
  }

  // --- FEATURE MAPPING ---
  async getAllFrontendFeatures() {
    return await db.select().from(frontendFeatures).orderBy(asc(frontendFeatures.id));
  }

  async getFrontendFeatureByCode(code: string) {
    const [feature] = await db.select().from(frontendFeatures).where(eq(frontendFeatures.code, code));
    return feature;
  }

  async getAllFeatureMaps() {
    return await db.select().from(featureCourseMap);
  }

  async getFeatureMapsByFeatureId(featureId: number) {
    return await db.select().from(featureCourseMap).where(eq(featureCourseMap.featureId, featureId)).orderBy(asc(featureCourseMap.position));
  }

  async createFeatureMap(featureId: number, courseId: number, position: number = 0) {
    return await db.insert(featureCourseMap).values({ featureId, courseId, position }).onConflictDoNothing().returning();
  }

  async deleteFeatureMap(featureId: number, courseId: number) {
    return await db.delete(featureCourseMap).where(and(eq(featureCourseMap.featureId, featureId), eq(featureCourseMap.courseId, courseId))).returning();
  }

  async clearFeatureCourseMappings(featureId: number) {
    return await db.delete(featureCourseMap).where(eq(featureCourseMap.featureId, featureId));
  }

  async updateFeatureCourseMappingPosition(featureId: number, courseId: number, position: number) {
    return await db.update(featureCourseMap).set({ position }).where(and(eq(featureCourseMap.featureId, featureId), eq(featureCourseMap.courseId, courseId)));
  }

  async toggleFeatureLock(featureId: number, locked: boolean) {
    return await db.update(frontendFeatures).set({ mappingLocked: locked }).where(eq(frontendFeatures.id, featureId));
  }

  async getLessonsForCourse(courseId: number) {
    const modules = await this.getModulesByCourseId(courseId);
    const moduleIds = modules.map(m => m.id);
    if (moduleIds.length === 0) return [];
    return await db.select().from(cmsLessons).where(inArray(cmsLessons.moduleId, moduleIds)).orderBy(asc(cmsLessons.position));
  }

  async getPlaylistSourceData(courseId: number) {
    const course = await this.getCourseById(courseId);
    if (!course) return null;

    const modules = await this.getModulesByCourseId(courseId);

    const modulesWithLessons = await Promise.all(modules.map(async (module) => {
      const lessons = await this.getLessonsByModuleId(module.id);

      const lessonsWithAudio = await Promise.all(lessons.map(async (lesson) => {
        const audioFiles = await db
          .select()
          .from(cmsLessonFiles)
          .where(and(eq(cmsLessonFiles.lessonId, lesson.id), eq(cmsLessonFiles.fileType, 'audio')))
          .orderBy(asc(cmsLessonFiles.position));

        if (audioFiles.length === 0) return null;

        return {
          ...lesson,
          audioFiles
        };
      }));

      const filteredLessons = lessonsWithAudio.filter((l): l is NonNullable<typeof l> => l !== null);
      if (filteredLessons.length === 0) return null;

      return {
        ...module,
        lessons: filteredLessons
      };
    }));

    return {
      course,
      modules: modulesWithLessons.filter((m): m is NonNullable<typeof m> => m !== null)
    };
  }

  // --- PLAYLISTS ---
  async getPlaylistById(id: number): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlistsTable).where(eq(playlistsTable.id, id));
    return playlist;
  }

  async getUserPlaylists(userId: number): Promise<Playlist[]> {
    return await db.select().from(playlistsTable).where(eq(playlistsTable.userId, userId)).orderBy(desc(playlistsTable.createdAt));
  }

  async createPlaylist(playlist: InsertPlaylist): Promise<Playlist> {
    const [newPlaylist] = await db.insert(playlistsTable).values(playlist).returning();
    return newPlaylist;
  }

  async deletePlaylist(id: number): Promise<boolean> {
    const result = await db.delete(playlistsTable).where(eq(playlistsTable.id, id)).returning();
    return result.length > 0;
  }

  async getPlaylistItems(playlistId: number) {
    return await db.select().from(playlistItemsTable).where(eq(playlistItemsTable.playlistId, playlistId)).orderBy(asc(playlistItemsTable.position));
  }

  async setPlaylistItems(playlistId: number, items: InsertPlaylistItem[]): Promise<PlaylistItem[]> {
    await db.delete(playlistItemsTable).where(eq(playlistItemsTable.playlistId, playlistId));
    if (items.length === 0) return [];
    return await db.insert(playlistItemsTable).values(items).returning();
  }

  async updatePlaylistItemPosition(playlistId: number, itemId: number, position: number) {
    return await db.update(playlistItemsTable).set({ position }).where(and(eq(playlistItemsTable.playlistId, playlistId), eq(playlistItemsTable.id, itemId)));
  }

  async deletePlaylistItem(playlistId: number, itemId: number): Promise<boolean> {
    const result = await db.delete(playlistItemsTable).where(and(eq(playlistItemsTable.playlistId, playlistId), eq(playlistItemsTable.id, itemId))).returning();
    return result.length > 0;
  }

  // --- PLAYLIST HELPERS ---
  async isLessonInMappedCourse(lessonId: number, featureCode: string): Promise<boolean> {
    const feature = await this.getFrontendFeatureByCode(featureCode);
    if (!feature) return false;

    const mappings = await this.getFeatureMapsByFeatureId(feature.id);
    if (mappings.length === 0) return false;

    const courseId = mappings[0].courseId;
    const moduleIds = (await this.getModulesByCourseId(courseId)).map(m => m.id);
    if (moduleIds.length === 0) return false;

    const [lesson] = await db.select().from(cmsLessons).where(and(eq(cmsLessons.id, lessonId), inArray(cmsLessons.moduleId, moduleIds)));
    return !!lesson;
  }

  async doesLessonHaveAudio(lessonId: number): Promise<boolean> {
    const [audioFile] = await db.select().from(cmsLessonFiles).where(and(eq(cmsLessonFiles.lessonId, lessonId), eq(cmsLessonFiles.fileType, "audio"))).limit(1);
    return !!audioFile;
  }

  // --- LESSON PROGRESS ---
  async getCompletedLessonIds(userId: number): Promise<number[]> {
    const progress = await db
      .select({ lessonId: lessonProgressTable.lessonId })
      .from(lessonProgressTable)
      .where(eq(lessonProgressTable.userId, userId));
    return progress.map(p => p.lessonId);
  }

  async markLessonComplete(userId: number, lessonId: number): Promise<{ alreadyCompleted: boolean; progress: LessonProgress }> {
    const [existing] = await db
      .select()
      .from(lessonProgressTable)
      .where(and(
        eq(lessonProgressTable.userId, userId),
        eq(lessonProgressTable.lessonId, lessonId)
      ));

    if (existing) {
      return { alreadyCompleted: true, progress: existing };
    }

    const [newProgress] = await db
      .insert(lessonProgressTable)
      .values({ userId, lessonId })
      .returning();

    return { alreadyCompleted: false, progress: newProgress };
  }
}

export const courseRepository = new CourseRepository();
