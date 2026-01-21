import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { setupAuth } from "./auth";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file storage
const storageConfig = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storageConfig,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    // Check mime type or extension
    // Simple check for now
    cb(null, true);
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up authentication first
  setupAuth(app);

  // Serve uploaded files securely (admin only ideally, or via signed URLs, but for this MVP we use an endpoint)
  // We won't statically serve uploads/ to public to prevent listing.

  // --- Public Routes ---

  app.post(api.jobs.create.path, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Multer processes the file, other fields are in req.body
      // We need to parse fields manually or use schema to validate after
      
      const jobData = {
        displayName: req.body.displayName || undefined,
        isColor: req.body.isColor === 'true',
        copies: parseInt(req.body.copies || '1'),
        pageRange: req.body.pageRange || undefined,
        filePath: req.file.filename, // Store filename, not full path
        originalFilename: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      };

      const job = await storage.createJob(jobData);
      res.status(201).json(job);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.jobs.get.path, async (req, res) => {
    const job = await storage.getJob(Number(req.params.id));
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    // Public can see minimal info (confirmation page)
    res.json(job);
  });

  // --- Admin Routes ---

  app.get(api.jobs.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.patch(api.jobs.updateStatus.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { status } = req.body;
    const updated = await storage.updateJobStatus(Number(req.params.id), status);
    
    if (!updated) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(updated);
  });

  app.get(api.jobs.download.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const job = await storage.getJob(Number(req.params.id));
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const filePath = path.join(uploadDir, job.filePath);
    res.download(filePath, job.originalFilename);
  });

  return httpServer;
}

// Seed initial admin user
export async function seedDatabase() {
  const existingAdmin = await storage.getUserByUsername("admin");
  if (!existingAdmin) {
    // For MVP, simple hardcoded password. In prod, use bcrypt hash.
    // NOTE: In the auth.ts file we'll implement simple hashing or comparison.
    await storage.createUser({
      username: "admin",
      password: "password123" // Change this!
    });
  }
}
