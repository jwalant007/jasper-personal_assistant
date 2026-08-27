$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut("C:\Users\Jwalant\Desktop\JASPER Assistant.lnk")
Write-Host "Shortcut TargetPath: $($sc.TargetPath)"
Write-Host "Shortcut Arguments: $($sc.Arguments)"
Write-Host "Shortcut WorkingDir: $($sc.WorkingDirectory)"
