import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { moneyCalendarController } from "../controllers/moneyCalendar.controller";

const router = Router();

router.post("/api/v1/money-calendar/entry", authenticateJWT, moneyCalendarController.upsertEntry);
router.get("/api/v1/money-calendar", authenticateJWT, moneyCalendarController.getCalendar);

export default router;
