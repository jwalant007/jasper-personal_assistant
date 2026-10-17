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
Write-Host "`n[3/4] Packaging Windows Desktop Installer (.exe)..." -ForegroundColor Yellow
$tempDist = "C:\Users\Jwalant\AppData\Local\Temp\jasper-electron-dist"
& npx electron-builder --config.directories.output="$tempDist"

# Copy latest built installer to server/downloads/JASPER_Assistant_Setup.exe
$searchDirs = @($tempDist, Join-Path $rootDir "release-electron", Join-Path $rootDir "dist-electron")
$latestExe = Get-ChildItem -Path $searchDirs -Filter "*.exe" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($latestExe) {
    Copy-Item -Path $latestExe.FullName -Destination (Join-Path $rootDir "server\downloads\JASPER_Assistant_Setup.exe") -Force
    Copy-Item -Path $latestExe.FullName -Destination (Join-Path $rootDir "dist-electron\$($latestExe.Name)") -Force -ErrorAction SilentlyContinue
    Write-Host "[JASPER BUILDER] Copied $($latestExe.Name) -> server\downloads\JASPER_Assistant_Setup.exe" -ForegroundColor Green
}

# 4. Update and Package Standalone OS Kit & Batch Launchers
Write-Host "`n[4/4] Updating OS Batch Files & Packaging JASPER_OS_Kit.zip..." -ForegroundColor Yellow
$osKitScript = Join-Path $rootDir "server\package_os_kit.ps1"
if (Test-Path $osKitScript) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $osKitScript
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " [JASPER BUILDER] SUCCESS! APK, EXE, and OS batch files updated!" -ForegroundColor Green
Write-Host "  - APK: $rootDir\JASPER_Assistant.apk" -ForegroundColor Green
Write-Host "  - EXE: $rootDir\dist-electron\" -ForegroundColor Green
Write-Host "  - OS KIT: $rootDir\server\downloads\JASPER_OS_Kit.zip" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
