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
set CLOUD_URL=https://jasper-personal-assistant.onrender.com
echo [SUCCESS] Authenticated! Connecting to 24/7 JASPER Cloud OS (%CLOUD_URL%)...
start "" "%CLOUD_URL%"

cls
echo ===============================================================================
echo      ⚡ JWALANT BHATT CREATION OS IS RUNNING ON THIS COMPUTER ⚡
echo ===============================================================================
echo JASPER OS is now active in your browser.
echo.
pause
