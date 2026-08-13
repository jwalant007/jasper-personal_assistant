[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'

$jdkPath = "C:\Users\Jwalant\jdk17\jdk-17.0.10+7"
if (-not (Test-Path $jdkPath)) {
    $jdkPath = "C:\Users\Jwalant\.vscode\extensions\redhat.java-1.54.0-win32-x64\jre\21.0.10-win32-x86_64"
}

$env:JAVA_HOME = $jdkPath
$env:ANDROID_HOME = "C:\Users\Jwalant\android-sdk"

Write-Host "[APK Builder] Using JAVA_HOME: $env:JAVA_HOME"
Write-Host "[APK Builder] Compiling native Android APK with explicit target :app:assembleDebug..."
Set-Location "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\client\android"
& ".\gradlew.bat" :app:assembleDebug

$apkFile = Get-ChildItem -Path "app\build\outputs" -Recurse -Filter "*.apk" | Select-Object -First 1
if ($apkFile) {
    Write-Host "[APK Builder] SUCCESS! Generated APK at: $($apkFile.FullName)"
    Copy-Item -Path $apkFile.FullName -Destination "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\JASPER_Assistant.apk" -Force
    Write-Host "[APK Builder] Copied updated APK to project root: JASPER_Assistant.apk"
} else {
    Write-Host "[APK Builder] Finished build task."
}
