@echo off
title JWALANT BHATT CREATION - DUAL OS BOOT SELECTOR
color 0B
cls
echo ===============================================================================
echo        ⚡ JWALANT BHATT CREATION - DUAL OS BOOT SELECTOR ⚡
echo ===============================================================================
echo.
echo    [1] Launch JASPER OS (Full Screen Standalone AI OS)
echo    [2] Continue to Standard Windows 11 Desktop
echo.
echo ===============================================================================
echo Choice will auto-select [2] Windows 11 Desktop in 5 seconds...
echo.

choice /c 12 /t 5 /d 2 /m "Select Operating System Environment:"

if errorlevel 2 goto WINDOWS_DESKTOP
if errorlevel 1 goto JASPER_OS

:JASPER_OS
cls
echo.
echo [SYSTEM] Booting JASPER OS Environment...
cd /d "%~dp0"
start /b node server/server.js 2>nul
timeout /t 3 /nobreak >nul
start chrome.exe --kiosk --app=http://localhost:3001 || start msedge.exe --kiosk --app=http://localhost:3001 || start "" "http://localhost:3001"
exit

:WINDOWS_DESKTOP
cls
echo.
echo [SYSTEM] Continuing to Windows Desktop...
exit
