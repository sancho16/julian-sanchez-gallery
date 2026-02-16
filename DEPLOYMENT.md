# Deployment Guide

## Deploy to Vercel

### Step 1: Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: Video gallery app"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., "video-gallery")
3. Don't initialize with README (we already have files)

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/video-gallery.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
6. Click "Deploy"

### Step 5: Environment Setup

Note: Vercel's serverless functions have limitations:
- File uploads are stored in `/tmp` (temporary, cleared after function execution)
- For production, you'll need to integrate cloud storage (AWS S3, Cloudinary, etc.)

### Alternative: Deploy Backend Separately

For a more robust solution:

1. Deploy backend to a service like Railway, Render, or Fly.io
2. Update frontend API calls to point to your backend URL
3. Deploy frontend to Vercel as a static site

## Local Development

```bash
npm install
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Important Notes

- Videos uploaded on Vercel will be temporary (serverless limitation)
- For production, integrate cloud storage for persistent video storage
- The current setup works great for testing and demo purposes
