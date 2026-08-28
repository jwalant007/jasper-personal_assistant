# ===============================================================================
# JWALANT BHATT CREATION - LAPTOP 1 DUAL BOOT SETUP SCRIPT
# ===============================================================================

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "   ⚡ JWALANT BHATT CREATION - CONFIGURING DUAL BOOT FOR LAPTOP 1 ⚡" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$startupFolder = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$desktopFolder = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)

$sourceChooser = "$PSScriptRoot\JASPER_BOOT_CHOOSER.bat"
$targetStartup = Join-Path $startupFolder "JASPER_BOOT_CHOOSER.bat"

# Remove old standalone bat from startup if exists
$oldStartupBat = Join-Path $startupFolder "JASPER_STANDALONE_OS.bat"
if (Test-Path $oldStartupBat) {
    Remove-Item -Path $oldStartupBat -Force
}

# Copy Boot Chooser into Startup folder
Copy-Item -Path $sourceChooser -Destination $targetStartup -Force

Write-Host "✅ INSTALLED DUAL BOOT SELECTOR TO STARTUP: $targetStartup" -ForegroundColor Green
Write-Host ""
Write-Host "How Dual-Boot works on Laptop 1 when turning on:" -ForegroundColor Yellow
Write-Host "1. Whenever Laptop 1 turns on, a 5-second Boot Menu will pop up." -ForegroundColor White
Write-Host "2. Press [1] for JASPER OS or [2] for Standard Windows Desktop." -ForegroundColor White
Write-Host "3. If no key is pressed in 5 seconds, it automatically boots into JASPER OS!" -ForegroundColor White
Write-Host ""
Read-Host -Prompt "Press Enter to exit..."
