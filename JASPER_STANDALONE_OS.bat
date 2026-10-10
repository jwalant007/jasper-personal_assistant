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

echo [ONLINE] Opening JASPER OS Cloud Kiosk Shell...

:: 1. Check Chrome in standard installation paths
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --kiosk --app=%CLOUD_URL%
    exit
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --kiosk --app=%CLOUD_URL%
    exit
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --kiosk --app=%CLOUD_URL%
    exit
)

:: 2. Check Edge in standard installation paths
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --kiosk --app=%CLOUD_URL% --edge-kiosk-type=fullscreen
    exit
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --kiosk --app=%CLOUD_URL% --edge-kiosk-type=fullscreen
    exit
)

:: 3. Check browsers in PATH
where chrome >nul 2>nul && (
    start "" chrome --kiosk --app=%CLOUD_URL%
    exit
)
where msedge >nul 2>nul && (
    start "" msedge --kiosk --app=%CLOUD_URL% --edge-kiosk-type=fullscreen
    exit
)

:: 4. Fallback to default browser
start "" "%CLOUD_URL%"
exit

