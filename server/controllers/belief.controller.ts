import { Request, Response } from "express";
import { beliefService, BeliefServiceError } from "../services/belief.service";

// Helper function to handle service errors
const handleServiceError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof BeliefServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
};

export const beliefController = {
  getRewiringBeliefs: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const beliefs = await beliefService.getRewiringBeliefs(req.user.sub);
      res.json(beliefs);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch beliefs");
    }
  },

  createRewiringBelief: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { limitingBelief, upliftingBelief } = req.body;
      const belief = await beliefService.createRewiringBelief(
        req.user.sub,
        limitingBelief,
        upliftingBelief
      );

      res.status(201).json(belief);
    } catch (error) {
      handleServiceError(res, error, "Failed to create belief");
    }
  },

  updateRewiringBelief: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const { limitingBelief, upliftingBelief } = req.body;

      const updated = await beliefService.updateRewiringBelief(id, req.user.sub, {
        limitingBelief,
        upliftingBelief,
      });

      res.json(updated);
    } catch (error) {
      handleServiceError(res, error, "Failed to update belief");
    }
  },

  deleteRewiringBelief: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const result = await beliefService.deleteRewiringBelief(id, req.user.sub);

      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Failed to delete belief");
    }
  },
};
