@echo off
:: ============================================================
:: Smart Community Health Monitoring — Cloudflare HTTPS Tunnel
:: Provides a trusted public HTTPS URL for testing on mobile.
:: ============================================================

echo =======================================================
echo  Smart Community Health Monitoring - Cloudflare Tunnel
echo =======================================================
echo.

where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] cloudflared is not installed or not in PATH.
    echo.
    echo To install cloudflared on Windows, run this in PowerShell:
    echo     winget install Cloudflare.cloudflared
    echo.
    echo Or download cloudflared-windows-amd64.exe from:
    echo     https://github.com/cloudflare/cloudflared/releases
    echo.
    pause
    exit /b 1
)

echo Starting Cloudflare Tunnel for Vite frontend (https://localhost:5173)...
echo Note: Vite automatically proxies /api requests to FastAPI backend (port 8000).
echo.
echo Look for the line:
echo     Your quick Tunnel has been created! Visit it at:
echo     https://XXXXX.trycloudflare.com
echo.
echo Open that exact https:// URL on your Vivo Android phone!
echo.

cloudflared tunnel --url https://localhost:5173 --no-tls-verify
pause
