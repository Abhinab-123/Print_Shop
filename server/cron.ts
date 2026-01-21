import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { log } from "./index";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes
const MAX_FILE_AGE_MS = 60 * 60 * 1000; // 1 hour

export function startCleanupJob() {
  log("Starting cleanup job...");
  
  setInterval(async () => {
    try {
      log("Running cleanup task...");
      const jobs = await storage.getJobs();
      const now = Date.now();
      
      let deletedCount = 0;

      for (const job of jobs) {
        const age = now - new Date(job.createdAt).getTime();
        const shouldDelete = (job.status === "COMPLETED") || (age > MAX_FILE_AGE_MS);

        if (shouldDelete && job.filePath) {
          const filePath = path.join(UPLOAD_DIR, job.filePath);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deletedCount++;
            
            // Optionally update job status to EXPIRED if it wasn't completed
            if (job.status !== "COMPLETED") {
               // We could add an EXPIRED status, but for now just leave it or mark as completed/deleted
               // The requirement says "Files are temporary", doesn't explicitly say DB records are deleted.
               // But usually "privacy-first" implies data deletion too.
               // For this MVP, let's just delete the file.
            }
          }
        }
      }
      
      if (deletedCount > 0) {
        log(`Cleanup: Deleted ${deletedCount} files.`);
      }
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  }, CLEANUP_INTERVAL_MS);
}
