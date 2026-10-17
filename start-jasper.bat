@echo off
title JASPER AI ASSISTANT - STARTING SYSTEM CORE
color 0B
echo =================================================================
echo             JASPER PERSONALIZED AI ASSISTANT CORE
echo =================================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in system PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    pause
    exit /b
)

:: Check if node_modules exists
if not exist node_modules (
    echo [SYSTEM] Initializing dependencies for JASPER...
    echo [SYSTEM] This might take a couple of minutes...
    call npm run install-all
) else if not exist server\node_modules (
    echo [SYSTEM] Restoring server dependencies...
    call npm install --prefix server
) else if not exist client\node_modules (
    echo [SYSTEM] Restoring client dependencies...
    call npm install --prefix client
)

echo.
echo [SYSTEM] Starting JASPER Assistant Services...
echo [SYSTEM] Waking up background modules (Port 5000 Server & Port 5173 Client)...
echo.
call npm start
pause
