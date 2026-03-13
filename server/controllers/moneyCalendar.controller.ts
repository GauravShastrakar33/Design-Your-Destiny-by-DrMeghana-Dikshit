import { Request, Response } from "express";
import { moneyCalendarService } from "../services/moneyCalendar.service";

export const moneyCalendarController = {
  async upsertEntry(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });

      const { date, amount } = req.body;

      if (!date || typeof date !== "string") {
        return res.status(400).json({ error: "Date is required in YYYY-MM-DD format" });
      }
      if (amount === undefined || amount === null || typeof amount !== "number") {
        return res.status(400).json({ error: "Amount is required as a number" });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
      }

      const entry = await moneyCalendarService.upsertEntry(req.user.sub, date, amount);
      res.json(entry);
    } catch (error) {
      console.error("Error saving money entry:", error);
      res.status(500).json({ error: "Failed to save money entry" });
    }
  },

  async getCalendar(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Not authenticated" });

      const { month } = req.query;
      if (!month || typeof month !== "string") {
        return res.status(400).json({ error: "Month is required in YYYY-MM format" });
      }
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: "Month must be in YYYY-MM format" });
      }

      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthStr, 10);

      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: "Invalid month value" });
      }

      const data = await moneyCalendarService.getMonthlyData(req.user.sub, year, monthNum);
      res.json(data);
    } catch (error) {
      console.error("Error fetching money calendar:", error);
      res.status(500).json({ error: "Failed to fetch money calendar" });
    }
  },
};
