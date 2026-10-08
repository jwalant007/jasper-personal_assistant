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
echo [SYSTEM] Booting JASPER OS 24/7 Cloud Environment...
cd /d "%~dp0"
set CLOUD_URL=https://jasper-personal-assistant.onrender.com
start chrome.exe --kiosk --app=%CLOUD_URL% || start msedge.exe --kiosk --app=%CLOUD_URL% --edge-kiosk-type=fullscreen || start "" "%CLOUD_URL%"
exit

:WINDOWS_DESKTOP
cls
echo.
echo [SYSTEM] Continuing to Windows Desktop...
exit
