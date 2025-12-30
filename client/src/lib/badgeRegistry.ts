export interface BadgeDefinition {
  key: string;
  displayName: string;
  meaning: string;
  howToEarn: string;
  type: "core" | "meta" | "admin";
  threshold?: number;
}

export const BADGE_REGISTRY: BadgeDefinition[] = [
  {
    key: "day_zero",
    displayName: "Day Zero",
    meaning: "Awareness before action",
    howToEarn: "Create your account to begin the journey",
    type: "core",
    threshold: 0,
  },
  {
    key: "spark",
    displayName: "Spark",
    meaning: "Momentum initiated",
    howToEarn: "Earned after 3 days of consistency",
    type: "core",
    threshold: 3,
  },
  {
    key: "pulse",
    displayName: "Pulse",
    meaning: "Rhythm established",
    howToEarn: "Earned after 7 days of consistency",
    type: "core",
    threshold: 7,
  },
  {
    key: "anchor",
    displayName: "Anchor",
    meaning: "Habit grounded",
    howToEarn: "Earned after 30 days of consistency",
    type: "core",
    threshold: 30,
  },
  {
    key: "aligned",
    displayName: "Aligned",
    meaning: "Practice internalized",
    howToEarn: "Earned after 90 days of consistency",
    type: "core",
    threshold: 90,
  },
  {
    key: "disciplined",
    displayName: "Disciplined",
    meaning: "Control beyond motivation",
    howToEarn: "Earned after 100 days of consistency",
    type: "core",
    threshold: 100,
  },
  {
    key: "unstoppable",
    displayName: "Unstoppable",
    meaning: "Rare continuity",
    howToEarn: "Earned after 365 days of consistency",
    type: "core",
    threshold: 365,
  },
  {
    key: "integrated",
    displayName: "Integrated",
    meaning: "Lifestyle-level integration",
    howToEarn: "Earned after 1000 days of consistency",
    type: "core",
    threshold: 1000,
  },
  {
    key: "titan",
    displayName: "Titan",
    meaning: "Permanence",
    howToEarn: "Earned after 3000 days of consistency",
    type: "core",
    threshold: 3000,
  },
  {
    key: "resilient",
    displayName: "Resilient",
    meaning: "Strength through setback",
    howToEarn: "Rebuild a 14-day streak after a break",
    type: "meta",
  },
  {
    key: "relentless",
    displayName: "Relentless",
    meaning: "Repeated mastery",
    howToEarn: "Complete 3 separate 30-day streaks",
    type: "meta",
  },
  {
    key: "ambassador",
    displayName: "Ambassador",
    meaning: "Inspiring others through authentic sharing",
    howToEarn: "Awarded for sharing authentic testimonials about your DYD journey",
    type: "admin",
  },
  {
    key: "hall_of_fame",
    displayName: "Hall of Fame",
    meaning: "Meaningful transformation achieved",
    howToEarn: "Awarded for achieving meaningful personal outcomes you came for",
    type: "admin",
  },
];

export function getBadgeByKey(key: string): BadgeDefinition | undefined {
  return BADGE_REGISTRY.find(b => b.key === key);
}

export function getBadgeSvgPath(key: string): string {
  return `/badges/${key}.svg`;
}
