[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'

$destDir = "C:\Users\Jwalant\jdk17"
$zipPath = "C:\Users\Jwalant\jdk17.zip"

Write-Host "[JDK 17 Installer] Downloading portable Microsoft OpenJDK 17..."

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$client = New-Object System.Net.WebClient
$client.DownloadFile("https://aka.ms/download-jdk/microsoft-jdk-17.0.10-windows-x64.zip", $zipPath)

Write-Host "[JDK 17 Installer] Extracting OpenJDK 17 archive..."
if (Test-Path $destDir) { Remove-Item -Recurse -Force $destDir }
Expand-Archive -Path $zipPath -DestinationPath $destDir -Force
Remove-Item -Force $zipPath

$javaExe = Get-ChildItem -Path $destDir -Recurse -Filter "java.exe" | Select-Object -First 1
if ($javaExe) {
    $javaHome = $javaExe.Directory.Parent.FullName
    Write-Host "[JDK 17 Installer] OpenJDK 17 ready at: $javaHome"
    return $javaHome
} else {
    throw "Java 17 executable not found after extraction"
}
