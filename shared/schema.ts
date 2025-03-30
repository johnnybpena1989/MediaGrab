import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Media Info schema
export const mediaInfo = pgTable("media_info", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail"),
  duration: text("duration"),
  platform: text("platform").notNull(),
  formats: json("formats").notNull()
});

export const insertMediaInfoSchema = createInsertSchema(mediaInfo).pick({
  url: true,
  title: true,
  thumbnail: true,
  duration: true,
  platform: true,
  formats: true
});

export type InsertMediaInfo = z.infer<typeof insertMediaInfoSchema>;
export type MediaInfo = typeof mediaInfo.$inferSelect;

// Zod schemas for API requests and responses
export const urlAnalyzeSchema = z.object({
  url: z.string().url("Please enter a valid URL")
});

export const downloadRequestSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  format: z.string(),
  quality: z.string()
});

export type VideoFormat = {
  formatId: string;
  quality: string;
  resolution?: string;
  filesize: number;
  extension: string;
  type: 'video';
};

export type AudioFormat = {
  formatId: string;
  quality: string;
  bitrate?: string;
  filesize: number;
  extension: string;
  type: 'audio';
};

export type MediaFormat = VideoFormat | AudioFormat;

// Type guard to check if a format is a video format
export function isVideoFormat(format: MediaFormat): format is VideoFormat {
  return format.type === 'video';
}

// Type guard to check if a format is an audio format
export function isAudioFormat(format: MediaFormat): format is AudioFormat {
  return format.type === 'audio';
}
