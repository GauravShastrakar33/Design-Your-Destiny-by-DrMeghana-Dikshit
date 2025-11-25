import type { Request, Response, NextFunction } from "express";

export type UserRole = "USER" | "COACH" | "SUPER_ADMIN";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role as UserRole | undefined;

    if (!role) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }

    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.role as UserRole | undefined;

  if (!role) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!["SUPER_ADMIN", "COACH"].includes(role)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}
