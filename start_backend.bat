@echo off
REM Smart Community Health Monitoring - Backend Startup Script
REM Uses Python 3.11 venv (NOT the Python 3.14 venv which breaks scikit-learn)

echo ============================================================
echo  SMART COMMUNITY HEALTH MONITORING - BACKEND STARTUP
echo ============================================================
echo.

REM Step 1: Start PostgreSQL if not running
echo [1/3] Starting PostgreSQL 18...
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "C:\Program Files\PostgreSQL\18\data" -l "%~dp0backend\postgres.log" start 2>nul
timeout /t 2 /nobreak >nul

REM Quick check if postgres responded
"C:\Program Files\PostgreSQL\18\bin\pg_isready.exe" -q
if %ERRORLEVEL% EQU 0 (
    echo     PostgreSQL is running on port 5432.
) else (
    echo     WARNING: PostgreSQL may not be running. Check backend\postgres.log
)
echo.

REM Step 2: Validate the Python 3.11 venv
echo [2/3] Validating Python 3.11 virtual environment...
if not exist "%~dp0backend\venv\Scripts\python.exe" (
    echo     ERROR: venv not found! Recreating with Python 3.11...
    py -3.11 -m venv "%~dp0backend\venv"
    "%~dp0backend\venv\Scripts\python.exe" -m pip install -r "%~dp0backend\requirements.txt"
    "%~dp0backend\venv\Scripts\python.exe" -m pip install "psycopg[binary]"
    echo     venv created and dependencies installed.
) else (
    echo     Python 3.11 venv OK.
)
echo.

REM Step 3: Start FastAPI
echo [3/3] Starting FastAPI backend (http://127.0.0.1:8000)...
echo     API Docs available at: http://127.0.0.1:8000/docs
echo     Press Ctrl+C to stop the server.
echo.
"%~dp0backend\venv\Scripts\python.exe" -m uvicorn backend.app.main:app --reload --port 8000
