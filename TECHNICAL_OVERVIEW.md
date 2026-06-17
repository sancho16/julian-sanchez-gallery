# Julian Sanchez Video Gallery — Technical Overview

**Project:** Personal video showcase app  
**Platforms:** Web browser + iOS + Android  
**Author reference document**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture — How the Pieces Fit Together](#2-architecture)
3. [Technologies Used](#3-technologies-used)
4. [The Backend — Node.js + Express](#4-the-backend)
5. [The Web Frontend — React + Vite](#5-the-web-frontend)
6. [The Mobile App — React Native + Expo](#6-the-mobile-app)
7. [Video Streaming — How It Works](#7-video-streaming)
8. [Key Concepts Explained](#8-key-concepts-explained)
9. [File Structure](#9-file-structure)
10. [How to Run the Project](#10-how-to-run-the-project)
11. [Glossary](#11-glossary)

---

## 1. Project Overview

This project is a **video gallery application** that runs on two platforms simultaneously:

- **Web** — a browser-based gallery accessible at `http://localhost:3000`
- **Mobile** — a native iOS and Android app testable via Expo Go

The app displays your drone videos in a modern bento-grid layout. Videos autoplay silently and unmute when tapped. A fullscreen mode lets you watch any video with navigation between clips.

An **admin panel** at `/admin` lets you upload new videos, add descriptions, and delete videos — all without touching code.

---

## 2. Architecture

The project is split into three parts that communicate with each other:

```
┌─────────────────────────────────────────────────────┐
│                    YOUR MAC                         │
│                                                     │
│  ┌──────────────┐      ┌──────────────────────────┐ │
│  │   Backend    │      │   Frontend (Web)         │ │
│  │  Node.js +   │◄────►│   React + Vite           │ │
│  │  Express     │      │   localhost:3000         │ │
│  │  :3001       │      └──────────────────────────┘ │
│  │              │                                   │
│  │  /videos/    │                                   │
│  │  folder      │                                   │
│  └──────┬───────┘                                   │
│         │                                           │
└─────────┼───────────────────────────────────────────┘
          │ HTTP over WiFi/Hotspot
          │
   ┌──────▼───────┐
   │  iPhone /    │
   │  Android     │
   │  Expo Go     │
   │  React Native│
   └──────────────┘
```

**How they connect:**
- The backend serves video files and a JSON API
- The web frontend fetches from the backend via a proxy (same machine)
- The mobile app fetches from the backend using the Mac's IP address over the local network

---

## 3. Technologies Used

### JavaScript / Node.js
JavaScript is the programming language used for **everything** in this project — backend, web frontend, and mobile app. This is one of the biggest advantages of the JavaScript ecosystem: one language, all platforms.

**Node.js** is a runtime that lets JavaScript run on a server (your Mac) instead of just in a browser. Think of it as the engine that powers the backend.

### Express.js
A minimal web framework for Node.js. It handles incoming HTTP requests and sends responses. We use it to:
- Serve video files with proper streaming headers
- Expose a REST API (`/api/videos`, `/api/upload`, etc.)

### React
A JavaScript library for building user interfaces. Created by Meta (Facebook). React lets you build UIs as **components** — reusable pieces of code that manage their own state and appearance.

Example: `<VideoCard />` is a React component that knows how to display one video, handle taps, and animate itself.

### Vite
A modern build tool and development server for web apps. It:
- Serves your React app during development with instant hot-reload
- Bundles everything into optimized files for production
- Proxies API requests from port 3000 to the backend on port 3001

### React Native
A framework by Meta that lets you write mobile apps using React and JavaScript, but renders **real native UI components** — not a web view. This means the app feels and performs like a true iOS/Android app.

### Expo
A platform built on top of React Native that simplifies mobile development. Without Expo, you'd need Xcode and Android Studio fully configured. With Expo:
- You can run the app on a real device instantly via **Expo Go**
- It manages native dependencies for you
- `expo-av` provides the video player component

### expo-av
The Expo audio/video library. It wraps iOS's `AVPlayer` and Android's `ExoPlayer` — the same native video engines used by apps like Netflix and YouTube.

### expo-linear-gradient
Provides gradient overlays on the video cards (the dark fade at the bottom of each card that makes text readable).

### @expo/vector-icons
A library of icon fonts (we use Ionicons). Provides icons like the play button, expand arrow, chevrons, etc.

### Multer
A Node.js middleware for handling file uploads. When you upload a video through the admin panel, Multer receives the file, names it (`video1.mov`, `video2.mov`, etc.), and saves it to the `videos/` folder.

### concurrently
A utility that runs multiple terminal commands at the same time. We use it so `npm run dev` starts both the backend and frontend with a single command.

---

## 4. The Backend

**File:** `backend/server.js`

The backend is the heart of the application. It runs on your Mac and does three things:

### 4.1 Video Streaming

This is the most technically important part. Video streaming is **not** the same as downloading a file. Mobile video players (iOS AVPlayer, Android ExoPlayer) use **HTTP Range Requests** to:

1. First fetch just the video metadata (at the end of the file) to know duration, dimensions, codec
2. Then fetch chunks of video data as the user watches
3. Skip ahead by requesting a different byte range

Our server handles this with a custom route:

```javascript
app.get('/videos/:filename', async (req, res) => {
  const { size } = await stat(filePath);
  const rangeHeader = req.headers.range;  // e.g. "bytes=0-10485760"

  let start = 0;
  let end = Math.min(CHUNK, size - 1);  // Default: first 10MB

  if (rangeHeader) {
    // Parse what the player is asking for
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    start = parseInt(parts[0], 10);
    end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK, size - 1);
  }

  // Respond with 206 Partial Content (not 200 OK)
  res.writeHead(206, {
    'Content-Type': 'video/mp4',
    'Content-Range': `bytes ${start}-${end}/${size}`,
    'Content-Length': end - start + 1,
    'Accept-Ranges': 'bytes',
  });

  // Stream only the requested bytes
  createReadStream(filePath, { start, end }).pipe(res);
});
```

**Why 206 and not 200?**  
HTTP status `200 OK` means "here is the whole file." For a 1.9GB video, the phone would need to download the entire file before playing. HTTP status `206 Partial Content` means "here is the piece you asked for." The player can start playing immediately while fetching more in the background.

**Why serve `.mov` as `video/mp4`?**  
`.mov` is Apple's QuickTime container format. The video data inside is often H.264 — the same codec used in `.mp4`. By telling the browser/phone the MIME type is `video/mp4`, the native player knows how to decode it without needing a special codec.

### 4.2 The REST API

REST (Representational State Transfer) is a convention for designing web APIs using standard HTTP methods:

| Method | Route | What it does |
|--------|-------|--------------|
| GET | `/api/videos` | Returns list of all videos as JSON |
| POST | `/api/upload` | Accepts a new video file upload |
| PUT | `/api/videos/:filename` | Updates a video's description |
| DELETE | `/api/videos/:filename` | Deletes a video |

### 4.3 Metadata Storage

Video descriptions are stored in a simple JSON file (`videos/metadata.json`):

```json
{
  "video1.mov": "Aerial shot over Miami Beach",
  "video2.mov": "Sunset flyover downtown"
}
```

This is intentionally simple — no database needed for a personal gallery.

---

## 5. The Web Frontend

**Files:** `frontend/src/`

### 5.1 React Components

The web app is built from three main components:

**`Gallery.jsx`** — The main gallery page
- Fetches the video list from `/api/videos` on load
- Assigns random sizes to each video (small, medium, large, portrait)
- Renders a bento grid using CSS Grid
- Manages which video is "active" (unmuted)

**`Admin.jsx`** — The upload and management page
- A form to select a video file and add a description
- Lists all current videos with editable descriptions
- Delete buttons for each video

**`main.jsx`** — The app entry point
- Sets up React Router for navigation between Gallery and Admin
- Renders the navigation bar

### 5.2 React Hooks Used

**`useState`** — Stores data that can change and triggers re-renders when it does.
```javascript
const [videos, setVideos] = useState([]);  // starts empty, fills after API call
const [activeVideo, setActiveVideo] = useState(null);  // which video is unmuted
```

**`useEffect`** — Runs code in response to events (component mounting, state changes).
```javascript
useEffect(() => {
  fetch('/api/videos').then(r => r.json()).then(setVideos);
}, []);  // Empty array = run once when component first appears
```

**`useRef`** — Holds a reference to a DOM element or value that persists without causing re-renders.
```javascript
const videoRefs = useRef({});  // Direct access to <video> elements
videoRefs.current[filename].muted = false;  // Unmute without re-rendering
```

**`useCallback`** — Memoizes a function so it isn't recreated on every render. Important for performance when passing functions to child components.

### 5.3 CSS Grid — The Bento Layout

The gallery uses CSS Grid with variable column and row spans:

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);  /* 4 equal columns */
  grid-auto-rows: 28vw;                   /* Row height = 28% of viewport width */
  gap: 6px;
}

.bento-cell {
  grid-column: span var(--cols);  /* CSS variable set per card */
  grid-row: span var(--rows);
}
```

A card with `--cols: 2` and `--rows: 2` takes up a 2×2 block in the grid, making it appear larger than a 1×1 card.

### 5.4 CSS Animations

```css
@keyframes cellIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.bento-cell {
  animation: cellIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--index) * 80ms);  /* Staggered entrance */
}
```

`cubic-bezier(0.34, 1.56, 0.64, 1)` is a spring-like easing curve — it overshoots slightly then settles, giving a bouncy feel.

---

## 6. The Mobile App

**Files:** `mobile/`

### 6.1 React Native vs React

React Native uses the same concepts as React (components, hooks, state) but different building blocks:

| Web (React) | Mobile (React Native) |
|-------------|----------------------|
| `<div>` | `<View>` |
| `<p>`, `<span>` | `<Text>` |
| `<img>` | `<Image>` |
| CSS stylesheets | `StyleSheet.create({})` |
| `onClick` | `onPress` |
| `position: absolute` | `position: 'absolute'` |

### 6.2 The Animated API

React Native has a built-in `Animated` library for smooth, performant animations. There are two "drivers":

**Native Driver (`useNativeDriver: true`)**  
Runs the animation on the UI thread (the thread that draws the screen). This is the fastest option. Only works for transform and opacity properties.

```javascript
Animated.spring(scaleAnim, {
  toValue: isActive ? 1.04 : 1,
  useNativeDriver: true,  // Runs on UI thread — 60fps guaranteed
  tension: 140,
  friction: 8,
}).start();
```

**JS Driver (`useNativeDriver: false`)**  
Runs on the JavaScript thread. Slower but supports any property (like colors). We use this for border color changes.

**Important rule:** You cannot mix native and JS drivers on the same `Animated.Value`. This was the bug we fixed — the original code tried to animate both `transform` (native) and `borderColor` (JS) with the same value, causing a crash.

**The fix:** Use separate `Animated.Value` instances — one for scale (native driver), one for color (JS driver).

### 6.3 FlatList

`FlatList` is React Native's high-performance scrollable list. Unlike rendering all items at once, FlatList only renders items currently visible on screen, plus a small buffer. This is critical for performance with video content.

```javascript
<FlatList
  data={videos}
  renderItem={({ item }) => <VideoCard item={item} />}
  numColumns={2}           // Two-column grid
  removeClippedSubviews    // Unmount off-screen items on Android
/>
```

### 6.4 The Fullscreen Modal

```javascript
<Modal visible={fsIndex !== null} transparent animationType="none" statusBarTranslucent>
  {/* Custom animated entrance instead of default Modal animation */}
  <Animated.View style={{ opacity: fadeAnim }}>
    <Video source={{ uri: video.url }} shouldPlay isMuted={false} />
    {/* Controls overlay with auto-hide after 3 seconds */}
  </Animated.View>
</Modal>
```

`statusBarTranslucent` on Android makes the video go edge-to-edge under the status bar, matching iOS behavior.

### 6.5 Why Videos Only Play When Tapped

Playing all 6 videos simultaneously would:
- Drain the battery rapidly
- Saturate the network connection
- Cause audio chaos

The solution: `shouldPlay={isActive}` — only the tapped card plays. All others are paused and show a play icon overlay.

---

## 7. Video Streaming — How It Works

This is worth understanding deeply because it's the most complex part.

### The Problem with Large Files

Your videos are 500MB–1.9GB each. A phone cannot:
- Download 1.9GB before starting playback
- Hold multiple 1.9GB files in memory

### HTTP Range Requests — The Solution

HTTP Range Requests allow a client to ask for a specific portion of a file:

```
Client → Server:
GET /videos/video1.mov
Range: bytes=0-10485760

Server → Client:
HTTP/1.1 206 Partial Content
Content-Range: bytes 0-10485760/1901458529
Content-Length: 10485761
[first 10MB of video data]
```

The player receives the first chunk, starts playing, and simultaneously requests the next chunk. This is called **progressive streaming**.

### Why .mov Files Work

`.mov` (QuickTime) and `.mp4` (MPEG-4) are both **container formats** — they're wrappers around the actual video and audio data. The video codec inside both is usually H.264. By serving `.mov` files with the MIME type `video/mp4`, we tell the player "this is H.264 video in a compatible container" — and it plays fine.

### The moov Atom Problem

MP4/MOV files have a metadata section called the **moov atom** that tells the player the video's duration, dimensions, and where each frame is located. In many files, this is at the **end** of the file.

When a player receives a file, it first looks for the moov atom. If it's at the end, the player must download the entire file before it can start playing — defeating the purpose of streaming.

**Solution for production:** Use `ffmpeg` to move the moov atom to the beginning:
```bash
ffmpeg -i input.mov -movflags faststart output.mp4
```

This is why some of your videos may load faster than others — it depends on how the DJI drone encoded them.

---

## 8. Key Concepts Explained

### What is an API?
API stands for Application Programming Interface. It's a defined way for two programs to talk to each other. Our backend exposes a REST API — a set of URLs that return data in JSON format.

When the mobile app loads, it calls:
```
GET http://172.20.10.3:3001/api/videos
```
And receives:
```json
[
  { "filename": "video1.mov", "url": "http://172.20.10.3:3001/videos/video1.mov", "description": "" },
  { "filename": "video2.mov", "url": "http://172.20.10.3:3001/videos/video2.mov", "description": "" }
]
```

### What is JSON?
JSON (JavaScript Object Notation) is a text format for structured data. It's the universal language APIs use to exchange information. It looks like JavaScript objects and arrays.

### What is a Component?
In React and React Native, a component is a self-contained piece of UI. It's a function that takes inputs (called **props**) and returns UI elements. Components can be nested inside each other, reused, and maintain their own internal state.

### What is State?
State is data that belongs to a component and can change over time. When state changes, React automatically re-renders the component to reflect the new data. Example: `activeVideo` state — when you tap a video, the state changes from `null` to `"video1.mov"`, and React re-renders the gallery to show that video as active.

### What is a Hook?
Hooks are special React functions that let you "hook into" React features from function components. They always start with `use`. The most common ones are `useState`, `useEffect`, `useRef`, and `useCallback`.

### What is CORS?
CORS (Cross-Origin Resource Sharing) is a browser security feature that blocks web pages from making requests to a different domain/port than the one they were loaded from. Our backend uses the `cors` package to allow requests from any origin — necessary so the web app on port 3000 can talk to the backend on port 3001.

### What is a Proxy?
In Vite's config, we set up a proxy:
```javascript
proxy: {
  '/api': 'http://localhost:3001',
  '/videos': 'http://localhost:3001'
}
```
This means when the web app requests `/api/videos`, Vite forwards that request to `http://localhost:3001/api/videos`. The browser thinks it's talking to port 3000, but the request actually goes to port 3001. This avoids CORS issues during development.

### What is a Node.js Stream?
Instead of reading an entire file into memory and then sending it, a stream reads and sends data in small chunks. `createReadStream(filePath, { start, end })` creates a readable stream for a specific byte range of a file. `.pipe(res)` connects that stream directly to the HTTP response — data flows from disk to network without ever fully loading into RAM.

### What is the Event Loop?
Node.js is single-threaded but handles many requests simultaneously using an **event loop**. When a request comes in, Node starts reading the file (an async operation), then moves on to handle other requests. When the file read completes, the event loop picks it back up and sends the response. This is why Node.js is efficient for I/O-heavy tasks like serving files.

### What is `async/await`?
Modern JavaScript syntax for handling asynchronous operations (things that take time, like reading files or making network requests). Instead of nested callbacks, you write code that reads sequentially:

```javascript
// Without async/await (callback hell):
readFile(path, (err, data) => {
  JSON.parse(data, (err, json) => {
    // ...
  });
});

// With async/await (clean and readable):
const data = await readFile(path, 'utf-8');
const json = JSON.parse(data);
```

---

## 9. File Structure

```
project/
│
├── backend/
│   ├── server.js          # Express server — API + video streaming
│   └── package.json       # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx       # App entry point + router
│   │   ├── Gallery.jsx    # Video gallery page
│   │   ├── Admin.jsx      # Upload/manage videos page
│   │   └── styles.css     # All web styles
│   ├── index.html         # HTML shell
│   ├── vite.config.js     # Vite build config + proxy
│   └── package.json       # Frontend dependencies
│
├── mobile/
│   ├── screens/
│   │   └── GalleryScreen.js  # Main mobile screen
│   ├── App.js             # Mobile app entry point
│   ├── constants.js       # API base URL (your Mac's IP)
│   ├── app.json           # Expo configuration
│   └── package.json       # Mobile dependencies
│
├── videos/
│   ├── video1.mov         # Your video files
│   ├── video2.mov
│   └── metadata.json      # Video descriptions
│
├── package.json           # Root — runs both backend + frontend
└── vercel.json            # Deployment configuration
```

---

## 10. How to Run the Project

### Prerequisites
- Node.js installed
- Expo Go app on your iPhone/Android
- Mac and phone on the same WiFi or hotspot

### Start the web app + backend

```bash
# From the project root folder:
npm run dev
```

This starts:
- Backend API at `http://localhost:3001`
- Web gallery at `http://localhost:3000`

### Start the mobile app

```bash
# In a new terminal tab:
cd mobile
npx expo start --lan
```

Scan the QR code with Expo Go.

### Update the IP address

If your network changes, find your Mac's IP:
```bash
ipconfig getifaddr en0
```

Then update `mobile/constants.js`:
```javascript
export const API_BASE = 'http://YOUR_IP:3001';
```

### Admin panel

Open `http://localhost:3000/admin` in your browser to upload videos and manage descriptions.

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| **API** | A defined interface for programs to communicate |
| **REST** | A convention for web APIs using HTTP methods (GET, POST, PUT, DELETE) |
| **JSON** | Text format for structured data exchange |
| **HTTP** | The protocol web browsers and apps use to request data |
| **HTTP 200** | "OK" — full successful response |
| **HTTP 206** | "Partial Content" — response to a range request |
| **HTTP 404** | "Not Found" — requested resource doesn't exist |
| **Range Request** | HTTP feature to request a specific byte range of a file |
| **MIME Type** | A label that tells the receiver what kind of data is being sent (e.g. `video/mp4`) |
| **Stream** | Data transferred in chunks rather than all at once |
| **Component** | A reusable, self-contained piece of UI in React |
| **State** | Data owned by a component that triggers re-renders when changed |
| **Hook** | A React function that adds capabilities to components (`useState`, `useEffect`, etc.) |
| **Props** | Data passed from a parent component to a child component |
| **Re-render** | React updating the UI to reflect new state |
| **Native Driver** | Running animations on the UI thread for maximum performance |
| **CORS** | Browser security policy controlling cross-origin requests |
| **Proxy** | A middleman that forwards requests from one server to another |
| **Middleware** | Code that runs between receiving a request and sending a response |
| **Async/Await** | JavaScript syntax for writing asynchronous code sequentially |
| **Event Loop** | Node.js mechanism for handling multiple operations concurrently |
| **Bundle** | All JavaScript files compiled and combined into one optimized file |
| **Hot Reload** | Development feature that updates the app instantly when you save a file |
| **moov atom** | Metadata section in MP4/MOV files containing video structure information |
| **H.264** | The most common video codec — compresses video for efficient storage/streaming |
| **Codec** | Software that encodes/decodes video or audio data |
| **Container format** | A file format that wraps video, audio, and metadata (e.g. .mp4, .mov) |
| **FlatList** | React Native's virtualized list — only renders visible items |
| **Modal** | A UI overlay that appears on top of the current screen |
| **Expo Go** | An app that lets you run Expo projects on a real device without building |
| **LAN** | Local Area Network — devices connected to the same WiFi/hotspot |

---

*© 2026 Julian Sanchez LLC. All rights reserved.*
