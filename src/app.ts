/**
 * ViralFaceless AI - Main Application
 * 10 Channels, 30 Videos Daily, 24/7 Automation
 */

import express from "express";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { getEnabledChannels } from "./config/channels";
import { logger } from "./utils/logger";
import { initializeScheduler } from "./queue/scheduler";
import { ResearchModule } from "./research/research";
import { ContentGenerator } from "./generator/content";
import { UploadModule } from "./uploader/uploader";

const app = express();
const PORT = process.env.PORT || 3000;

// Redis connection for BullMQ
const redis = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
});

// Queues
export const researchQueue = new Queue("research", { connection: redis });
export const contentQueue = new Queue("content-generation", { connection: redis });
export const uploadQueue = new Queue("upload", { connection: redis });

// Initialize modules
const researchModule = new ResearchModule();
const contentGenerator = new ContentGenerator();
const uploadModule = new UploadModule();

/**
 * Main Application Entry Point
 */
async function main() {
  logger.info("🚀 Starting ViralFaceless AI System...");
  logger.info(`📊 Managing ${getEnabledChannels().length} channels`);
  logger.info(`🎯 Target: 30 videos daily (3 per channel)`);

  // Initialize scheduler
  await initializeScheduler();
  logger.info("⏰ Scheduler initialized");

  // Express routes
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      channels: getEnabledChannels().length,
      uptime: process.uptime(),
    });
  });

  app.get("/stats", async (req, res) => {
    const stats = {
      channels: getEnabledChannels().length,
      queues: {
        research: await researchQueue.getJobCounts(),
        content: await contentQueue.getJobCounts(),
        upload: await uploadQueue.getJobCounts(),
      },
    };
    res.json(stats);
  });

  app.get("/channels", (req, res) => {
    res.json(getEnabledChannels());
  });

  // Start server
  app.listen(PORT, () => {
    logger.info(`🖥️ Server running on http://localhost:${PORT}`);
    logger.info(`✅ System operational - 24/7 automation active`);
  });
}

/**
 * Graceful shutdown
 */
process.on("SIGTERM", async () => {
  logger.info("🛑 Shutting down gracefully...");
  await redis.quit();
  process.exit(0);
});

main().catch((error) => {
  logger.error("❌ Fatal error:", error);
  process.exit(1);
});
