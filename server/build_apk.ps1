[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'

$jdkPath = "C:\Users\Jwalant\jdk17\jdk-17.0.10+7"
if (-not (Test-Path $jdkPath)) {
    $jdkPath = "C:\Users\Jwalant\.vscode\extensions\redhat.java-1.54.0-win32-x64\jre\21.0.10-win32-x86_64"
}

$env:JAVA_HOME = $jdkPath
Write-Host "[APK Builder] Using JAVA_HOME: $env:JAVA_HOME"

$androidDir = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\client\android"
Set-Location $androidDir

Write-Host "[APK Builder] Running Gradle assembleDebug..."
& ".\gradlew.bat" assembleDebug
