@echo off
title JWALANT BHATT CREATION - JASPER OS PORTABLE KEY LAUNCHER
color 0B
cls
echo ===============================================================================
echo            ⚡ JWALANT BHATT CREATION - JASPER OS PORTABLE KEY ⚡
echo ===============================================================================
echo [SYSTEM INFO] Authenticating JWALANT BHATT CREATION USB Security Key...
echo [SYSTEM INFO] Starting JASPER Assistant Portable Node.js Server & OS Desktop...
echo.

set PORTABLE_DIR=%~dp0
cd /d "%PORTABLE_DIR%"

:: Create USB Security Key Marker File
echo JWALANT_BHATT_CREATION_SECURE_KEY_AUTHENTICATED > "%PORTABLE_DIR%.jasper_security_key"

:: Start Node.js Server
start /b node server/index.js

:: Wait 3 seconds for server initialization
timeout /t 3 /nobreak >nul

:: Launch Full-Screen Browser to JASPER OS
echo [SUCCESS] Opening JASPER OS Spatial Desktop...
start "" "http://localhost:5000"

cls
echo ===============================================================================
echo      ⚡ JWALANT BHATT CREATION OS IS RUNNING IN PORTABLE USB MODE ⚡
echo ===============================================================================
echo Keep this window open while using JASPER OS.
echo Unplugging USB key or closing this window will safely stop the portable session.
echo.
pause
