# ===============================================================================
# JWALANT BHATT CREATION - TRANSFER PACKAGE PREPARATION SCRIPT
# ===============================================================================

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "     ⚡ JWALANT BHATT CREATION - PREPARING TRANSFER PACKAGE FOR LAPTOP 2 ⚡" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$sourceDir = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant"
$packageDir = "c:\Users\Jwalant\.gemini\antigravity\scratch\JASPER_OS_LAPTOP2_PACKAGE"

Write-Host "Creating optimized transfer package at $packageDir..." -ForegroundColor Yellow

if (Test-Path $packageDir) {
    Remove-Item -Path $packageDir -Recurse -Force | Out-Null
}

New-Item -ItemType Directory -Path $packageDir | Out-Null

# Copy clean files excluding node_modules, dist-electron, android build, and .git for ultra-fast transfer
robocopy $sourceDir $packageDir /E /XD node_modules .git dist-electron build android /XF *.log /NJH /NJS /NDL /NC /NS

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "   ✅ TRANSFER PACKAGE READY AT: $packageDir" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Files Included in Package:" -ForegroundColor Yellow
Write-Host '  ⚡ INSTALL_PRIMARY_OS_LAPTOP2.bat' -ForegroundColor White
Write-Host '  ⚡ JASPER_PORTABLE_KEY.bat' -ForegroundColor White
Write-Host '  ⚡ JASPER_STANDALONE_OS.bat' -ForegroundColor White
Write-Host '  ⚡ setup_windows_kiosk_shell.ps1' -ForegroundColor White
Write-Host '  ⚡ connect_laptops.ps1' -ForegroundColor White
Write-Host ""
