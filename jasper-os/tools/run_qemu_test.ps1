# ==============================================================================
# Jasper OS — Safe QEMU VM Test Harness
# Boots the Jasper OS Live ISO in an isolated virtual machine
# ==============================================================================
param (
    [string]$IsoPath = "$PSScriptRoot\..\output\jasper-os-live-amd64.iso",
    [int]$MemoryMB = 4096,
    [int]$Cores = 4
)

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   ⚡ JASPER OS — SAFE VIRTUAL MACHINE TEST HARNESS ⚡" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $IsoPath)) {
    Write-Host "⚠️ Warning: ISO image not found at '$IsoPath'." -ForegroundColor Yellow
    Write-Host "To build the ISO, run 'tools/build_live_iso.sh' in WSL or Linux environment." -ForegroundColor White
    Write-Host ""
}

# Check if QEMU is installed on the host
$qemuCmd = Get-Command "qemu-system-x86_64" -ErrorAction SilentlyContinue

if (-not $qemuCmd) {
    Write-Host "ℹ️ QEMU is not currently installed in PATH." -ForegroundColor Yellow
    Write-Host "You can install QEMU via winget:" -ForegroundColor White
    Write-Host "  winget install SoftwareFreedomConservancy.QEMU" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Alternatively, you can test the ISO using VirtualBox or VMware Workstation Player." -ForegroundColor White
    exit 0
}

Write-Host "Starting QEMU VM with:" -ForegroundColor Green
Write-Host "  - ISO: $IsoPath" -ForegroundColor White
Write-Host "  - Cores: $Cores" -ForegroundColor White
Write-Host "  - Memory: ${MemoryMB}MB" -ForegroundColor White
Write-Host "  - Display: Standard VGA (Safe Framebuffer)" -ForegroundColor White
Write-Host ""

& qemu-system-x86_64 `
    -m "${MemoryMB}M" `
    -smp $Cores `
    -cdrom $IsoPath `
    -boot d `
    -vga std `
    -net nic -net user
