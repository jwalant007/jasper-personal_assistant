# ===============================================================================
# JWALANT BHATT CREATION - STANDALONE WINDOWS KIOSK SHELL OS LAUNCHER
# ===============================================================================

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "     ⚡ JWALANT BHATT CREATION - STANDALONE OS KIOSK SHELL SETUP ⚡" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuring Standalone OS Kiosk Mode for Laptop 2..." -ForegroundColor Yellow
Write-Host "When Laptop 2 turns on, Windows desktop is hidden and JASPER OS opens full-screen!" -ForegroundColor White
Write-Host ""

# Create Kiosk Shortcut Script
$kioskBat = "$PSScriptRoot\JASPER_STANDALONE_OS.bat"

$batContent = @"
@echo off
title JWALANT BHATT CREATION - JASPER OS STANDALONE KIOSK MODE
color 0B
cls
echo ===============================================================================
echo        ⚡ BOOTING JWALANT BHATT CREATION STANDALONE OS ENVIRONMENT ⚡
echo ===============================================================================
echo Starting backend AI engine and spatial window manager...
echo.

cd /d "%~dp0"
start /b node server/index.js

timeout /t 3 /nobreak >nul

:: Launch Full-Screen Kiosk Mode in Chrome/Edge
echo Opening JASPER OS Kiosk Shell...
start chrome.exe --kiosk --app=http://localhost:5000 || start msedge.exe --kiosk --app=http://localhost:5000 --edge-kiosk-type=fullscreen

exit
"@

Set-Content -Path $kioskBat -Value $batContent -Force

Write-Host "✅ Standalone Kiosk OS launcher generated: $kioskBat" -ForegroundColor Green
Write-Host ""
Write-Host "To Boot Laptop 2 Directly Into JASPER OS Like Windows:" -ForegroundColor Yellow
Write-Host "1. Copy JASPER_STANDALONE_OS.bat to Laptop 2's Windows Startup Folder:" -ForegroundColor White
Write-Host "   shell:startup" -ForegroundColor BrightCyan
Write-Host "2. Whenever Laptop 2 powers on, it will boot directly into JASPER OS!" -ForegroundColor White
Write-Host ""
