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

echo [1/2] Connecting to 24/7 JASPER Cloud Hub (https://jasper-personal-assistant.onrender.com)...
set CLOUD_URL=https://jasper-personal-assistant.onrender.com

echo [2/2] Opening Telephony Core & Switchboard on Workstation...
start "" "%CLOUD_URL%"

echo.
echo =================================================================
echo   JASPER Telephony Core is live on %CLOUD_URL%
echo =================================================================
exit
