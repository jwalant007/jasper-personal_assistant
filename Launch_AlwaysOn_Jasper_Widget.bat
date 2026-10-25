@echo off
title J.A.S.P.E.R. ALWAYS-ON DESKTOP JASPER WIDGET
cls
echo ===============================================================================
echo     🔮 J.A.S.P.E.R. ALWAYS-ON FLOATING DESKTOP JASPER WIDGET 🔮
echo ===============================================================================
echo.
echo [1/3] Checking environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required to run the native desktop widget.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/3] Verifying client build bundle...
if not exist "client\dist\index.html" (
    echo [BUILD] Building optimized client bundle for offline desktop widget...
    call npm run build:client
)

echo [3/3] Launching Transparent Floating JASPER Widget on Windows Desktop...
echo.
echo *******************************************************************************
echo  • The JASPER Widget Orb is now floating on your screen (above all apps).
echo  • Click it or hold your configured key (or press Ctrl+Space / Ctrl+Alt+J).
echo  • Access all widgets: Smart Home, Radar, Morning Debrief, Market, Focus & more!
echo  • You can freely drag it anywhere on your desktop.
echo  • It runs silently in the background tray even if Jasper main window is closed.
echo *******************************************************************************
echo.

:: Launch Electron in background with widget-only mode
start "" npx electron . --widget-only
exit /b 0
