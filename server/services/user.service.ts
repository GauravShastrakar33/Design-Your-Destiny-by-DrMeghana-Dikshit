import { userRepository } from "../repositories/user.repository";
import bcrypt from "bcryptjs";

export class UserServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "UserServiceError";
  }
}

export const userService = {
  // ===== USER TIMEZONE =====
  async updateUserTimezone(userId: number, timezone: string) {
    if (!timezone || typeof timezone !== "string" || timezone.length > 50) {
      throw new UserServiceError("Invalid timezone format", 400);
    }
    await userRepository.updateUserTimezone(userId, timezone);
    return { success: true, timezone };
  },

  // ===== USER PROFILE (NAME & PASSWORD) =====
  async updateUserName(userId: number, name: string) {
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new UserServiceError("Name is required", 400);
    }

    const trimmedName = name.trim();
    const user = await userRepository.updateUserName(userId, trimmedName);
    
    if (!user) {
      throw new UserServiceError("User not found", 404);
    }

    return { success: true, name: user.name };
  },

  async changePassword(userId: number, currentPassword?: string, newPassword?: string) {
    if (!currentPassword || !newPassword) {
      throw new UserServiceError("Current and new password are required", 400);
    }

    if (newPassword.length < 6) {
      throw new UserServiceError("New password must be at least 6 characters", 400);
    }

    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new UserServiceError("User not found", 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new UserServiceError("Current password is incorrect", 400);
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updateUserPassword(userId, hashedPassword);

    // Clear forcePasswordChange flag if it was set
    await userRepository.clearForcePasswordChange(userId);

    return { success: true, message: "Password changed successfully" };
  },

  // ===== USER WELLNESS PROFILE =====
  async getWellnessProfile(userId: number) {
    const profile = await userRepository.getWellnessProfileByUserId(userId);
    return profile || { userId, karmicAffirmation: null, prescription: null };
  },

  async updateWellnessProfile(userId: number, data: { karmicAffirmation?: string | null; prescription?: string | null }) {
    // Verify user exists
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new UserServiceError("User not found", 404);
    }

    const profile = await userRepository.upsertWellnessProfile(userId, {
      karmicAffirmation: data.karmicAffirmation ?? null,
      prescription: data.prescription ?? null,
    });

    return profile;
  }
};
