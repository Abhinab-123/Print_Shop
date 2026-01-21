import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Admin users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Print jobs
export const printJobs = pgTable("print_jobs", {
  id: serial("id").primaryKey(),
  displayName: text("display_name").notNull(), // Mandatory user alias
  filePath: text("file_path").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  isColor: boolean("is_color").default(false).notNull(),
  copies: integer("copies").default(1).notNull(),
  pageRange: text("page_range"), // Optional "1-5, 8"
  status: text("status", { enum: ["PENDING", "PRINTING", "COMPLETED"] }).default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users);
export const insertPrintJobSchema = createInsertSchema(printJobs).omit({ 
  id: true, 
  createdAt: true, 
  status: true,
  filePath: true, // Handle file path on backend after upload
  fileSize: true, // Handle file size on backend
  fileType: true, // Handle file type on backend
  originalFilename: true // Handle filename on backend
});

// === EXPLICIT API TYPES ===

export type User = typeof users.$inferSelect;
export type PrintJob = typeof printJobs.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPrintJob = z.infer<typeof insertPrintJobSchema>;

// Request types
export type CreateJobRequest = InsertPrintJob; // FormData will be used actually, but this validation applies to fields
export type UpdateJobStatusRequest = { status: "PENDING" | "PRINTING" | "COMPLETED" };

// Response types
export type PrintJobResponse = PrintJob;
