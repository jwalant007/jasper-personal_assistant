@echo off
title JASPER TELEPHONY & AI RECEPTIONIST CORE
color 0B
cls
echo =================================================================
echo        LAUNCHING JASPER TELEPHONY & AI RECEPTIONIST HUB
echo =================================================================
echo.
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo [1/2] Initializing JASPER Telephony & Meeting Services...
start /b node server/server.js 2>nul
timeout /t 3 /nobreak >nul

echo [2/2] Opening Telephony Core & Switchboard on Workstation...
start "" "http://localhost:3001"

echo.
echo =================================================================
echo   JASPER Telephony Core is now running on http://localhost:3001
echo =================================================================
exit
