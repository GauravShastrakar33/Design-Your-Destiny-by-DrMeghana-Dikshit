import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { beliefController } from "../controllers/belief.controller";

const router = Router();

// ===== REWIRING BELIEFS ROUTES =====

// GET /api/v1/rewiring-beliefs - Get all beliefs for authenticated user
router.get("/api/v1/rewiring-beliefs", authenticateJWT, beliefController.getRewiringBeliefs);

// POST /api/v1/rewiring-beliefs - Create a new belief pair
router.post("/api/v1/rewiring-beliefs", authenticateJWT, beliefController.createRewiringBelief);

// PUT /api/v1/rewiring-beliefs/:id - Update an existing belief
router.put("/api/v1/rewiring-beliefs/:id", authenticateJWT, beliefController.updateRewiringBelief);

// DELETE /api/v1/rewiring-beliefs/:id - Delete a belief
router.delete("/api/v1/rewiring-beliefs/:id", authenticateJWT, beliefController.deleteRewiringBelief);

export default router;
