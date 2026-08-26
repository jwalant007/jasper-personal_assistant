@echo off
title JWALANT BHATT CREATION - JASPER OS PORTABLE KEY LAUNCHER
color 0B
cls
echo ===============================================================================
echo            ⚡ JWALANT BHATT CREATION - JASPER OS PORTABLE KEY ⚡
echo ===============================================================================
echo [SYSTEM INFO] Authenticating JWALANT BHATT CREATION Security Key...
echo.

set PORTABLE_DIR=%~dp0
cd /d "%PORTABLE_DIR%"

:: Check if Node.js is installed locally on this machine
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [SYSTEM INFO] Starting Local Node.js Server...
    start /b node server/index.js 2>nul || start /b node server/server.js 2>nul
    timeout /t 3 /nobreak >nul
    echo [SUCCESS] Opening JASPER OS Local Server...
    start "" "http://localhost:5000"
) else (
    echo [SYSTEM INFO] Node.js not installed on this PC. Connecting to Laptop 1 Master Server...
    echo [SUCCESS] Opening JASPER OS from Master Node (192.168.29.132)...
    start "" "http://192.168.29.132:5173" || start "" "http://192.168.29.132:5000"
)

cls
echo ===============================================================================
echo      ⚡ JWALANT BHATT CREATION OS IS RUNNING ON THIS COMPUTER ⚡
echo ===============================================================================
echo JASPER OS is now active in your browser.
echo.
pause
