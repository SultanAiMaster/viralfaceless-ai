/**
 * Channel Configuration - 10 Faceless YouTube Channels
 * Each channel targets a specific viral niche
 */

export interface ChannelConfig {
  id: string;
  name: string;
  niche: string;
  categoryId: number;
  targetAudience: string;
  uploadTimes: string[]; // 3 upload times per day
  timezone: string;
  language: string;
  enabled: boolean;
}

export const CHANNELS: ChannelConfig[] = [
  {
    id: "ch-001",
    name: "WealthMindset",
    niche: "money-wealth",
    categoryId: 22, // People & Blogs
    targetAudience: "USA, India, UK",
    uploadTimes: ["08:00", "14:00", "20:00"],
    timezone: "America/New_York",
    language: "en",
    enabled: true,
  },
  {
    id: "ch-002",
    name: "AITechNews",
    niche: "ai-technology",
    categoryId: 28, // Science & Technology
    targetAudience: "Global",
    uploadTimes: ["08:30", "14:30", "20:30"],
    timezone: "UTC",
    language: "en",
    enabled: true,
  },
  {
    id: "ch-003",
    name: "DailyMotivation",
    niche: "motivation-success",
    categoryId: 22, // People & Blogs
    targetAudience: "USA, India",
    uploadTimes: ["09:00", "15:00", "21:00"],
    timezone: "America/New_York",
    language: "en",
    enabled: true,
  },
  {
    id: "ch-004",
    name: "MindBlowingFacts",
    niche: "facts-trivia",
    categoryId: 22, // People & Blogs
    targetAudience: "Global",
    uploadTimes: ["09:30", "15:30", "21:30"],
    timezone: "UTC",
    language: "en",
    enabled: true,
  },
  {
    id: "ch-005",
    name: "HealthHub",
    niche: "health-fitness",
    categoryId: 24, // Entertainment (often used for health content)
    targetAudience: "USA, India, UK",
    uploadTimes: ["10:00", "16:00", "22:00"],
    timezone: "America/New_York",
    language: "en",
    enabled: true,
  },
  {
    id: "ch-006",
    name: "GameMaster",
    niche: "gaming",
    categoryId: 20, // Gaming
    targetAudience: "Global",
    uploadTimes: ["10:30", "16:30", "22:30"],
    timezone: "UTC",
    language: "en",
    enabled: true,
  },
  {
    id: "ch-007",
    name: "SportsCentral",
    niche: "sports",
    categoryId: 17, // Sports
    targetAudience: "USA, Europe, India",
    uploadTimes: ["11:00", "17:00", "23:00"],
    timezone: "America/New_York",
    language: "en",
    enabled: true,
  },
  {
    id: "ch-008",
    name: "SpaceExplorers",
    niche: "science-space",
    categoryId: 28, // Science & Technology
    targetAudience: "Global",
    uploadTimes: ["11:30", "17:30", "23:30"],
    timezone: "UTC",
    language: "en",
    enabled: true,
  },
  {
    id: "ch-009",
    name: "TrueCrimeFiles",
    niche: "true-crime-mysteries",
    categoryId: 22, // People & Blogs
    targetAudience: "USA, UK, Canada",
    uploadTimes: ["12:00", "18:00", "00:00"],
    timezone: "America/New_York",
    language: "en",
    enabled: true,
  },
  {
    id: "ch-010",
    name: "LifeHackerPro",
    niche: "productivity-lifehacks",
    categoryId: 22, // People & Blogs
    targetAudience: "Global",
    uploadTimes: ["12:30", "18:30", "00:30"],
    timezone: "UTC",
    language: "en",
    enabled: true,
  },
];

/**
 * Get enabled channels only
 */
export function getEnabledChannels(): ChannelConfig[] {
  return CHANNELS.filter((ch) => ch.enabled);
}

/**
 * Get channel by ID
 */
export function getChannelById(id: string): ChannelConfig | undefined {
  return CHANNELS.find((ch) => ch.id === id);
}
