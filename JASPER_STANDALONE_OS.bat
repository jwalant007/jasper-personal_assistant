@echo off
title JWALANT BHATT CREATION - JASPER OS STANDALONE LAUNCHER
color 0B
cls
echo ===============================================================================
echo        ⚡ BOOTING JWALANT BHATT CREATION STANDALONE OS ENVIRONMENT ⚡
echo ===============================================================================
echo Starting backend AI engine and spatial window manager...
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% equ 0 (
    start /b node server/index.js 2>nul || start /b node server/server.js 2>nul
    timeout /t 3 /nobreak >nul
    echo Opening JASPER OS Local Server...
    start chrome.exe --kiosk --app=http://localhost:5000 || start msedge.exe --kiosk --app=http://localhost:5000 || start "" "http://localhost:5000"
) else (
    echo [SYSTEM INFO] Node.js not detected on this PC. Connecting to Laptop 1 Master Node...
    start chrome.exe --kiosk --app=http://192.168.29.132:5000 || start msedge.exe --kiosk --app=http://192.168.29.132:5000 || start "" "http://192.168.29.132:5000"
)

exit
