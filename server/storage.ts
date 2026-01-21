import { db } from "./db";
import {
  printJobs,
  users,
  type InsertPrintJob,
  type PrintJob,
  type InsertUser,
  type User
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Jobs
  getJobs(): Promise<PrintJob[]>;
  getJob(id: number): Promise<PrintJob | undefined>;
  createJob(job: InsertPrintJob & { 
    filePath: string; 
    originalFilename: string; 
    fileType: string; 
    fileSize: number; 
  }): Promise<PrintJob>;
  updateJobStatus(id: number, status: string): Promise<PrintJob | undefined>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getJobs(): Promise<PrintJob[]> {
    return await db.select().from(printJobs).orderBy(desc(printJobs.createdAt));
  }

  async getJob(id: number): Promise<PrintJob | undefined> {
    const [job] = await db.select().from(printJobs).where(eq(printJobs.id, id));
    return job;
  }

  async createJob(job: InsertPrintJob & { 
    filePath: string; 
    originalFilename: string; 
    fileType: string; 
    fileSize: number; 
  }): Promise<PrintJob> {
    const [newJob] = await db.insert(printJobs).values(job).returning();
    return newJob;
  }

  async updateJobStatus(id: number, status: "PENDING" | "PRINTING" | "COMPLETED"): Promise<PrintJob | undefined> {
    const [updated] = await db
      .update(printJobs)
      .set({ status })
      .where(eq(printJobs.id, id))
      .returning();
    return updated;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
}

export const storage = new DatabaseStorage();
