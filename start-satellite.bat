@echo off
title JASPER Satellite Hardware Bridge
echo ========================================================
echo   Starting JASPER Local Host Satellite Bridge...
echo   Connecting your PC hardware to JASPER Cloud on Render
echo ========================================================
cd /d "%~dp0"
node satellite/satelliteAgent.js
pause
