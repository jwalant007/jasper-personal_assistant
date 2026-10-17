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

echo [1/3] Checking connection to local or cloud JASPER instance...
set TARGET_URL=https://jasper-personal-assistant.onrender.com

:: Detect if local development server or production server is active
powershell -NoProfile -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', 5173); exit 0 } catch { try { $client.Connect('127.0.0.1', 5000); exit 1 } catch { exit 2 } } finally { $client.Close() }"
if %errorlevel% equ 0 (
    set TARGET_URL=http://localhost:5173
    echo [DETECTED] Local Vite Dev Server is active at http://localhost:5173!
) else if %errorlevel% equ 1 (
    set TARGET_URL=http://localhost:5000
    echo [DETECTED] Local Production Server is active at http://localhost:5000!
) else (
    echo [DETECTED] Connecting to 24/7 JASPER Cloud Hub (https://jasper-personal-assistant.onrender.com)...
)

echo [2/3] Opening Telephony & AI Receptionist Core...
start "" "%TARGET_URL%"

echo.
echo =================================================================
echo   JASPER Telephony & Receptionist Hub is live on %TARGET_URL%
echo =================================================================
exit
