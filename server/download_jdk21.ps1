[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'

$destDir = "C:\Users\Jwalant\jdk21"
$zipPath = "C:\Users\Jwalant\jdk21.zip"

Write-Host "[JDK 21 Installer] Downloading portable Microsoft OpenJDK 21 (Full JDK)..."

if (-not (Test-Path $destDir)) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $client = New-Object System.Net.WebClient
    $client.DownloadFile("https://aka.ms/download-jdk/microsoft-jdk-21.0.2-windows-x64.zip", $zipPath)

    Write-Host "[JDK 21 Installer] Extracting OpenJDK 21 archive..."
    $tempExtract = "C:\Users\Jwalant\jdk21-temp"
    if (Test-Path $tempExtract) { Remove-Item -Recurse -Force $tempExtract }
    Expand-Archive -Path $zipPath -DestinationPath $tempExtract -Force
    Remove-Item -Force $zipPath

    $extractedJdk = Get-ChildItem -Path $tempExtract -Recurse -Filter "java.exe" | Select-Object -First 1
    if ($extractedJdk) {
        $jdkHome = $extractedJdk.Directory.Parent.FullName
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
        Copy-Item -Path "$jdkHome\*" -Destination $destDir -Recurse -Force
        Remove-Item -Recurse -Force $tempExtract
    }
}

$env:JAVA_HOME = $destDir
$env:ANDROID_HOME = "C:\Users\Jwalant\android-sdk"

Write-Host "[JDK 21 Installer] Using JAVA_HOME: $env:JAVA_HOME"
Write-Host "[JDK 21 Installer] Compiling native Android APK..."
Set-Location "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\client\android"
& ".\gradlew.bat" assembleDebug

Write-Host "[JDK 21 Installer] SUCCESS! Native Android APK compiled."
