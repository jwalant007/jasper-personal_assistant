$adb = "C:\Users\Jwalant\AppData\Local\Android\platform-tools\adb.exe"
Write-Host "1. Starting ADB daemon..."
& $adb start-server
Start-Sleep -Milliseconds 500

Write-Host "2. Attempting adb pair 192.168.29.159:34437 968017..."
$proc = Start-Process -FilePath $adb -ArgumentList "pair", "192.168.29.159:34437", "968017" -NoNewWindow -PassThru -Wait
Write-Host "Pair exit code: $($proc.ExitCode)"

Write-Host "3. Checking adb devices..."
& $adb devices
