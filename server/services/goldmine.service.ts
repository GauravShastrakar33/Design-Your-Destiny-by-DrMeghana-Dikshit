import { goldmineRepository } from "../repositories/goldmine.repository";
import { uploadBufferToR2, deleteR2Object, getSignedGetUrl, getSignedPutUrl } from "../r2Upload";
import crypto from "crypto";

export const goldmineService = {
  // ─── Admin ─────────────────────────────────────────────────────────────────

  async getUploadUrls(videoContentType: string = "video/mp4", thumbnailContentType: string = "image/webp") {
    const uuid = crypto.randomUUID();
    const videoKey = `goldmine/videos/${uuid}.mp4`;
    const thumbnailKey = `goldmine/thumbnails/${uuid}.webp`;

    const [videoResult, thumbnailResult] = await Promise.all([
      getSignedPutUrl(videoKey, videoContentType),
      getSignedPutUrl(thumbnailKey, thumbnailContentType),
    ]);

    if (!videoResult.success || !thumbnailResult.success) throw new Error("UPLOAD_URL_FAILED");

    return { uuid, video: { uploadUrl: videoResult.uploadUrl, key: videoKey }, thumbnail: { uploadUrl: thumbnailResult.uploadUrl, key: thumbnailKey } };
  },

  async confirmUpload(data: { id: string; title: string; description?: string; videoKey: string; thumbnailKey: string; sizeMb: number; tags: any; isPublished: any }) {
    if (!data.id || !data.title || !data.videoKey || !data.thumbnailKey) throw new Error("MISSING_FIELDS");

    const tagsToProcess = typeof data.tags === "string" ? data.tags.split(",") : Array.isArray(data.tags) ? data.tags : [];
    const normalizedTags = Array.from(new Set(tagsToProcess.map((t: any) => String(t).trim().toLowerCase()).filter((t: string) => t.length > 0))) as string[];

    return goldmineRepository.create({
      id: data.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      r2Key: data.videoKey,
      thumbnailKey: data.thumbnailKey,
      durationSec: null,
      sizeMb: Math.max(0, parseInt(data.sizeMb as any) || 0),
      tags: normalizedTags,
      isPublished: data.isPublished === true || data.isPublished === "true",
    });
  },

  async uploadDirectly(files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] }, body: any) {
    if (!body.title || typeof body.title !== "string" || body.title.trim() === "") throw new Error("MISSING_TITLE");
    if (!body.tags) throw new Error("MISSING_TAGS");
    if (!files?.video?.[0]) throw new Error("MISSING_VIDEO");
    if (!files?.thumbnail?.[0]) throw new Error("MISSING_THUMBNAIL");

    const videoFile = files.video[0];
    const thumbnailFile = files.thumbnail[0];
    const uuid = crypto.randomUUID();
    const videoKey = `goldmine/videos/${uuid}.mp4`;
    const thumbnailKey = `goldmine/thumbnails/${uuid}.webp`;

    const tagsToProcess = typeof body.tags === "string" ? body.tags.split(",") : Array.isArray(body.tags) ? body.tags : [];
    if (tagsToProcess.length === 0 && !Array.isArray(body.tags)) throw new Error("INVALID_TAGS");
    const normalizedTags = Array.from(new Set(tagsToProcess.map((t: any) => String(t).trim().toLowerCase()).filter((t: string) => t.length > 0))) as string[];

    const sizeMb = Math.ceil(videoFile.size / (1024 * 1024));

    const videoUpload = await uploadBufferToR2(videoFile.buffer, videoKey, videoFile.mimetype || "video/mp4");
    if (!videoUpload.success) throw new Error("VIDEO_UPLOAD_FAILED");

    const thumbnailUpload = await uploadBufferToR2(thumbnailFile.buffer, thumbnailKey, thumbnailFile.mimetype || "image/webp");
    if (!thumbnailUpload.success) throw new Error("THUMBNAIL_UPLOAD_FAILED");

    return goldmineRepository.create({
      id: uuid,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      r2Key: videoKey,
      thumbnailKey,
      durationSec: null,
      sizeMb,
      tags: normalizedTags,
      isPublished: body.isPublished === "true" || body.isPublished === true,
    });
  },

  async update(id: string, body: any, file?: Express.Multer.File) {
    const video = await goldmineRepository.findById(id);
    if (!video) throw new Error("NOT_FOUND");

    const updateData: any = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim() === "") throw new Error("INVALID_TITLE");
      updateData.title = body.title.trim();
    }
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.tags !== undefined) {
      const tagsToProcess = typeof body.tags === "string" ? body.tags.split(",") : Array.isArray(body.tags) ? body.tags : null;
      if (tagsToProcess === null) throw new Error("INVALID_TAGS");
      updateData.tags = Array.from(new Set(tagsToProcess.map((t: any) => String(t).trim().toLowerCase()).filter((t: string) => t.length > 0))) as string[];
    }
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished === "true" || body.isPublished === true;

    if (file) {
      const thumbnailKey = `goldmine/thumbnails/${id}.webp`;
      const uploadResult = await uploadBufferToR2(file.buffer, thumbnailKey, file.mimetype || "image/webp");
      if (!uploadResult.success) throw new Error("THUMBNAIL_UPLOAD_FAILED");

      if (video.thumbnailKey && video.thumbnailKey !== thumbnailKey) {
        await deleteR2Object(video.thumbnailKey);
      }
      updateData.thumbnailKey = thumbnailKey;
    }

    const updated = await goldmineRepository.update(id, updateData);
    if (!updated) throw new Error("UPDATE_FAILED");
    return { updated, existing: video };
  },

  async deleteVideo(id: string) {
    const video = await goldmineRepository.findById(id);
    if (!video) throw new Error("NOT_FOUND");

    if (video.r2Key) {
      const result = await deleteR2Object(video.r2Key);
      if (!result.success) throw new Error("VIDEO_DELETE_FAILED");
    }
    if (video.thumbnailKey) {
      const result = await deleteR2Object(video.thumbnailKey);
      if (!result.success) throw new Error("THUMBNAIL_DELETE_FAILED");
    }

    const success = await goldmineRepository.delete(id);
    if (!success) throw new Error("DELETE_FAILED");
    return video;
  },

  async listAll(page: number, limit: number, search?: string) {
    const { data, total } = await goldmineRepository.listAll({ page, limit, search });
    const dataWithSignedUrls = await Promise.all(
      data.map(async (v) => {
        let thumbnailSignedUrl: string | null = null;
        if (v.thumbnailKey) {
          const result = await getSignedGetUrl(v.thumbnailKey);
          if (result.success && result.url) thumbnailSignedUrl = result.url;
        }
        return { ...v, thumbnailSignedUrl };
      })
    );
    return { data: dataWithSignedUrls, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  },

  // ─── User ─────────────────────────────────────────────────────────────────

  async listPublished(page: number, limit: number, search?: string) {
    const { data, total } = await goldmineRepository.listPublished({ page, limit, search });
    const transformed = await Promise.all(
      data.map(async (v) => {
        let thumbnailUrl = "";
        if (v.thumbnailKey) {
          const result = await getSignedGetUrl(v.thumbnailKey);
          if (result.success && result.url) thumbnailUrl = result.url;
        }
        return { id: v.id, title: v.title, description: v.description, thumbnailUrl, durationSec: v.durationSec, createdAt: v.createdAt };
      })
    );
    return { data: transformed, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  },

  async getPlaybackUrl(id: string) {
    const video = await goldmineRepository.findById(id);
    if (!video || !video.isPublished) throw new Error("NOT_FOUND");
    if (!video.r2Key) throw new Error("MISSING_FILE");

    const result = await getSignedGetUrl(video.r2Key);
    if (!result.success || !result.url) throw new Error("URL_GENERATION_FAILED");
    return { videoUrl: result.url };
  },
};
