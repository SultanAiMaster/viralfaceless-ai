/**
 * Scheduler - Manages daily video generation & upload schedule
 * 30 videos daily (3 per channel × 10 channels)
 */

import { Queue } from "bullmq";
import { getEnabledChannels, ChannelConfig } from "../config/channels";
import { logger } from "../utils/logger";
import cron from "node-cron";

export const RESEARCH_TIME = "08:00"; // Daily research
export const GENERATION_TIME = "09:00"; // Start content generation
export const UPLOAD_WINDOW_START = "12:00"; // Start uploads

/**
 * Initialize daily scheduler
 */
export async function initializeScheduler() {
  const channels = getEnabledChannels();

  // Daily research task - 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    logger.info("📊 Running daily research task...");
    await scheduleResearchForAllChannels(channels);
  });

  // Daily generation task - 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    logger.info("🎬 Starting content generation...");
    await scheduleContentGeneration(channels);
  });

  // Upload scheduling - 12:00 PM to 12:00 AM
  cron.schedule("0 12 * * *", async () => {
    logger.info("📤 Scheduling uploads...");
    await scheduleDailyUploads(channels);
  });

  logger.info("⏰ Scheduler tasks registered:");
  logger.info(`   - Research: ${RESEARCH_TIME}`);
  logger.info(`   - Generation: ${GENERATION_TIME}`);
  logger.info(`   - Upload window: ${UPLOAD_WINDOW_START} - 00:00`);
}

/**
 * Schedule research for all channels
 */
async function scheduleResearchForAllChannels(channels: ChannelConfig[]) {
  const { researchQueue } = await import("./../../app");

  for (const channel of channels) {
    await researchQueue.add(
      `research-${channel.id}`,
      { channelId: channel.id, niche: channel.niche },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
      }
    );
    logger.info(`📝 Research job added for ${channel.name} (${channel.niche})`);
  }
}

/**
 * Schedule content generation for all channels
 */
async function scheduleContentGeneration(channels: ChannelConfig[]) {
  const { contentQueue } = await import("./../../app");

  for (const channel of channels) {
    // Generate 3 videos per channel
    for (let i = 1; i <= 3; i++) {
      await contentQueue.add(
        `generate-${channel.id}-${i}`,
        {
          channelId: channel.id,
          niche: channel.niche,
          videoIndex: i,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: false,
          removeOnFail: false,
        }
      );
    }
    logger.info(`🎬 3 generation jobs added for ${channel.name}`);
  }

  logger.info(`📊 Total: ${channels.length * 3} videos scheduled for generation`);
}

/**
 * Schedule uploads based on channel upload times
 */
async function scheduleDailyUploads(channels: ChannelConfig[]) {
  const { uploadQueue } = await import("./../../app");

  const now = new Date();
  let totalUploads = 0;

  for (const channel of channels) {
    for (const uploadTime of channel.uploadTimes) {
      // Calculate delay until upload time
      const [hours, minutes] = uploadTime.split(":").map(Number);
      const uploadDate = new Date(now);
      uploadDate.setHours(hours, minutes, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (uploadDate <= now) {
        uploadDate.setDate(uploadDate.getDate() + 1);
      }

      const delayMs = uploadDate.getTime() - now.getTime();

      await uploadQueue.add(
        `upload-${channel.id}-${Date.now()}`,
        {
          channelId: channel.id,
          scheduledTime: uploadDate.toISOString(),
        },
        {
          delay: delayMs,
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: false,
          removeOnFail: false,
        }
      );

      totalUploads++;
      logger.info(
        `📤 ${channel.name} upload scheduled for ${uploadDate.toLocaleString()}`
      );
    }
  }

  logger.info(`📅 Total uploads scheduled: ${totalUploads} (3 per channel)`);
}
