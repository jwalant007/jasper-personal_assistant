@echo off
title JASPER Satellite Hardware Bridge
echo ========================================================
echo   Starting JASPER Local Host Satellite Bridge...
echo   Connecting your PC hardware to JASPER Cloud on Render
echo ========================================================
cd /d "%~dp0"
set "NODE_PATH=%~dp0server\node_modules;%~dp0node_modules;%NODE_PATH%"
node satellite/satelliteAgent.js
pause
