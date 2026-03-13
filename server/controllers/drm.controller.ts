import { Request, Response } from "express";
import { drmService } from "../services/drm.service";
import { logAudit } from "../utils/audit";

export const drmController = {
  // ─── User ─────────────────────────────────────────────────────────────────

  async getUserQuestions(req: Request, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      res.json(await drmService.getUserQuestions(userId));
    } catch (error) {
      console.error("Error fetching DrM questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  },

  async getQuestionById(req: Request, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      res.json(await drmService.getQuestionById(parseInt(req.params.id), userId));
    } catch (error: any) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Question not found" });
      if (error.message === "FORBIDDEN") return res.status(403).json({ error: "Access denied" });
      console.error("Error fetching DrM question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  },

  async submitQuestion(req: Request, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const question = await drmService.submitQuestion(userId, req.body.questionText);
      res.status(201).json({ success: true, message: "Your question has been sent. Dr. M will respond soon.", question });
    } catch (error: any) {
      if (error.message === "QUESTION_REQUIRED") return res.status(400).json({ error: "Question text is required" });
      if (error.message === "QUESTION_EMPTY")    return res.status(400).json({ error: "Question cannot be empty" });
      if (error.message === "QUESTION_TOO_LONG") return res.status(400).json({ error: "Question exceeds 240 character limit" });
      if (error.message === "ALREADY_SUBMITTED") return res.status(409).json({ error: "You have already submitted a question this month" });
      console.error("Error submitting DrM question:", error);
      res.status(500).json({ error: "Failed to submit question" });
    }
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async getAllQuestions(_req: Request, res: Response) {
    try {
      res.json(await drmService.getAllQuestions());
    } catch (error) {
      console.error("Error fetching DrM questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  },

  async getAdminQuestionById(req: Request, res: Response) {
    try {
      res.json(await drmService.getAdminQuestionById(parseInt(req.params.id)));
    } catch (error: any) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Question not found" });
      console.error("Error fetching DrM question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  },

  async getAnswerUploadUrl(req: Request, res: Response) {
    try {
      const result = await drmService.getAnswerUploadUrl(parseInt(req.params.id), req.body.mimeType);
      res.json(result);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Question not found" });
      console.error("Error generating audio upload URL:", error);
      res.status(500).json({ error: error.message || "Failed to generate upload URL" });
    }
  },

  async confirmAnswer(req: Request, res: Response) {
    try {
      const questionId = parseInt(req.params.id);
      const { audioKey } = req.body;
      const result = await drmService.confirmAnswer(questionId, audioKey);

      if (req.user) {
        logAudit({
          req,
          userId: req.user.sub,
          userEmail: req.user.email,
          action: "UPDATE",
          entityType: "DRM_QUESTION",
          entityId: questionId,
          oldValues: { status: "PENDING" },
          newValues: { status: "ANSWERED", audioR2Key: audioKey },
        });
      }

      console.log(`DrM answer submitted for question ${questionId}`);
      res.json({
        success: true,
        message: "Answer submitted and user notified",
        question: result.updated,
        audioUrl: result.audioUrl,
      });
    } catch (error: any) {
      if (error.message === "AUDIO_KEY_REQUIRED") return res.status(400).json({ error: "Audio key is required" });
      if (error.message === "NOT_FOUND")          return res.status(404).json({ error: "Question not found" });
      if (error.message === "UPDATE_FAILED")      return res.status(500).json({ error: "Failed to update question" });
      console.error("Error confirming DrM answer:", error);
      res.status(500).json({ error: "Failed to confirm answer" });
    }
  },
};
