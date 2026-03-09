import { Request } from "express";
import { db } from "../db";
import { auditLogs } from "@shared/schema";

export type AuditAction = 
  | "CREATE" 
  | "UPDATE" 
  | "DELETE" 
  | "LOGIN" 
  | "LOGIN_FAILED" 
  | "MAP" 
  | "UNMAP" 
  | "ASSIGN" 
  | "UNASSIGN" 
  | "UPDATE_ROLE" 
  | "UPDATE_STATUS" 
  | "PASSWORD_CHANGE" 
  | "PASSWORD_RESET";

export interface LogAuditParams {
  req: Request;
  userId: number;
  userEmail: string;
  action: AuditAction;
  entityType: string;
  entityId: string | number;
  relatedEntityId?: string | number | null;
  oldValues?: any;
  newValues?: any;
  changesSummary?: string | null;
  reason?: string | null;
}

export function logAudit({
  req,
  userId,
  userEmail,
  action,
  entityType,
  entityId,
  relatedEntityId,
  oldValues,
  newValues,
  changesSummary,
  reason,
}: LogAuditParams) {
  try {
    // Attempt to extract IP and user agent safely
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (req) {
      ipAddress = req.headers['x-forwarded-for'] as string || req.ip || req.connection?.remoteAddress || null;
      if (ipAddress && ipAddress.length > 45) {
        ipAddress = ipAddress.substring(0, 45); // Trim to max length
      }
      userAgent = req.get("User-Agent") || null;
    }

    // Insert audit log asynchronously to not block the current request
    db.insert(auditLogs).values({
      userId,
      userEmail,
      action,
      entityType,
      entityId: String(entityId),
      relatedEntityId: relatedEntityId ? String(relatedEntityId) : null,
      oldValues: oldValues || null,
      newValues: newValues || null,
      changesSummary: changesSummary || null,
      reason: reason || null,
      ipAddress,
      userAgent,
    }).catch(err => {
      console.error("[AuditLog Error] Failed to insert audit log:", err);
    });
  } catch (error) {
    console.error("[AuditLog Error] Critical error in logAudit utility:", error);
  }
}
