import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { articleController, uploadArticleImage } from "../controllers/article.controller";

const router = Router();

// ─── Categories ───────────────────────────────────────────────────────────────
router.get("/api/categories", articleController.getCategories);
router.post("/api/admin/categories", authenticateJWT, requireAdmin, articleController.createCategory);

// ─── Articles (Public) ────────────────────────────────────────────────────────
router.get("/api/articles", articleController.getPublished);
router.get("/api/articles/:id", articleController.getPublishedById);

// ─── Articles (Admin) ─────────────────────────────────────────────────────────
router.get("/api/admin/articles", authenticateJWT, requireAdmin, articleController.getAllAdmin);
router.post("/api/admin/articles", authenticateJWT, requireAdmin, articleController.create);
router.put("/api/admin/articles/:id", authenticateJWT, requireAdmin, articleController.update);
router.delete("/api/admin/articles/:id", authenticateJWT, requireAdmin, articleController.delete);
router.post(
  "/api/admin/upload/article-image",
  authenticateJWT,
  requireAdmin,
  uploadArticleImage.single("image"),
  articleController.uploadImage
);

export default router;
