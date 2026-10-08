@echo off
title JWALANT BHATT CREATION - JASPER OS STANDALONE CLOUD LAUNCHER
color 0B
cls
echo ===============================================================================
echo        ⚡ BOOTING JWALANT BHATT CREATION STANDALONE OS ENVIRONMENT ⚡
echo ===============================================================================
echo Connecting to JASPER 24/7 Cloud Core (https://jasper-personal-assistant.onrender.com)...
echo.

set CLOUD_URL=https://jasper-personal-assistant.onrender.com

cd /d "%~dp0"

:: Launch Full-Screen Standalone Kiosk Mode pointing directly to 24/7 Render Cloud
echo [ONLINE] Opening JASPER OS Cloud Kiosk Shell...
start chrome.exe --kiosk --app=%CLOUD_URL% || start msedge.exe --kiosk --app=%CLOUD_URL% --edge-kiosk-type=fullscreen || start "" "%CLOUD_URL%"

exit

