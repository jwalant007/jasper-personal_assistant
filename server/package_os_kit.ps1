[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'

$rootDir = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant"
$downloadsDir = Join-Path $rootDir "server\downloads"
$targetZip = Join-Path $downloadsDir "JASPER_OS_Kit.zip"

Write-Host "[OS Kit Packager] Packaging latest batch files, PowerShell scripts & OS configuration..." -ForegroundColor Cyan

if (-not (Test-Path $downloadsDir)) {
    New-Item -ItemType Directory -Path $downloadsDir -Force | Out-Null
}

$tempDir = Join-Path $env:TEMP ("jasper_os_kit_" + [Guid]::NewGuid().ToString().Substring(0, 8))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # 1. Copy jasper-os directory if present
    $jasperOsDir = Join-Path $rootDir "jasper-os"
    if (Test-Path $jasperOsDir) {
        Copy-Item -Path "$jasperOsDir\*" -Destination $tempDir -Recurse -Force
    }

    # 2. Copy root batch and powershell scripts
    $rootFiles = @(
        "ENABLE_LAPTOP1_DUAL_BOOT.bat",
        "INSTALL_PRIMARY_OS_LAPTOP2.bat",
        "JASPER_BOOT_CHOOSER.bat",
        "JASPER_PORTABLE_KEY.bat",
        "JASPER_STANDALONE_OS.bat",
        "Launch_Telephony_Hub.bat",
        "start-jasper.bat",
        "start-satellite.bat",
        "build_jasper_linux_iso.ps1",
        "connect_laptops.ps1",
        "copy_to_pendrive.ps1",
        "prepare_transfer_package.ps1",
        "setup_laptop1_dual_boot.ps1",
        "setup_windows_kiosk_shell.ps1",
        "share_folder_for_laptop2.ps1",
        "start_global_tunnel.ps1",
        "DEPLOYMENT.md",
        "JASPER_ARCHITECTURE.md",
        "JASPER_SECURITY_MODEL.md"
    )

    foreach ($file in $rootFiles) {
        $sourcePath = Join-Path $rootDir $file
        if (Test-Path $sourcePath) {
            Copy-Item -Path $sourcePath -Destination $tempDir -Force
        }
    }

    # 3. Create fresh zip archive
    if (Test-Path $targetZip) {
        Remove-Item -Path $targetZip -Force
    }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $targetZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)
    
    $zipSize = (Get-Item $targetZip).Length
    $zipSizeFormatted = [math]::Round($zipSize / 1KB, 2)
    Write-Host "[OS Kit Packager] SUCCESS! Created $targetZip ($zipSizeFormatted KB)" -ForegroundColor Green
} finally {
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
