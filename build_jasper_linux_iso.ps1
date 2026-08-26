# ===============================================================================
# JWALANT BHATT CREATION - STANDALONE LINUX ISO BUILDER SCRIPT
# ===============================================================================

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "     ⚡ JWALANT BHATT CREATION - BUILDING JASPER OS LINUX EDITION ⚡" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$isoDir = "c:\Users\Jwalant\.gemini\antigravity\scratch\JASPER_OS_LINUX_BUILD"

Write-Host "Creating Linux OS distribution package at $isoDir..." -ForegroundColor Yellow

if (Test-Path $isoDir) {
    Remove-Item -Path $isoDir -Recurse -Force | Out-Null
}

New-Item -ItemType Directory -Path $isoDir | Out-Null

$sourceDir = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant"

# Copy clean source files including linux installer
robocopy $sourceDir $isoDir /E /XD node_modules .git dist-electron build android /XF *.log /NJH /NJS /NDL /NC /NS

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "   ✅ SUCCESS! JASPER OS LINUX EDITION PACKAGE GENERATED" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $isoDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "How to Install on Any Linux PC (Ubuntu / Debian / Raspberry Pi):" -ForegroundColor White
Write-Host "1. Copy $isoDir to target Linux machine." -ForegroundColor White
Write-Host "2. Run: sudo bash linux_installer/setup_linux_node.sh" -ForegroundColor White
Write-Host "3. The machine will reboot directly into JASPER OS!" -ForegroundColor White
Write-Host ""
