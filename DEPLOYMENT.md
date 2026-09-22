# 🚀 24/7 Permanent Cloud Deployment Guide for JASPER

This guide lets you host JASPER permanently online in the cloud so you can access it from your phone (4G/5G) or any device anywhere in the world — **even when your laptop is turned off or sleeping!**

---

## 🌟 Option A: Deploy to Render.com (100% Free Forever)

Render offers free web service hosting that automatically builds and deploys your repository directly from GitHub.

### Step 1: Push your latest changes to GitHub
Run in PowerShell:
```powershell
git add .
git commit -m "Configure 24/7 permanent cloud deployment"
git push origin master
```
*(or `main` if your default branch is main)*

### Step 2: Create a Free Web Service on Render
1. Go to [https://render.com](https://render.com) and click **Sign Up** (choose **Continue with GitHub**).
2. On your Render dashboard, click **New +** → **Web Service**.
3. Select your repository: `jwalant007/jasper-personal_assistant`.
4. Configure the settings:
   - **Name**: `jasper-assistant` *(or any name you like)*
   - **Region**: Choose the closest region (e.g., *Singapore* or *Frankfurt*)
   - **Branch**: `master` (or your active branch)
   - **Runtime**: `Node`
   - **Build Command**: `npm run install-all && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: **Free**
5. Click **Create Web Service**.

### Step 3: Access your Permanent URL!
Within 2-3 minutes, Render will build and deploy your app. You will receive a permanent HTTPS URL like:
> **`https://jasper-assistant.onrender.com`**

You can open this link on your phone anywhere in the world on 4G/5G, save it to your phone's home screen as an app, and it will stay online forever!

---

## 🚂 Option B: Deploy to Railway.app (Fastest 1-Click Docker)

1. Go to [https://railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `jwalant007/jasper-personal_assistant`.
4. Railway automatically detects the included `Dockerfile` and builds the production container.
5. In **Settings** → **Networking**, click **Generate Domain**.
6. You get a permanent high-speed domain like:
   > **`https://jasper-assistant-production.up.railway.app`**

---

## 🐳 Option C: Deploy on any Linux VPS (DigitalOcean / AWS / Hetzner)

If you have a Linux server or VPS, run with Docker:
```bash
git clone https://github.com/jwalant007/jasper-personal_assistant.git
cd jasper-personal_assistant
docker build -t jasper-assistant .
docker run -d -p 80:3001 --restart always --name jasper jasper-assistant
```

---

## 📱 How to Add to Your Mobile Phone as a Native App
Once your permanent URL is live:
1. Open the URL in Google Chrome (Android) or Safari (iPhone).
2. Tap the browser menu (**⋮** or **Share** icon).
3. Tap **Add to Home screen** / **Install App**.
4. You now have a full-screen, dedicated JASPER icon on your phone that launches your cloud assistant anytime!
