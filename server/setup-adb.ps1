# setup-adb.ps1
# Downloads and sets up Android Platform Tools (ADB)

$InstallDir = "$env:LOCALAPPDATA\Android"
$PlatformToolsPath = "$InstallDir\platform-tools"
$ZipFile = "$env:TEMP\platform-tools.zip"

Write-Host "Setting up ADB (Android Debug Bridge)..."

if (Test-Path "$PlatformToolsPath\adb.exe") {
    Write-Host "ADB is already installed at $PlatformToolsPath"
    Write-Host "Done."
    exit 0
}

if (!(Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
}

Write-Host "Downloading Android Platform Tools..."
Invoke-WebRequest -Uri "https://dl.google.com/android/repository/platform-tools-latest-windows.zip" -OutFile $ZipFile

Write-Host "Extracting to $InstallDir..."
Expand-Archive -Path $ZipFile -DestinationPath $InstallDir -Force

Remove-Item $ZipFile -Force

Write-Host "ADB installed successfully at $PlatformToolsPath\adb.exe"

# Add to PATH for the current user if not already there
$UserPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($UserPath -notmatch [regex]::Escape($PlatformToolsPath)) {
    Write-Host "Adding ADB to User PATH..."
    [Environment]::SetEnvironmentVariable("PATH", $UserPath + ";" + $PlatformToolsPath, "User")
}

Write-Host "Setup complete!"
