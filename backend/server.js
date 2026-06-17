import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { readdir, readFile, writeFile, unlink, mkdir, stat } from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const isVercel  = process.env.VERCEL === '1';
const videosDir = isVercel ? '/tmp/videos' : path.join(__dirname, '../videos');
const metadataFile = path.join(videosDir, 'metadata.json');

if (!existsSync(videosDir)) await mkdir(videosDir, { recursive: true });

const MIME = {
  '.mov':  'video/mp4',
  '.mp4':  'video/mp4',
  '.m4v':  'video/mp4',
  '.webm': 'video/webm',
};

// ── Serve thumbnails as static ────────────────────────────────
app.use('/thumbs', express.static(videosDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jpg')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// ── Video streaming with HTTP 206 range support ───────────────
app.get('/videos/:filename', async (req, res) => {
  const filePath = path.join(videosDir, req.params.filename);
  if (!existsSync(filePath)) return res.status(404).send('Not found');

  const ext    = path.extname(req.params.filename).toLowerCase();
  const mime   = MIME[ext] || 'video/mp4';
  const CHUNK  = 10 * 1024 * 1024; // 10MB chunks

  try {
    const { size } = await stat(filePath);
    const rangeHeader = req.headers.range;

    let start = 0;
    let end   = Math.min(CHUNK, size - 1);

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      start = parseInt(parts[0], 10);
      end   = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK, size - 1);
    }

    start = Math.max(0, Math.min(start, size - 1));
    end   = Math.max(start, Math.min(end, size - 1));

    res.writeHead(206, {
      'Content-Type':   mime,
      'Content-Range':  `bytes ${start}-${end}/${size}`,
      'Content-Length': end - start + 1,
      'Accept-Ranges':  'bytes',
      'Cache-Control':  'public, max-age=3600',
    });

    createReadStream(filePath, { start, end }).pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ── Multer ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: videosDir,
  filename: async (req, file, cb) => {
    const files      = await readdir(videosDir);
    const videoFiles = files.filter(f => f.match(/^video\d+\.(mov|mp4|webm|m4v)$/i));
    const nextNum    = videoFiles.length + 1;
    cb(null, `video${nextNum}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// ── Metadata ──────────────────────────────────────────────────
async function getMetadata() {
  if (!existsSync(metadataFile)) { await writeFile(metadataFile, '{}'); return {}; }
  return JSON.parse(await readFile(metadataFile, 'utf-8'));
}
async function saveMetadata(meta) {
  await writeFile(metadataFile, JSON.stringify(meta, null, 2));
}

// ── API ───────────────────────────────────────────────────────
app.get('/api/videos', async (req, res) => {
  try {
    const files      = await readdir(videosDir);
    const metadata   = await getMetadata();
    const host       = req.headers.host || `localhost:${PORT}`;
    const protocol   = req.headers['x-forwarded-proto'] || 'http';
    const base       = `${protocol}://${host}`;

    // Prefer .mp4 over .mov if both exist (transcoded version)
    const seen       = new Set();
    const videoFiles = files
      .filter(f => f.match(/^video\d+\.(mov|mp4|webm|m4v)$/i))
      .sort((a, b) => {
        const na = parseInt(a.match(/\d+/)[0]);
        const nb = parseInt(b.match(/\d+/)[0]);
        if (na !== nb) return na - nb;
        // prefer .mp4 over .mov for same number
        return a.endsWith('.mp4') ? -1 : 1;
      })
      .filter(f => {
        const num = f.match(/\d+/)[0];
        if (seen.has(num)) return false;
        seen.add(num);
        return true;
      });

    const thumbFiles = new Set(files.filter(f => f.endsWith('_thumb.jpg')));

    res.json(videoFiles.map(file => {
      const base_name = path.basename(file, path.extname(file));
      const thumbFile = `${base_name}_thumb.jpg`;
      return {
        filename:    file,
        url:         `${base}/videos/${file}`,
        thumbnail:   thumbFiles.has(thumbFile) ? `${base}/thumbs/${thumbFile}` : null,
        description: metadata[file] || metadata[base_name + '.mov'] || '',
      };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    const metadata = await getMetadata();
    metadata[req.file.filename] = req.body.description || '';
    await saveMetadata(metadata);
    res.json({ filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/videos/:filename', async (req, res) => {
  try {
    const metadata = await getMetadata();
    metadata[req.params.filename] = req.body.description;
    await saveMetadata(metadata);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/videos/:filename', async (req, res) => {
  try {
    await unlink(path.join(videosDir, req.params.filename));
    const metadata = await getMetadata();
    delete metadata[req.params.filename];
    await saveMetadata(metadata);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
}

export default app;
