# ===============================================================================
# JWALANT BHATT CREATION - AUTOMATED WINDOWS NETWORK FOLDER SHARING SCRIPT
# ===============================================================================

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "     ⚡ JWALANT BHATT CREATION - NETWORK FILE SHARING FOR LAPTOP 2 ⚡" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$folderToShare = "c:\Users\Jwalant\.gemini\antigravity\scratch\JASPER_OS_LAPTOP2_PACKAGE"
$shareName = "JASPER_OS_PACKAGE"

if (-not (Test-Path $folderToShare)) {
    Write-Host "Creating transfer package first..." -ForegroundColor Yellow
    powershell -ExecutionPolicy Bypass -File prepare_transfer_package.ps1
}

Write-Host "Sharing folder over local Wi-Fi for Laptop 2..." -ForegroundColor Yellow

try {
    # Remove existing share if any
    Remove-SmbShare -Name $shareName -Force -ErrorAction SilentlyContinue
    # Create new network share accessible by Everyone
    New-SmbShare -Name $shareName -Path $folderToShare -FullAccess "Everyone" -ErrorAction Stop | Out-Null
    Write-Host "✅ Network Share '$shareName' successfully created!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Share creation note: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "   ⚡ STEP-BY-STEP INSTRUCTIONS TO GET FILES ON LAPTOP 2 ⚡" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to Laptop 2." -ForegroundColor White
Write-Host "2. Press Win + R on Laptop 2's keyboard." -ForegroundColor White
Write-Host "3. Type this exact network path and press Enter:" -ForegroundColor White
Write-Host ""
Write-Host "      \\192.168.29.132\JASPER_OS_PACKAGE" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Copy all files to Laptop 2's Desktop!" -ForegroundColor White
Write-Host "5. Double-click 'JASPER_PORTABLE_KEY.bat' on Laptop 2 to launch JASPER OS!" -ForegroundColor White
Write-Host ""
