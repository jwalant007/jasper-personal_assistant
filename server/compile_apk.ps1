[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'

$env:JAVA_HOME = "C:\Users\Jwalant\jdk21"
$env:ANDROID_HOME = "C:\Users\Jwalant\android-sdk"

Write-Host "[APK Builder] Compiling native Android APK with explicit target :app:assembleDebug..."
Set-Location "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\client\android"
& ".\gradlew.bat" :app:assembleDebug

$apkFile = Get-ChildItem -Path "app\build\outputs" -Recurse -Filter "*.apk" | Select-Object -First 1
if ($apkFile) {
    Write-Host "[APK Builder] SUCCESS! Generated APK at: $($apkFile.FullName)"
} else {
    Write-Host "[APK Builder] Finished build task."
}
