[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'

$rootDir = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant"
Set-Location $rootDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [JASPER BUILDER] Starting Full Automated Compilation" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Build Client Distribution Web Bundle
Write-Host "`n[1/3] Building React/Vite Client Web Assets..." -ForegroundColor Yellow
& npm run build:client

# 2. Build Android Debug APK & Deploy to Phone
Write-Host "`n[2/3] Compiling Native Android APK (JASPER_Assistant.apk)..." -ForegroundColor Yellow
$compileApkScript = Join-Path $rootDir "server\compile_apk.ps1"
if (Test-Path $compileApkScript) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $compileApkScript
} else {
    Write-Host "[Warning] compile_apk.ps1 script not found!" -ForegroundColor Red
}

# 3. Build Windows Electron Installer / Executable
Write-Host "`n[3/3] Packaging Windows Desktop Installer (.exe)..." -ForegroundColor Yellow
& npx electron-builder

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " [JASPER BUILDER] SUCCESS! Both APK & EXE files updated!" -ForegroundColor Green
Write-Host "  - APK: $rootDir\JASPER_Assistant.apk" -ForegroundColor Green
Write-Host "  - EXE: $rootDir\dist-electron\" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
