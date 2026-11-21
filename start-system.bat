@echo off
title Batloung Farm Distribution System
color 0A

echo =====================================================================
echo           BATLOUNG FARM DISTRIBUTION MANAGEMENT SYSTEM
echo             Web Application Development (DIWA2110)
echo =====================================================================
echo.

:: Move to the directory where this script is located
cd /d "%~dp0"

echo [1/3] Starting Backend REST API Server (Port 5000)...
start "Batloung Farm - Backend API (Port 5000)" cmd /k "cd /d "%~dp0backend" && echo Starting Backend Server... && npm start"

echo [2/3] Starting Frontend React Application (Port 5173)...
start "Batloung Farm - Frontend App (Port 5173)" cmd /k "cd /d "%~dp0frontend" && echo Starting Frontend Server... && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 4 /nobreak >nul

echo Opening browser at http://localhost:5173...
start http://localhost:5173

echo.
echo =====================================================================
echo System is now running!
echo.
echo   * Web Application: http://localhost:5173
echo   * Backend REST API: http://localhost:5000
echo   * API Health Check: http://localhost:5000/api/health
echo.
echo NOTE: Keep the backend and frontend command windows open while
echo using the system. Close those windows when you are done.
echo =====================================================================
echo.
pause
