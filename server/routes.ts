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

  app.post(api.jobs.create.path, upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const results = [];
      for (const file of files) {
        const jobData = {
          displayName: req.body.displayName || "Anonymous",
          isColor: req.body.isColor === 'true',
          copies: parseInt(req.body.copies || '1'),
          pageRange: req.body.pageRange || undefined,
          filePath: file.filename,
          originalFilename: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size
        };

        const job = await storage.createJob(jobData);
        results.push(job);
      }
      
      res.status(201).json(results);
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
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    const inline = req.query.inline === 'true';
    if (inline) {
      // PDF can be viewed inline, other types usually download or need browser plugins
      // For office docs, we might just force download as browsers can't native render them
      const isViewable = job.fileType === 'application/pdf' || job.fileType.startsWith('image/') || job.fileType.startsWith('text/');
      
      if (isViewable) {
        res.setHeader('Content-Type', job.fileType);
        res.setHeader('Content-Disposition', 'inline');
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.download(filePath, job.originalFilename);
      }
    } else {
      res.download(filePath, job.originalFilename);
    }
  });

  return httpServer;
}

// Seed initial admin user
export async function seedDatabase() {
  const adminUsers = [
    { username: "admin", password: "password123" },
    { username: "Abhinab", password: "Sukla123" }
  ];

  for (const adminData of adminUsers) {
    const existingUser = await storage.getUserByUsername(adminData.username);
    if (!existingUser) {
      await storage.createUser(adminData);
      console.log(`Seeded user: ${adminData.username}`);
    } else if (existingUser.password !== adminData.password) {
      // Update password if it changed in the seed file
      await db.update(users)
        .set({ password: adminData.password })
        .where(eq(users.id, existingUser.id));
      console.log(`Updated password for user: ${adminData.username}`);
    }
  }
}
