[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'

$sdkRoot = "C:\Users\Jwalant\android-sdk"
$toolsDir = Join-Path $sdkRoot "cmdline-tools\latest"
$sdkManager = Join-Path $toolsDir "bin\sdkmanager.bat"
$jdkPath = "C:\Users\Jwalant\jdk17\jdk-17.0.10+7"
$env:JAVA_HOME = $jdkPath

Write-Host "[License Acceptor] Running sdkmanager --licenses..."

$pinfo = New-Object System.Diagnostics.ProcessStartInfo
$pinfo.FileName = $sdkManager
$pinfo.Arguments = "--sdk_root=`"$sdkRoot`" --licenses"
$pinfo.UseShellExecute = $false
$pinfo.RedirectStandardInput = $true
$pinfo.RedirectStandardOutput = $true
$pinfo.RedirectStandardError = $true
$pinfo.CreateNoWindow = $true

$pinfo.EnvironmentVariables["JAVA_HOME"] = $jdkPath

$process = [System.Diagnostics.Process]::Start($pinfo)

$writer = $process.StandardInput

for ($i = 0; $i -lt 50; $i++) {
    Start-Sleep -Milliseconds 200
    $writer.WriteLine("y")
}
$writer.Flush()
$writer.Close()

$stdout = $process.StandardOutput.ReadToEnd()
$process.WaitForExit()

Write-Host "[License Acceptor] Output:"
Write-Host $stdout
