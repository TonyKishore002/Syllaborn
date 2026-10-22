# Syllaborn 🧙⚔️
### AI-Powered Gamified University Syllabus & Semester Management Platform
> *"Your syllabus. Your story. Your victory."*

**Syllaborn** transforms static, intimidating university syllabus PDFs into an interactive, dark-fantasy RPG semester roadmap inside a world called **the Semesterverse**. Routine assignments become quests, major examinations become boss battles with Boss HP derived from grading percentages, completed tasks award XP to level up, and academic deadlines are tracked with zero stress.

Built with a **local-first, no-database architecture**, Syllaborn stores all player progress and course roadmaps directly inside your browser's `localStorage` while processing PDFs locally with PDF.js and calling an optional secure AI backend on demand.

---

## 🌟 Core Features

- **🛡️ Local-First Architecture (NO DATABASE)**:
  - Zero database setup required: no Supabase, Firebase, MongoDB, or PostgreSQL.
  - All profile data, courses, quests, XP transactions, and achievements are persisted in `localStorage` under `syllaborn:data:v1`.
  - Raw PDF files and large extracted text chunks are not stored in persistent storage to protect browser quota.
  - Full **JSON Backup Export & Import** with schema and version validation.

- **📜 AI Syllabus Intelligence Pipeline**:
  - Drag-and-drop syllabus PDF upload.
  - Client-side text extraction using PDF.js.
  - Transparent text preview and explicit student confirmation before sending text to AI.
  - Secure server-side processing endpoint (`POST /api/analyze-syllabus`) using OpenAI structured outputs.
  - Extracts course codes, grading weights, assessment types, deadlines, and policy excerpts with supporting evidence quotes.
  - Review and approval workflow: edit or correct milestones before saving to your quest log.

- **⚔️ RPG Gamification Engine**:
  - **Deterministic XP Rewards**: Assignments (50 XP), Quizzes (100 XP), Labs (120 XP), Projects (200 XP), Midterms (300 XP), Final Exams (500 XP).
  - **Boss HP Calculation**: Boss HP = assessment weight percentage × 10 (e.g., 30% Midterm = 300 HP).
  - **Deterministic Level Progression**: Progress from *Syllabus Novice* to *Arcane Scholar* and *Semester Sovereign*.
  - **Idempotent Rewards**: XP transactions use unique idempotency keys (`milestoneId:transactionType`) to prevent duplicate rewards.

- **🧙 Professor Panic (Academic Companion)**:
  - Tiny floating wizard academic advisor with oversized hat, expressive eyes, glowing staff, and the legendary *PANIC* book.
  - Responsive mood states (`idle`, `thinking`, `confused`, `worried`, `cheering`, `victory`, `error`).
  - Context-aware dialogue responding to syllabus uploads, looming exams, and level ups.
  - Configurable humor modes: `Chill`, `Playful`, or `Chaotic`.

- **🗺️ Interactive Quest Map**:
  - Thematic fantasy regions for courses (e.g., *Forest of Infinite Loops*, *Citadel of Deadlocks*).
  - Stage-by-stage node progression with connected paths.
  - Clickable nodes with quest inspection panel.

- **📅 Semester Deadline Calendar & 📊 Analytics**:
  - Month and Upcoming List calendar views with course color indicators and high-stakes exam highlights.
  - Academic analytics charts (Recharts): milestone completion rates, workload distribution, and XP velocity over time.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide React, Recharts, PDF.js (`pdfjs-dist`), Canvas Confetti, Zod.
- **Backend**: Node.js, Express, TypeScript, Zod, OpenAI SDK, Express Rate Limit, CORS.
- **Persistence**: Browser `localStorage` (no database).
- **Testing**: Vitest (Unit and Integration test suites).

---

## 🚀 Quick Start & Local Development

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+

### 2. Install Dependencies

Install frontend dependencies:
```bash
npm install
```

Install backend dependencies:
```bash
npm --prefix backend install
```

### 3. Environment Variables Configuration

#### Frontend (`.env`)
Create `.env` in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```
Default configuration:
```env
VITE_API_BASE_URL=http://localhost:3001
```

#### Backend (`backend/.env`)
Create `backend/.env` (or copy from `backend/.env.example`):
```bash
cp backend/.env.example backend/.env
```
Add your OpenAI API key:
```env
PORT=3001
OPENAI_API_KEY=sk-proj-your_actual_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
FRONTEND_ORIGIN=http://localhost:5173
```

> **Note**: All features in Syllaborn (course management, manual quest creation, calendar, analytics, quest map, XP progression, and backup export/import) work completely offline without an API key. The API key is only needed when executing automated AI syllabus PDF analysis.

---

## 🏃 Running the Application

### Start the AI Backend (Port 3001)
From root:
```bash
npm run dev:backend
```
*Or navigate to the backend directory:*
```bash
cd backend
npm run dev
```
Health endpoint: `http://localhost:3001/api/health`

### Start the Frontend Web App (Port 5173)
From root in a separate terminal:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Running Tests & Build Checks

### Run Unit and Integration Tests
```bash
npm test
```
Runs 19 automated tests covering:
- Deterministic Boss HP formula (`weightPercent * 10`)
- Difficulty categorization logic
- XP reward calculations and level threshold curves
- Idempotent reward keys to prevent duplicate XP
- Zod schema validation for AI syllabus outputs and entity models
- Local storage operations, cascading course deletions, and state toggles

### Run Frontend Production Build
```bash
npm run build
```

### Run Backend TypeScript Build
```bash
npm run build:backend
```

---

## 📦 Data Backup & Privacy Notice

1. **Local-First Storage**: Your academic data lives in your browser's `localStorage` (`syllaborn:data:v1`). No personal information or course documents are synced to third-party databases.
2. **Clearing Browser Data**: Clearing browser site data or cookies for this origin will reset local progress.
3. **Backups**: Go to **Settings & Data Sanctuary** at any time and click **Download JSON Backup** to export an offline copy of your entire quest book. You can restore this backup on any device or browser with one click.

---

## ☁️ Production Deployment

### Frontend (Vercel)
1. Deploy the frontend repository root to **Vercel**.
2. In Vercel Project Settings -> **Environment Variables**:
   - Add `VITE_API_BASE_URL` set to your deployed backend URL on Render (e.g., `https://syllaborn-backend.onrender.com`).
   - *Never set `VITE_API_BASE_URL` to `localhost` in production. Syllaborn strictly validates production URLs to prevent broken localhost calls.*
3. Redeploy your latest deployment to apply the environment variable.

### AI Backend (Render)
1. In [Render Dashboard](https://dashboard.render.com), create a new **Web Service** pointing to this repository.
2. Configure service settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health` (or `/health`)
3. Add the following **Environment Variables** in Render:
   - `GEMINI_API_KEY`: Your Google Gemini API Key (or `OPENAI_API_KEY` for OpenAI)
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite` (default)
   - `FRONTEND_ORIGIN`: Your Vercel production URL (e.g. `https://syllaborn.vercel.app`)
   - `ALLOWED_ORIGINS`: Comma-separated allowed domains (e.g. `https://syllaborn.vercel.app,http://localhost:5173`)
4. Once deployed, copy your Render web service URL (e.g., `https://syllaborn-backend.onrender.com`) and paste it as `VITE_API_BASE_URL` in your Vercel project settings.

