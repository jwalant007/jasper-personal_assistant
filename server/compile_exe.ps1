[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'
$rootDir = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant"
Set-Location $rootDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [JASPER EXE BUILDER] Packaging Windows Installer (.exe)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Stop any running Electron processes that lock electron.exe
Write-Host "[1/3] Terminating any active Electron dev processes..." -ForegroundColor Yellow
Stop-Process -Name electron -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$tempDist = "C:\Users\Jwalant\AppData\Local\Temp\jasper-electron-dist"
if (Test-Path $tempDist) {
    Remove-Item $tempDist -Recurse -Force -ErrorAction SilentlyContinue
}

# Run electron-builder
Write-Host "`n[2/3] Compiling Electron Package with NSIS Installer..." -ForegroundColor Yellow
& npx.cmd electron-builder --config.directories.output="$tempDist"
if ($LASTEXITCODE -ne 0) {
    throw "electron-builder failed with exit code $LASTEXITCODE"
}

# Copy output
Write-Host "`n[3/3] Copying generated Installer Executable..." -ForegroundColor Yellow
$searchDirs = @($tempDist, (Join-Path $rootDir "dist-electron"))
$latestExe = Get-ChildItem -Path $searchDirs -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestExe) {
    $dest1 = Join-Path $rootDir "server\downloads\JASPER_Assistant_Setup.exe"
    $dest2 = Join-Path $rootDir "dist-electron\$($latestExe.Name)"
    
    Copy-Item -Path $latestExe.FullName -Destination $dest1 -Force
    Copy-Item -Path $latestExe.FullName -Destination $dest2 -Force -ErrorAction SilentlyContinue
    
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host " [JASPER EXE BUILDER] SUCCESS! Windows Desktop EXE updated!" -ForegroundColor Green
    Write-Host "  - File: $dest1" -ForegroundColor Green
    Write-Host "  - Size: $([math]::Round($latestExe.Length / 1MB, 2)) MB" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    throw "No generated .exe was found in $tempDist"
}
