import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

const TEMP_DIR = path.join(os.tmpdir(), "video-processing");
const FFMPEG_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Runs `ffmpeg -c copy -movflags +faststart` on an MP4 file.
 * Returns the path to the optimized output file.
 * Caller must delete both inputPath and the returned outputPath when done.
 */
export async function optimizeMp4FastStart(inputPath: string): Promise<string> {
  // Ensure the temp directory exists (no-op if already present)
  await fs.mkdir(TEMP_DIR, { recursive: true });

  const outputPath = path.join(TEMP_DIR, `${randomUUID()}-out.mp4`);

  // Log file size before processing
  try {
    const stat = await fs.stat(inputPath);
    const sizeMb = (stat.size / (1024 * 1024)).toFixed(1);
    console.log(`[videoOptimizer] Starting faststart optimization — Size: ${sizeMb} MB — input: ${path.basename(inputPath)}`);
  } catch {
    console.log(`[videoOptimizer] Starting faststart optimization — input: ${path.basename(inputPath)}`);
  }

  const startTime = Date.now();

  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", inputPath,
      "-c", "copy",
      "-movflags", "+faststart",
      "-y",          // overwrite output without prompting
      outputPath,
    ]);

    // Kill FFmpeg if it takes longer than the timeout
    const timer = setTimeout(() => {
      ffmpeg.kill("SIGKILL");
      reject(new Error("[videoOptimizer] FFmpeg timed out after 2 minutes"));
    }, FFMPEG_TIMEOUT_MS);

    let stderrOutput = "";
    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      stderrOutput += chunk.toString();
    });

    ffmpeg.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[videoOptimizer] Faststart optimization finished (${elapsed}s)`);
        resolve();
      } else {
        console.error(`[videoOptimizer] FFmpeg exited with code ${code}:\n${stderrOutput}`);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`[videoOptimizer] Failed to spawn FFmpeg: ${err.message}`));
    });
  });

  return outputPath;
}

/** Safely delete a file, swallowing any errors (e.g. already deleted). */
export async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore
  }
}
