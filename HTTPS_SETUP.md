# HTTPS & GPS Setup Guide for Mobile Testing

## Why GPS Failed on Android Previously
Android Chrome enforces a strict security policy: **`navigator.geolocation` is blocked on HTTP origins** (except `localhost`). When visiting `http://192.168.1.109:5173`, the browser denies GPS permissions immediately.

---

## What We Configured

1. **Vite HTTPS is permanently enabled**:
   - Uses `@vitejs/plugin-basic-ssl` inside `vite.config.js`.
   - Listens on `0.0.0.0:5173` (accessible on LAN as `https://192.168.1.109:5173`).
2. **Reverse Proxy for FastAPI (`/api`)**:
   - `vite.config.js` proxies all `/api/*` requests directly to `http://127.0.0.1:8000`.
   - The browser never makes mixed-content HTTPS→HTTP calls across ports; all API requests stay on the same HTTPS origin.
3. **Geolocation Service**:
   - Requests geolocation only when the user clicks "Submit Report" or "Voice Report".
   - Reverse geocodes using OpenStreetMap Nominatim with English/Hindi language prioritization.
   - Falls back gracefully to manual selection if denied.

---

## How to Test on Vivo Android Phone

Choose whichever method you prefer:

### Method 1: Cloudflare Tunnel (100% Trusted Public HTTPS — Recommended)
This gives you a real, trusted HTTPS URL signed by a recognized Certificate Authority, with zero Android security warnings.

1. **Install cloudflared (one-time)**:
   Open PowerShell and run:
   ```powershell
   winget install Cloudflare.cloudflared
   ```
2. **Start Backend & Frontend**:
   Double-click `start-dev-https.bat` (or run manually):
   ```powershell
   # Terminal 1 - Backend
   backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```
3. **Start the Tunnel**:
   Double-click `start-https-tunnel.bat` (or run `cloudflared tunnel --url https://localhost:5173 --no-tls-verify`).
4. **Open the URL on your Vivo Android**:
   Copy the `https://<random-subdomain>.trycloudflare.com` URL shown in the terminal.
   Open it in Chrome on your phone.
5. Tap **Submit Report** -> Chrome will show the native GPS location permission prompt -> Click **Allow**.

---

### Method 2: Direct LAN HTTPS (`https://192.168.1.109:5173`)
If you test directly over your local Wi-Fi:

1. Double-click `start-dev-https.bat`.
2. On your Vivo Android, open:
   ```
   https://192.168.1.109:5173
   ```
3. Chrome will say **"Your connection is not private"** because the local development certificate is self-signed:
   - Tap **Advanced** (at the bottom).
   - Tap **Proceed to 192.168.1.109 (unsafe)**.
4. **If Chrome on Android blocks GPS due to self-signed certificate**:
   - Open Chrome on the phone, go to `chrome://flags`.
   - Search for: `unsafely-treat-insecure-origin-as-secure`.
   - Add: `https://192.168.1.109:5173`.
   - Switch dropdown to **Enabled** and click **Relaunch**.
   - GPS will now prompt and work unconditionally!
