# Video Gallery App

Modern video gallery with random distribution layout and admin panel for uploading and managing videos.

© Julian Sanchez LLC. All rights reserved.

## Features

- Random masonry layout with varied video sizes
- Auto-playing videos (muted)
- Touch/click to unmute and bring video forward
- Responsive design for mobile and desktop
- Upload videos with descriptions
- Edit descriptions after upload
- Delete videos
- Automatic video numbering (video1.mov, video2.mov, etc.)
- Modern dark theme with smooth animations

## Local Development

```bash
npm install
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Usage

1. Visit http://localhost:3000 to view the gallery
2. Visit http://localhost:3000/admin to upload videos
3. Videos are stored in the `videos/` folder
4. Supports 4K videos

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions to Vercel and GitHub.

Quick steps:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

Then deploy to Vercel by importing your GitHub repository.
