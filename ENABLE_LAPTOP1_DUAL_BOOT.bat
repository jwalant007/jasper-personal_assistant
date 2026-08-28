@echo off
title JWALANT BHATT CREATION - CONFIGURE DUAL BOOT ON LAPTOP 1
color 0A
cls
echo ===============================================================================
echo      ⚡ JWALANT BHATT CREATION - ENABLE DUAL BOOT FOR LAPTOP 1 ⚡
echo ===============================================================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0setup_laptop1_dual_boot.ps1"
echo.
pause
