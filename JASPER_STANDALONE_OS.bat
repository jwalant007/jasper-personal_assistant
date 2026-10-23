@echo off
title JWALANT BHATT CREATION - JASPER OS STANDALONE & ALWAYS-ON DESKTOP ASSISTANT
color 0B
cls
echo ===============================================================================
echo        ⚡ BOOTING JWALANT BHATT CREATION STANDALONE OS ENVIRONMENT ⚡
echo ===============================================================================
echo Checking local and cloud J.A.S.P.E.R. core instances...
echo.

set TARGET_URL=https://jasper-personal-assistant.onrender.com

:: Detect if local server is active
powershell -NoProfile -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', 5173); exit 0 } catch { try { $client.Connect('127.0.0.1', 5000); exit 1 } catch { exit 2 } } finally { $client.Close() }"
if %errorlevel% equ 0 (
    set TARGET_URL=http://localhost:5173
    echo [DETECTED] Connected to Local Dev Server (http://localhost:5173)
) else if %errorlevel% equ 1 (
    set TARGET_URL=http://localhost:5000
    echo [DETECTED] Connected to Local Production Server (http://localhost:5000)
) else (
    echo [ONLINE] Connected to 24/7 JASPER Cloud Core (https://jasper-personal-assistant.onrender.com)
)

cd /d "%~dp0"

echo [ONLINE] Checking for native J.A.S.P.E.R. Always-On Desktop Shell...

:: 1. Check if installed native desktop executable exists (with Floating Bar & Background Voice)
if exist "%LocalAppData%\Programs\jasper-assistant\JASPER Assistant.exe" (
    echo [SYSTEM] Launching Native J.A.S.P.E.R. Always-On Desktop Assistant...
    start "" "%LocalAppData%\Programs\jasper-assistant\JASPER Assistant.exe"
    exit
)
if exist "%ProgramFiles%\JASPER Assistant\JASPER Assistant.exe" (
    echo [SYSTEM] Launching Native J.A.S.P.E.R. Always-On Desktop Assistant...
    start "" "%ProgramFiles%\JASPER Assistant\JASPER Assistant.exe"
    exit
)
if exist "%ProgramFiles(x86)%\JASPER Assistant\JASPER Assistant.exe" (
    echo [SYSTEM] Launching Native J.A.S.P.E.R. Always-On Desktop Assistant...
    start "" "%ProgramFiles(x86)%\JASPER Assistant\JASPER Assistant.exe"
    exit
)

:: 2. Check if local development Electron assistant is available
if exist "electron\main.js" if exist "node_modules\electron" (
    echo [SYSTEM] Starting J.A.S.P.E.R. Always-On Desktop Shell (Floating Bar + Background Voice)...
    start "" npm run electron:dev
    exit
)

echo [ONLINE] Opening JASPER OS Cloud Kiosk Shell...

:: 3. Check Chrome in standard installation paths
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --kiosk --app=%TARGET_URL%
    exit
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --kiosk --app=%TARGET_URL%
    exit
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --kiosk --app=%TARGET_URL%
    exit
)

:: 4. Check Edge in standard installation paths
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --kiosk --app=%TARGET_URL% --edge-kiosk-type=fullscreen
    exit
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --kiosk --app=%TARGET_URL% --edge-kiosk-type=fullscreen
    exit
)

:: 5. Check browsers in PATH
where chrome >nul 2>nul && (
    start "" chrome --kiosk --app=%TARGET_URL%
    exit
)
where msedge >nul 2>nul && (
    start "" msedge --kiosk --app=%TARGET_URL% --edge-kiosk-type=fullscreen
    exit
)

:: 6. Fallback to default browser
start "" "%TARGET_URL%"
exit
