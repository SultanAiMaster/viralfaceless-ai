/**
 * Upload Module - Automates YouTube video uploads
 * Handles 10 channels, 30 videos daily
 */

import { google, youtube_v3 } from "googleapis";
import { GeneratedContent } from "../generator/content";
import { ChannelConfig, getChannelById } from "../config/channels";
import { logger } from "../utils/logger";

export interface UploadResult {
  videoId: string;
  channelId: string;
  title: string;
  uploadTime: Date;
  status: "success" | "failed";
  error?: string;
}

export class UploadModule {
  private youtube: youtube_v3.Youtube;

  constructor() {
    this.youtube = google.youtube({
      version: "v3",
      auth: this.getAuth(),
    });
  }

  /**
   * Get OAuth2 client for YouTube API
   */
  private getAuth() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
    });

    return oauth2Client;
  }

  /**
   * Upload video to specific channel
   */
  async uploadVideo(
    channelId: string,
    content: GeneratedContent
  ): Promise<UploadResult> {
    const channel = getChannelById(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    logger.info(`📤 Uploading video to ${channel.name}: ${content.title}`);

    try {
      // Step 1: Upload video to YouTube
      const videoData = await this.youtube.videos.insert(
        {
          part: ["snippet", "status"],
          requestBody: {
            snippet: {
              title: content.title,
              description: content.description,
              tags: content.tags,
              categoryId: channel.categoryId,
              defaultLanguage: channel.language,
            },
            status: {
              privacyStatus: "public",
              selfDeclaredMadeForKids: false,
            },
          },
          media: {
            body: this.createVideoStream(content.videoUrl),
          },
        },
        {
          onUploadProgress: (evt) => {
            const progress = (evt.bytesRead / evt.totalBytes) * 100;
            logger.debug(`Upload progress: ${progress.toFixed(2)}%`);
          },
        }
      );

      const videoId = videoData.data.id;
      logger.info(`✅ Video uploaded: https://youtube.com/watch?v=${videoId}`);

      // Step 2: Upload thumbnail
      if (content.thumbnailUrl) {
        await this.uploadThumbnail(videoId!, content.thumbnailUrl);
        logger.info(`🖼️ Thumbnail uploaded for video ${videoId}`);
      }

      return {
        videoId: videoId!,
        channelId,
        title: content.title,
        uploadTime: new Date(),
        status: "success",
      };
    } catch (error: any) {
      logger.error(`❌ Upload failed for ${channel.name}:`, error.message);

      return {
        videoId: "",
        channelId,
        title: content.title,
        uploadTime: new Date(),
        status: "failed",
        error: error.message,
      };
    }
  }

  /**
   * Upload thumbnail for video
   */
  private async uploadThumbnail(videoId: string, thumbnailPath: string) {
    // Read thumbnail file
    const fs = await import("fs/promises");
    const thumbnailBuffer = await fs.readFile(thumbnailPath);

    await this.youtube.thumbnails.set({
      videoId,
      media: {
        mimeType: "image/jpeg",
        body: thumbnailBuffer,
      },
    });
  }

  /**
   * Create video stream from file
   */
  private createVideoStream(videoPath: string) {
    const fs = require("fs");
    return fs.createReadStream(videoPath);
  }

  /**
   * Get video statistics
   */
  async getVideoStats(videoId: string) {
    const response = await this.youtube.videos.list({
      part: ["statistics"],
      id: [videoId],
    });

    return response.data.items?.[0].statistics;
  }

  /**
   * Get channel statistics
   */
  async getChannelStats(channelId: string) {
    const response = await this.youtube.channels.list({
      part: ["statistics"],
      id: [channelId],
    });

    return response.data.items?.[0].statistics;
  }

  /**
   * Batch upload videos for multiple channels
   */
  async uploadBatch(uploads: Array<{ channelId: string; content: GeneratedContent }>) {
    const results: UploadResult[] = [];

    for (const upload of uploads) {
      const result = await this.uploadVideo(upload.channelId, upload.content);
      results.push(result);

      // Small delay between uploads to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    logger.info(`📊 Batch upload complete: ${results.length} videos`);
    return results;
  }

  /**
   * Schedule video for specific time
   */
  async scheduleVideo(
    channelId: string,
    content: GeneratedContent,
    publishAt: Date
  ): Promise<UploadResult> {
    const channel = getChannelById(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    logger.info(`⏰ Scheduling video for ${publishAt.toISOString()}`);

    try {
      const videoData = await this.youtube.videos.insert(
        {
          part: ["snippet", "status"],
          requestBody: {
            snippet: {
              title: content.title,
              description: content.description,
              tags: content.tags,
              categoryId: channel.categoryId,
              defaultLanguage: channel.language,
            },
            status: {
              privacyStatus: "private", // Start as private
              selfDeclaredMadeForKids: false,
              publishAt: publishAt.toISOString(),
            },
          },
          media: {
            body: this.createVideoStream(content.videoUrl),
          },
        }
      );

      const videoId = videoData.data.id;
      logger.info(`⏰ Video scheduled: ${videoId}`);

      return {
        videoId: videoId!,
        channelId,
        title: content.title,
        uploadTime: publishAt,
        status: "success",
      };
    } catch (error: any) {
      logger.error(`❌ Schedule failed:`, error.message);

      return {
        videoId: "",
        channelId,
        title: content.title,
        uploadTime: publishAt,
        status: "failed",
        error: error.message,
      };
    }
  }
}
