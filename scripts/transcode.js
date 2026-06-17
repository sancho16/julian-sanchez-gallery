/**
 * Transcodes all .mov files in /videos to streaming-optimized .mp4
 * - Moves moov atom to front (faststart) so playback starts immediately
 * - Scales to 1080p max (preserves 4K quality while reducing file size)
 * - Generates thumbnail .jpg for each video
 * 
 * Run: node scripts/transcode.js
 */

import { execSync, spawn } from 'child_process';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videosDir = path.join(__dirname, '../videos');

const files = await readdir(videosDir);
const movFiles = files.filter(f => f.match(/^video\d+\.mov$/i));

if (movFiles.length === 0) {
  console.log('No .mov files found to transcode.');
  process.exit(0);
}

console.log(`Found ${movFiles.length} .mov files to transcode...\n`);

for (const file of movFiles) {
  const input    = path.join(videosDir, file);
  const baseName = path.basename(file, '.mov');
  const output   = path.join(videosDir, `${baseName}.mp4`);
  const thumb    = path.join(videosDir, `${baseName}_thumb.jpg`);

  // Skip if already transcoded
  if (existsSync(output)) {
    const inStat  = await stat(input);
    const outStat = await stat(output);
    if (outStat.mtimeMs > inStat.mtimeMs) {
      console.log(`✓ ${baseName}.mp4 already exists, skipping.`);
      continue;
    }
  }

  const fileStat = await stat(input);
  const sizeMB   = (fileStat.size / 1024 / 1024).toFixed(0);
  console.log(`⟳ Transcoding ${file} (${sizeMB}MB)...`);

  try {
    // Transcode: H.264, AAC audio, 1080p max, faststart moov atom
    execSync(
      `ffmpeg -i "${input}" \
        -c:v libx264 \
        -preset fast \
        -crf 23 \
        -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
        -c:a aac \
        -b:a 128k \
        -movflags +faststart \
        -y "${output}"`,
      { stdio: 'inherit' }
    );

    // Generate thumbnail at 1 second
    execSync(
      `ffmpeg -i "${input}" -ss 00:00:01 -vframes 1 -q:v 2 -y "${thumb}"`,
      { stdio: 'pipe' }
    );

    const outStat = await stat(output);
    const outMB   = (outStat.size / 1024 / 1024).toFixed(0);
    console.log(`✅ ${baseName}.mp4 done (${outMB}MB)\n`);
  } catch (err) {
    console.error(`❌ Failed to transcode ${file}:`, err.message);
  }
}

console.log('\nAll done! Update your videos folder and restart the server.');
