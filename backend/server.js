import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { readdir, readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Use /tmp for Vercel serverless environment
const isVercel = process.env.VERCEL === '1';
const videosDir = isVercel ? '/tmp/videos' : path.join(__dirname, '../videos');
const metadataFile = path.join(videosDir, 'metadata.json');

// Ensure videos directory exists
if (!existsSync(videosDir)) {
  await mkdir(videosDir, { recursive: true });
}

app.use('/videos', express.static(videosDir));

const storage = multer.diskStorage({
  destination: videosDir,
  filename: async (req, file, cb) => {
    const files = await readdir(videosDir);
    const videoFiles = files.filter(f => f.match(/^video\d+\.(mov|mp4|webm)$/i));
    const nextNum = videoFiles.length + 1;
    const ext = path.extname(file.originalname);
    cb(null, `video${nextNum}${ext}`);
  }
});

const upload = multer({ storage });

async function getMetadata() {
  if (!existsSync(metadataFile)) {
    await writeFile(metadataFile, JSON.stringify({}));
    return {};
  }
  const data = await readFile(metadataFile, 'utf-8');
  return JSON.parse(data);
}

async function saveMetadata(metadata) {
  await writeFile(metadataFile, JSON.stringify(metadata, null, 2));
}

app.get('/api/videos', async (req, res) => {
  try {
    const files = await readdir(videosDir);
    const videoFiles = files.filter(f => f.match(/^video\d+\.(mov|mp4|webm)$/i));
    const metadata = await getMetadata();
    
    const videos = videoFiles.map(file => ({
      filename: file,
      url: `/videos/${file}`,
      description: metadata[file] || ''
    }));
    
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    const { description } = req.body;
    const metadata = await getMetadata();
    metadata[req.file.filename] = description || '';
    await saveMetadata(metadata);
    
    res.json({ 
      filename: req.file.filename,
      url: `/videos/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/videos/:filename', async (req, res) => {
  try {
    const { description } = req.body;
    const metadata = await getMetadata();
    metadata[req.params.filename] = description;
    await saveMetadata(metadata);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/videos/:filename', async (req, res) => {
  try {
    await unlink(path.join(videosDir, req.params.filename));
    const metadata = await getMetadata();
    delete metadata[req.params.filename];
    await saveMetadata(metadata);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Only start server if not in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
