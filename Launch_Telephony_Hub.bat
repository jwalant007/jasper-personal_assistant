@echo off
title JASPER TELEPHONY - AI RECEPTIONIST HUB
color 0B
cls
echo =================================================================
echo        LAUNCHING JASPER TELEPHONY - AI RECEPTIONIST HUB
echo =================================================================
echo.
cd /d "%~dp0"

echo [1/2] Detecting JASPER server connection...
set "TARGET_URL=https://jasper-personal-assistant.onrender.com"

:: Quick TCP check for local Vite (5173) or local Express (5000)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = New-Object System.Net.Sockets.TcpClient; try { $c.Connect('127.0.0.1', 5173); exit 0 } catch { try { $c.Connect('127.0.0.1', 5000); exit 1 } catch { exit 2 } } finally { if ($c) { $c.Dispose() } }" >nul 2>nul
if %errorlevel% equ 0 (
    set "TARGET_URL=http://localhost:5173"
    echo [DETECTED] Local Vite Dev Server active at http://localhost:5173
) else if %errorlevel% equ 1 (
    set "TARGET_URL=http://localhost:5000"
    echo [DETECTED] Local Production Server active at http://localhost:5000
) else (
    echo [DETECTED] Connecting to 24/7 Cloud Core: https://jasper-personal-assistant.onrender.com
)

set "FULL_URL=%TARGET_URL%/?app=telephony"
echo.
echo [2/2] Opening Telephony and Receptionist Core at:
echo %FULL_URL%
echo.

:: Try opening in dedicated app-window mode in Chrome or Edge
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%FULL_URL%"
    exit /b 0
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%FULL_URL%"
    exit /b 0
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%FULL_URL%"
    exit /b 0
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%FULL_URL%"
    exit /b 0
)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%FULL_URL%"
    exit /b 0
)

:: Fallback to default browser
start "" "%FULL_URL%"
exit /b 0
