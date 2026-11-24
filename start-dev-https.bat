@echo off
:: ============================================================
:: Smart Community Health Monitoring — Local Dev Launcher (HTTPS)
:: Starts FastAPI backend on 0.0.0.0:8000 and Vite HTTPS on 0.0.0.0:5173
:: ============================================================

echo ==========================================================
echo Starting Smart Community Health Monitoring System (HTTPS)
echo ==========================================================
echo.

echo [1/2] Starting FastAPI Backend on http://0.0.0.0:8000 ...
start "FastAPI Backend" cmd /k "cd /d %~dp0 && backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Vite Frontend on https://0.0.0.0:5173 ...
start "Vite Frontend HTTPS" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==========================================================
echo System Started!
echo.
echo Desktop URL: https://localhost:5173
echo LAN Mobile URL: https://192.168.1.109:5173
echo.
echo Vite proxies all /api calls internally to FastAPI (8000).
echo ==========================================================
pause
