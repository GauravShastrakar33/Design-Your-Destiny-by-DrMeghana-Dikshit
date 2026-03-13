import { drmRepository } from "../repositories/drm.repository";
import { getSignedGetUrl, getSignedPutUrl } from "../r2Upload";
import { sendPushNotification } from "../lib/firebaseAdmin";

function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const drmService = {
  // ─── User ─────────────────────────────────────────────────────────────────

  async getUserQuestions(userId: number) {
    const questions = await drmRepository.findByUser(userId);
    const currentMonthYear = getCurrentMonthYear();
    const hasSubmittedThisMonth = questions.some((q) => q.monthYear === currentMonthYear);
    return { questions, currentMonthYear, hasSubmittedThisMonth };
  },

  async getQuestionById(questionId: number, userId: number) {
    const question = await drmRepository.findById(questionId);
    if (!question) throw new Error("NOT_FOUND");
    if (question.userId !== userId) throw new Error("FORBIDDEN");

    let audioUrl: string | null = null;
    if (question.audioR2Key) {
      const result = await getSignedGetUrl(question.audioR2Key);
      if (result.success && result.url) audioUrl = result.url;
    }
    return { ...question, audioUrl };
  },

  async submitQuestion(userId: number, questionText: string) {
    if (!questionText || typeof questionText !== "string") throw new Error("QUESTION_REQUIRED");
    if (questionText.trim().length === 0) throw new Error("QUESTION_EMPTY");
    if (questionText.length > 240) throw new Error("QUESTION_TOO_LONG");

    const monthYear = getCurrentMonthYear();
    const existing = await drmRepository.findByUserMonth(userId, monthYear);
    if (existing) throw new Error("ALREADY_SUBMITTED");

    return drmRepository.create({ userId, questionText: questionText.trim(), monthYear });
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async getAllQuestions() {
    return drmRepository.findAll();
  },

  async getAdminQuestionById(questionId: number) {
    const question = await drmRepository.findById(questionId);
    if (!question) throw new Error("NOT_FOUND");

    const user = await drmRepository.getUserById(question.userId);

    let audioUrl: string | null = null;
    if (question.audioR2Key) {
      const result = await getSignedGetUrl(question.audioR2Key);
      if (result.success && result.url) audioUrl = result.url;
    }
    return { ...question, userName: user?.name || "Unknown", audioUrl };
  },

  async getAnswerUploadUrl(questionId: number, mimeType?: string) {
    const question = await drmRepository.findById(questionId);
    if (!question) throw new Error("NOT_FOUND");

    const contentType = mimeType || "audio/webm";
    let extension = "webm";
    if (contentType.includes("mp4") || contentType.includes("m4a")) extension = "mp4";
    else if (contentType.includes("ogg")) extension = "ogg";

    const audioKey = `drm-audio/questions/${questionId}/answer.${extension}`;
    const result = await getSignedPutUrl(audioKey, contentType);
    if (!result.success) throw new Error(result.error || "UPLOAD_URL_FAILED");
    return { uploadUrl: result.uploadUrl, audioKey };
  },

  async confirmAnswer(questionId: number, audioKey: string) {
    if (!audioKey) throw new Error("AUDIO_KEY_REQUIRED");

    const question = await drmRepository.findById(questionId);
    if (!question) throw new Error("NOT_FOUND");

    const updated = await drmRepository.updateAnswer(questionId, audioKey);
    if (!updated) throw new Error("UPDATE_FAILED");

    // Create notification
    const notification = await drmRepository.createNotification({
      title: "Dr. M has answered your question 🎧",
      body: "Your personal voice response is ready to listen.",
      type: "drm_answer",
      scheduledAt: new Date(),
      sent: true,
      requiredProgramCode: "",
      requiredProgramLevel: 0,
    });

    // Send push to user's devices
    const userTokens = await drmRepository.getDeviceTokensByUserIds([question.userId]);

    if (userTokens.length > 0) {
      const tokens = userTokens.map((t) => t.token);
      const pushResult = await sendPushNotification(
        tokens,
        "Dr. M has answered your question 🎧",
        "Your personal voice response is ready to listen.",
        { notificationId: notification.id.toString(), questionId: questionId.toString(), deepLink: `/dr-m/questions/${questionId}` }
      );
      await drmRepository.insertNotificationLogs(
        userTokens.map((t) => ({ notificationId: notification.id, userId: t.userId, deviceToken: t.token, status: pushResult.successCount > 0 ? "sent" : "failed" }))
      );
    } else {
      // In-app only
      await drmRepository.insertNotificationLogs([{ notificationId: notification.id, userId: question.userId, deviceToken: "in-app-only", status: "sent" }]);
    }

    const audioUrlResult = await getSignedGetUrl(audioKey);
    return { updated, notification, audioUrl: audioUrlResult };
  },
};
