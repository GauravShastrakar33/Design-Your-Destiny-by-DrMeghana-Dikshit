import { storage } from "../storage";

const CORE_BADGE_THRESHOLDS: { key: string; threshold: number }[] = [
  { key: "spark", threshold: 3 },
  { key: "pulse", threshold: 7 },
  { key: "anchor", threshold: 30 },
  { key: "aligned", threshold: 90 },
  { key: "disciplined", threshold: 100 },
  { key: "unstoppable", threshold: 365 },
  { key: "integrated", threshold: 1000 },
  { key: "titan", threshold: 3000 },
];

interface StreakCycle {
  start: string;
  end: string;
  length: number;
}

function analyzeStreakHistory(dates: string[]): { cycles: StreakCycle[]; currentStreak: number; hadBreak: boolean } {
  if (dates.length === 0) return { cycles: [], currentStreak: 0, hadBreak: false };

  const sortedDates = [...dates].sort();
  const cycles: StreakCycle[] = [];
  let currentCycleStart = sortedDates[0];
  let currentCycleLength = 1;
  let hadBreak = false;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1] + 'T12:00:00');
    const currDate = new Date(sortedDates[i] + 'T12:00:00');
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentCycleLength++;
    } else {
      cycles.push({
        start: currentCycleStart,
        end: sortedDates[i - 1],
        length: currentCycleLength,
      });
      hadBreak = true;
      currentCycleStart = sortedDates[i];
      currentCycleLength = 1;
    }
  }

  cycles.push({
    start: currentCycleStart,
    end: sortedDates[sortedDates.length - 1],
    length: currentCycleLength,
  });

  const currentStreak = cycles.length > 0 ? cycles[cycles.length - 1].length : 0;

  return { cycles, currentStreak, hadBreak };
}

export async function evaluateBadges(userId: number, todayDate: string): Promise<string[]> {
  const earnedBadgeKeys = await storage.getUserBadgeKeys(userId);
  const earnedSet = new Set(earnedBadgeKeys);

  const currentStreak = await storage.getCurrentStreak(userId, todayDate);

  if (!earnedSet.has("day_zero")) {
    await storage.awardBadge(userId, "day_zero");
  }

  for (const { key, threshold } of CORE_BADGE_THRESHOLDS) {
    if (!earnedSet.has(key) && currentStreak >= threshold) {
      await storage.awardBadge(userId, key);
    }
  }

  const allDates = await storage.getAllStreakHistory(userId);
  const { cycles, hadBreak } = analyzeStreakHistory(allDates);

  if (!earnedSet.has("resilient") && hadBreak) {
    const hasStreakAfterBreak = cycles.length >= 2;
    if (hasStreakAfterBreak) {
      const lastCycle = cycles[cycles.length - 1];
      if (lastCycle.length >= 14) {
        await storage.awardBadge(userId, "resilient");
      }
    }
  }

  if (!earnedSet.has("relentless")) {
    const completedThirtyDayStreaks = cycles.filter(c => c.length >= 30).length;
    
    let metadata = await storage.getBadgeMetadata(userId, "relentless_progress") as { count?: number } | null;
    if (!metadata) {
      metadata = { count: 0 };
    }

    if (completedThirtyDayStreaks >= 3) {
      await storage.awardBadge(userId, "relentless", { cyclesCompleted: completedThirtyDayStreaks });
    }
  }

  // Get all unnotified badges (including newly awarded and admin-granted)
  const unnotifiedBadges = await storage.getUnnotifiedBadgeKeys(userId);
  
  // Mark them all as notified
  if (unnotifiedBadges.length > 0) {
    await storage.markBadgesAsNotified(userId, unnotifiedBadges);
  }

  return unnotifiedBadges;
}

export async function awardAdminBadge(
  userId: number, 
  badgeKey: "ambassador" | "hall_of_fame"
): Promise<{ success: boolean; alreadyEarned: boolean }> {
  const hasBadge = await storage.hasBadge(userId, badgeKey);
  if (hasBadge) {
    return { success: false, alreadyEarned: true };
  }
  
  const awarded = await storage.awardBadge(userId, badgeKey);
  return { success: !!awarded, alreadyEarned: false };
}
