import { bannerRepository } from "../repositories/banner.repository";
import { getSignedPutUrl, getSignedGetUrl } from "../r2Upload";

export const bannerService = {
  // ─── Admin ─────────────────────────────────────────────────────────────────

  async getAll() {
    return bannerRepository.findAll();
  },

  async getById(id: number) {
    const banner = await bannerRepository.findById(id);
    if (!banner) throw new Error("NOT_FOUND");
    return banner;
  },

  async getUploadUrl(filename: string, contentType: string) {
    if (!filename || !contentType) throw new Error("MISSING_PARAMS");
    const key = `session-banners/${Date.now()}-${filename}`;
    const result = await getSignedPutUrl(key, contentType);
    if (!result.success) throw new Error(result.error || "UPLOAD_URL_FAILED");
    return { key: result.key, signedUrl: result.uploadUrl };
  },

  async create(body: {
    type: string;
    thumbnailKey?: string;
    videoKey?: string;
    posterKey?: string;
    ctaText?: string;
    ctaLink?: string;
    startAt: string;
    endAt: string;
    liveEnabled?: boolean;
    liveStartAt?: string;
    liveEndAt?: string;
  }) {
    if (!body.type || !body.startAt || !body.endAt) throw new Error("MISSING_FIELDS");
    return bannerRepository.create({
      type: body.type,
      thumbnailKey: body.thumbnailKey || null,
      videoKey:     body.videoKey     || null,
      posterKey:    body.posterKey    || null,
      ctaText:      body.ctaText      || null,
      ctaLink:      body.ctaLink      || null,
      startAt:      new Date(body.startAt),
      endAt:        new Date(body.endAt),
      liveEnabled:  body.liveEnabled  || false,
      liveStartAt:  body.liveStartAt  ? new Date(body.liveStartAt) : null,
      liveEndAt:    body.liveEndAt    ? new Date(body.liveEndAt)   : null,
    });
  },

  async update(id: number, body: Record<string, any>) {
    const updateData: Record<string, any> = {};
    if (body.type        !== undefined) updateData.type        = body.type;
    if (body.thumbnailKey !== undefined) updateData.thumbnailKey = body.thumbnailKey;
    if (body.videoKey    !== undefined) updateData.videoKey    = body.videoKey;
    if (body.posterKey   !== undefined) updateData.posterKey   = body.posterKey;
    if (body.ctaText     !== undefined) updateData.ctaText     = body.ctaText;
    if (body.ctaLink     !== undefined) updateData.ctaLink     = body.ctaLink;
    if (body.startAt     !== undefined) updateData.startAt     = new Date(body.startAt);
    if (body.endAt       !== undefined) updateData.endAt       = new Date(body.endAt);
    if (body.liveEnabled !== undefined) updateData.liveEnabled = body.liveEnabled;
    if (body.liveStartAt !== undefined) updateData.liveStartAt = body.liveStartAt ? new Date(body.liveStartAt) : null;
    if (body.liveEndAt   !== undefined) updateData.liveEndAt   = body.liveEndAt   ? new Date(body.liveEndAt)   : null;

    const existing = await bannerRepository.findById(id);
    const banner = await bannerRepository.update(id, updateData);
    if (!banner) throw new Error("NOT_FOUND");
    return { banner, existing };
  },

  async deleteBanner(id: number) {
    const existing = await bannerRepository.findById(id);
    const success = await bannerRepository.delete(id);
    if (!success) throw new Error("NOT_FOUND");
    return existing;
  },

  async duplicate(id: number) {
    const original = await bannerRepository.findById(id);
    if (!original) throw new Error("NOT_FOUND");
    return bannerRepository.create({
      type:        original.type,
      thumbnailKey: original.thumbnailKey,
      videoKey:    original.videoKey,
      posterKey:   original.posterKey,
      ctaText:     original.ctaText,
      ctaLink:     original.ctaLink,
      startAt:     original.startAt,
      endAt:       original.endAt,
      liveEnabled: original.liveEnabled,
      liveStartAt: original.liveStartAt,
      liveEndAt:   original.liveEndAt,
    });
  },

  async setDefault(id: number) {
    const banner = await bannerRepository.setDefault(id);
    if (!banner) throw new Error("NOT_FOUND");
    return banner;
  },

  // ─── Public ────────────────────────────────────────────────────────────────

  async getPublicBanner() {
    const now = new Date();

    // Step 1: active banner
    let banner = await bannerRepository.findActive();
    let status = "active";

    // Step 2: fallback to default
    if (!banner) {
      banner = await bannerRepository.findDefault();
      status = "default";
    }

    // Step 3: no banner
    if (!banner) return { banner: null, status: "none" };

    // Generate signed URLs
    const [thumbnailUrl, videoUrl, posterUrl] = await Promise.all([
      banner.thumbnailKey ? getSignedGetUrl(banner.thumbnailKey).then(r => r.success ? r.url : null) : null,
      banner.videoKey     ? getSignedGetUrl(banner.videoKey).then(r => r.success ? r.url : null)     : null,
      banner.posterKey    ? getSignedGetUrl(banner.posterKey).then(r => r.success ? r.url : null)    : null,
    ]);

    const isLive =
      banner.type === "session" &&
      banner.liveEnabled &&
      banner.liveStartAt &&
      banner.liveEndAt &&
      now >= new Date(banner.liveStartAt) &&
      now < new Date(banner.liveEndAt);

    return {
      banner: {
        id:           banner.id,
        type:         banner.type,
        thumbnailUrl,
        videoUrl,
        posterUrl,
        ctaText:      banner.ctaText,
        ctaLink:      banner.ctaLink,
        isLive,
      },
      status,
    };
  },
};
