# ===============================================================================
# JWALANT BHATT CREATION - AUTOMATED USB PENDRIVE TRANSFER SCRIPT
# ===============================================================================

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "         ⚡ JWALANT BHATT CREATION - PORTABLE USB TRANSFER TOOL ⚡" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detect Connected USB Drives
$usbDrives = Get-WmiObject Win32_Volume | Where-Object { $_.DriveType -eq 2 -and $_.DriveLetter }

if (-not $usbDrives) {
    Write-Host "❌ No USB Pendrive detected! Please plug in your USB pendrive and run this script again." -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual Transfer Steps:" -ForegroundColor Yellow
    Write-Host "1. Plug your USB Pendrive into your Windows PC." -ForegroundColor White
    Write-Host "2. Copy the folder: c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant to your Pendrive." -ForegroundColor White
    Write-Host "3. Open your Pendrive and double-click 'JASPER_PORTABLE_KEY.bat' to launch JASPER OS!" -ForegroundColor White
    Exit
}

Write-Host "Detected USB Drives:" -ForegroundColor Green
foreach ($drive in $usbDrives) {
    Write-Host "  - Drive $($drive.DriveLetter) ($($drive.Label)) [$([Math]::Round($_.Capacity/1GB, 2)) GB]" -ForegroundColor Yellow
}

$targetDrive = $usbDrives[0].DriveLetter
Write-Host ""
Write-Host "Targeting USB Drive: $targetDrive" -ForegroundColor Cyan

$sourcePath = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant"
$destinationPath = "$targetDrive\JASPER_OS_PORTABLE"

Write-Host "Copying JASPER OS files to $destinationPath..." -ForegroundColor Cyan

if (-not (Test-Path $destinationPath)) {
    New-Item -ItemType Directory -Path $destinationPath | Out-Null
}

# Robocopy essential project files
robocopy $sourcePath $destinationPath /E /XD node_modules .git /XF *.log /NJH /NJS /NDL /NC /NS

# Create Portable Key Marker file on USB Root
Set-Content -Path "$targetDrive\.jasper_security_key" -Value "JWALANT_BHATT_CREATION_SECURE_KEY_AUTHENTICATED"
Copy-Item -Path "$sourcePath\JASPER_PORTABLE_KEY.bat" -Destination "$targetDrive\JASPER_PORTABLE_KEY.bat" -Force

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "   ✅ SUCCESS! JASPER OS IS NOW STORED ON YOUR PENDRIVE ($targetDrive)" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "How to Use on Any Computer:" -ForegroundColor Yellow
Write-Host "1. Plug USB Pendrive ($targetDrive) into any Windows PC." -ForegroundColor White
Write-Host "2. Open the Pendrive in File Explorer." -ForegroundColor White
Write-Host "3. Double-click 'JASPER_PORTABLE_KEY.bat'." -ForegroundColor White
Write-Host "4. JASPER OS (JWALANT BHATT CREATION) will launch automatically in full screen!" -ForegroundColor White
Write-Host ""
