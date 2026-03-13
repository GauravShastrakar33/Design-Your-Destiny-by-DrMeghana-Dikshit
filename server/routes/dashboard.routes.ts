import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { dashboardController } from "../controllers/dashboard.controller";

const router = Router();

router.get("/admin/v1/dashboard", authenticateJWT, requireAdmin, dashboardController.getDashboard);

export default router;
