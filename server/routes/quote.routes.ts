import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { quoteController } from "../controllers/quote.controller";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/api/quotes/today", quoteController.getToday);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.get("/api/admin/quotes", authenticateJWT, requireAdmin, quoteController.getAll);
router.post("/api/admin/quotes", authenticateJWT, requireAdmin, quoteController.create);
router.put("/api/admin/quotes/:id", authenticateJWT, requireAdmin, quoteController.update);
router.delete("/api/admin/quotes/:id", authenticateJWT, requireAdmin, quoteController.delete);

export default router;
