# 🚀 Neighborhood Issue Tracker (Citizen Report) - Docker & Deployment Challenge

Welcome to the **Neighborhood Issue Tracker** challenge! This repository contains a production-grade full-stack application for reporting local community issues (e.g., damaged public facilities, uncollected trash, street lights outages). 

Your objective is **not** to write application code—both Frontend and Backend are fully pre-built. Instead, your task is to **containerize the stack, automate the CI/CD build pipeline via GitHub Actions, and deploy the entire infrastructure to Railway.**

---

## 🛠️ Application Overview

The application consists of three main parts:
* **Frontend:** Built with **Vite** (Static SPA) for users to submit reports, upload photos, and view the feed.
* **Backend:** Built with **Express.js**, exposing REST APIs (`/api/report`, `/api/get-list`, `/api/image/:key`), storing metadata in PostgreSQL, uploading photos to MinIO via AWS S3 SDK, and triggering Telegram/Discord webhooks.
* **Storage & DB:** **PostgreSQL** for metadata and **MinIO** for object/image storage.

---

## 🎯 Your Tasks & Requirements

### 1. Multi-Stage `Dockerfile` Construction

Write a single, production-optimized, **Multi-Stage `Dockerfile`** in the root directory that handles three distinct phases:

1. **Stage 1: Frontend Build (`Vite`)**
   * Use Node.js base image.
   * Install frontend dependencies and build static assets (`npm run build`).
2. **Stage 2: Backend Preparation (`Express.js`)**
   * Use Node.js base image.
   * Install production dependencies (`npm ci --only=production`).
3. **Stage 3: Production Server (`Nginx`)**
   * Use `nginx:alpine` as the final runner image.
   * Copy the built Vite static assets to Nginx's HTML root (`/usr/share/nginx/html`).
   * Copy Backend files and Node.js binary/runtime (or run Node.js in the background / reverse proxy setup).
   * Configure **Nginx as a Reverse Proxy**:
     * Serve static frontend files directly.
     * Proxy all API traffic starting with `/api/` to the running Express.js backend on port `3000`.

---

### 2. CI/CD Pipeline with GitHub Actions

Create a workflow file at `.github/workflows/build.yml` to automate testing and building your Docker image:

* **Triggers:** On `push` or `pull_request` to the `main` or `master` branch.
* **Tasks:**
  * Checkout the repository code.
  * Set up Docker Buildx.
  * Build the multi-stage Docker image.
  * Run and test the container briefly in the pipeline to ensure services start up correctly.
  * *(Optional)* Push the built image to Docker Hub or GitHub Container Registry (GHCR).

---

### 3. Railway Cloud Deployment & Networking

Deploy the complete infrastructure to [Railway](https://railway.app):

1. **Database & Storage Services:**
   * Deploy a **PostgreSQL** instance on Railway.
   * Deploy a **MinIO** instance (or S3 Object Storage) on Railway.
   * **Volume Mounting:** Ensure **Persistent Volumes** are attached to both PostgreSQL (`/var/lib/postgresql/data`) and MinIO (`/data`) so user reports and uploaded photos persist across redeployments!
2. **Internal Networking:**
   * Connect your Application container to PostgreSQL and MinIO using **Railway Internal Connection URLs/Hostnames** (e.g., `postgres.railway.internal`, `minio.railway.internal`). Do not expose DB/Storage ports publicly if not needed.
3. **App Deployment & Exposure:**
   * Connect your GitHub repository to Railway to deploy your Dockerfile.
   * Configure Environment Variables on Railway:
     ```env
     PORT=80
     INFO_APP_OWNER=Your Name
     DATABASE_URL=postgresql://... (Railway Private URL)
     S3_ENDPOINT=http://... (Railway Private MinIO URL)
     S3_ACCESS_KEY=...
     S3_SECRET_KEY=...
     S3_BUCKET=citizen-reports
     S3_REGION=us-east-1
     DISCORD_WEBHOOK_URL=...
     TELEGRAM_BOT_TOKEN=...
     TELEGRAM_CHAT_ID=...
     ```
   * **Expose Public Domain:** Generate a public domain for your application service on Railway and verify the live URL in your mobile/desktop browser!

---

## 📂 Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── build.yml      <-- TASK: Create GitHub Actions Workflow
├── backend/               <-- Pre-built Express.js API
├── frontend/              <-- Pre-built Vite SPA
├── nginx/
│   └── default.conf       <-- Nginx configuration for proxying /api/
├── Dockerfile             <-- TASK: Complete Multi-Stage Dockerfile
├── docker-compose.yml     <-- Local Development Compose Setup
└── README.md
```

## 🧪 Local Testing Checklist

Before deploying to Railway, test your setup locally using `docker-compose.yml`:

```bash
# 1. Build and run all services locally
docker compose up --build -d

# 2. Check container status
docker compose ps

# 3. Test the web UI and report submission
open http://localhost:8080
```

## 🏆 Definition of Done (Submission Criteria)

Your submission is complete when:

| Score | Expectation |
| ----- | ----------- |
| 20 | Dockerfile successfully builds a multi-stage image containing Vite static assets + Express backend served through Nginx. |
| 20 | `.github/workflows/build.yml` executes successfully without errors on push and ready image on `gchr.io`. |
| 30 | PostgreSQL and MinIO are mounted with persistent storage on Railway. |
| 30 | PostgreSQL and MinIO communicate with the application over Railway's Internal Network. |
| 40 | The public Railway URL opens the UI, allows uploading a photo report, saves the photo to MinIO, writes to PostgreSQL, and triggers a Telegram/Discord notification displaying Tracker Error - Deploy by {INFO_APP_OWNER} or success notification! |
| 60 | A judge's review of your deployment and your story about submitting this challenge |
| **200** | **Total Expectation Progressing** |