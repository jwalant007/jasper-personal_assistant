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
4. Configure the service settings:
   - **Name**: `jasper-assistant` *(or any name you like)*
   - **Region**: Choose the closest region (e.g., *Singapore* or *Frankfurt*)
   - **Branch**: `master` (or your active branch)
   - **Runtime**: `Node`
   - **Build Command**: `npm run install-all && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: **Free**

5. **Configure Environment Variables (REQUIRED)**:
   Scroll down to the **Environment Variables** section (or open the **Environment** tab on your web service dashboard) and add the following keys:
   
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | **`JASPER_AUTH_TOKEN`** | `<your-strong-secret>` *(e.g. `jasper_sec_prod_9f83a1b4`)* | **MANDATORY in production**. Protects APIs, code execution, and system control. Without this, JASPER fails closed to prevent unauthorized internet intrusion. |
   | **`GEMINI_API_KEY`** | `<your-google-gemini-key>` | Enables Google Gemini 2.0 / 3.x Flash multi-modal AI intelligence. |
   | **`NODE_ENV`** | `production` | Enables production optimizations, caching, and rate limiting. |

> [!IMPORTANT]
> **Why is `JASPER_AUTH_TOKEN` required?**
> If `JASPER_AUTH_TOKEN` is unset or left as `"jasper"` in production (`NODE_ENV=production` or `RENDER=true`), the backend logs:
> `🚨 [CRITICAL SECURITY ERROR] JASPER_AUTH_TOKEN is NOT configured in production environment! Failing closed.`
> and shuts off protected API access to prevent public internet abuse.

6. Click **Create Web Service**.

### Step 3: Access your Permanent URL!
Within 2-3 minutes, Render will build and deploy your app. You will receive a permanent HTTPS URL like:
> **`https://jasper-assistant.onrender.com`**

You can open this link on your phone anywhere in the world on 4G/5G, save it to your phone's home screen as an app, and it will stay online forever!
When prompted on first login, enter your user passcode/PIN. JASPER automatically handles session authentication using your configured `JASPER_AUTH_TOKEN`.

---

## 🚂 Option B: Deploy to Railway.app (Fastest 1-Click Docker)

1. Go to [https://railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `jwalant007/jasper-personal_assistant`.
4. Railway automatically detects the included `Dockerfile` and builds the production container.
5. In **Variables**, add `JASPER_AUTH_TOKEN` (strong secret) and `GEMINI_API_KEY`.
6. In **Settings** → **Networking**, click **Generate Domain**.
7. You get a permanent high-speed domain like:
   > **`https://jasper-assistant-production.up.railway.app`**

---

## 🐳 Option C: Deploy on any Linux VPS (DigitalOcean / AWS / Hetzner)

If you have a Linux server or VPS, run with Docker:
```bash
git clone https://github.com/jwalant007/jasper-personal_assistant.git
cd jasper-personal_assistant
docker build -t jasper-assistant .
docker run -d -p 80:3001 \
  -e JASPER_AUTH_TOKEN="your_strong_secret_token" \
  -e GEMINI_API_KEY="your_gemini_api_key" \
  -e NODE_ENV="production" \
  --restart always --name jasper jasper-assistant
```

---

## 🌐 Multi-Platform Cloud File System & Binary Distribution (Shifted to Render)

JASPER now hosts its entire binary distribution and file system directly on Render Cloud (`https://jasper-personal-assistant.onrender.com`):

### 📥 Cloud Binary Download Endpoints:
1. **Android APK**: `https://jasper-personal-assistant.onrender.com/api/apk/download`
   - Download directly onto any Android phone or tablet over 4G/5G.
   - Built with native Capacitor architecture, auto-connecting to the Render cloud backend.
2. **Windows Desktop Setup (.exe)**: `https://jasper-personal-assistant.onrender.com/api/exe/download`
   - Standalone desktop installer (.exe) for Windows 10 & 11.
   - Configured with global hotkey (`Ctrl+Alt+J`), background system tray daemon, and direct Render cloud uplink.
3. **Jasper OS Standalone Kit (.zip)**: `https://jasper-personal-assistant.onrender.com/api/os/download`
   - Full distribution kit containing `jasper-os`, fullscreen kiosk scripts, 5-second dual-boot UEFI selector, and Debian Live ISO compilation suite.
4. **Live Binary Telemetry Manifest**: `https://jasper-personal-assistant.onrender.com/api/downloads/manifest`
   - Returns real-time JSON metadata for all three platforms, including file sizes, SHA verification, timestamps, and active connection status.

---

## 💻 Shifted Client Environments:

| Component | Previous Localhost Target | Shifted Render Cloud Target |
| :--- | :--- | :--- |
| **Android APK** | `http://localhost:3001` | `https://jasper-personal-assistant.onrender.com` |
| **Windows Desktop (.exe)** | Local spawn `node server.js` | `https://jasper-personal-assistant.onrender.com` |
| **Standalone OS Kiosk** | `http://localhost:3001` | `https://jasper-personal-assistant.onrender.com` |
| **Dual-Boot Chooser** | `http://localhost:3001` | `https://jasper-personal-assistant.onrender.com` |
| **Linux Node Kiosk** | `http://localhost:3001` | `https://jasper-personal-assistant.onrender.com` |
| **Satellite Hardware Bridge** | `http://localhost:3001` | `wss://jasper-personal-assistant.onrender.com` |

---

## 📱 How to Add to Your Mobile Phone as a Native App
Once your permanent URL is live:
1. Open the URL in Google Chrome (Android) or Safari (iPhone): **`https://jasper-personal-assistant.onrender.com`**
2. Tap the browser menu (**⋮** or **Share** icon).
3. Tap **Add to Home screen** / **Install App** — or tap the **📦 Cloud Downloads** button in the top bar to install the native `JASPER_Assistant.apk`.
4. You now have a full-screen, dedicated JASPER assistant on your phone that stays online 24/7!

