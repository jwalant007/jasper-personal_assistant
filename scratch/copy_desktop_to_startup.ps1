$startup = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)

Write-Host "Desktop Path: $desktop"
Write-Host "Startup Path: $startup"

$desktopItems = Get-ChildItem -Path $desktop | Where-Object { $_.Name -like "*jasper*" -or $_.Name -like "*JASPER*" }

foreach ($item in $desktopItems) {
    Write-Host "Found Desktop item: $($item.FullName)"
    # Copy shortcut or file from Desktop to Startup folder
    Copy-Item -Path $item.FullName -Destination $startup -Recurse -Force
    Write-Host "✅ Copied $($item.Name) from Desktop to Startup folder!"
}

# Also ensure JASPER_STANDALONE_OS.bat is copied to Startup
$kioskBat = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\JASPER_STANDALONE_OS.bat"
Copy-Item -Path $kioskBat -Destination "$startup\JASPER_STANDALONE_OS.bat" -Force
Write-Host "✅ Copied JASPER_STANDALONE_OS.bat to Startup folder!"
