[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'

$jdkPath = "C:\Users\Jwalant\jdk17\jdk-17.0.10+7"
if (-not (Test-Path $jdkPath)) {
    $jdkPath = "C:\Users\Jwalant\jdk21"
}

$env:JAVA_HOME = $jdkPath
$env:ANDROID_HOME = "C:\Users\Jwalant\android-sdk"

Write-Host "[APK Builder] Using JAVA_HOME: $env:JAVA_HOME"
Write-Host "[APK Builder] Building latest production Web bundle..."
Set-Location "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\client"
& npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    throw "Vite web build failed with exit code $LASTEXITCODE"
}

Write-Host "[APK Builder] Copying updated Web assets into Capacitor Android..."
& npx.cmd cap copy android

Write-Host "[APK Builder] Compiling native Android APK with explicit target :app:assembleDebug..."
Set-Location "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\client\android"
& ".\gradlew.bat" :app:assembleDebug
if ($LASTEXITCODE -ne 0) {
    throw "Gradle build failed with exit code $LASTEXITCODE"
}

$apkFile = Get-ChildItem -Path "app\build\outputs" -Recurse -Filter "*.apk" | Select-Object -First 1
if ($apkFile) {
    Write-Host "[APK Builder] SUCCESS! Generated APK at: $($apkFile.FullName)"
    $rootDest = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\JASPER_Assistant.apk"
    $downloadsDest = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\server\downloads\JASPER_Assistant.apk"
    
    Copy-Item -Path $apkFile.FullName -Destination $rootDest -Force
    Write-Host "[APK Builder] Copied updated APK to project root: $rootDest"
    
    if (-not (Test-Path "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\server\downloads")) {
        New-Item -ItemType Directory -Path "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\server\downloads" -Force | Out-Null
    }
    Copy-Item -Path $apkFile.FullName -Destination $downloadsDest -Force
    Write-Host "[APK Builder] Copied updated APK to server distribution: $downloadsDest"
    
    $adbPath = "C:\Users\Jwalant\AppData\Local\Android\platform-tools\adb.exe"
    if (-not (Test-Path $adbPath)) {
        $adbCmd = Get-Command adb -ErrorAction SilentlyContinue
        if ($adbCmd) { $adbPath = $adbCmd.Source }
    }
    
    if ($adbPath -and (Test-Path $adbPath)) {
        Write-Host "[APK Builder] Checking connected ADB devices..."
        try {
            & $adbPath devices
            Write-Host "[APK Builder] Installing updated APK to connected Android device..."
            & $adbPath install -r $rootDest
            Write-Host "[APK Builder] SUCCESS! Updated APK automatically installed on your phone!"
        } catch {
            Write-Host "[APK Builder] Phone ADB install notice: $($_.Exception.Message)"
        }
    }
} else {
    Write-Host "[APK Builder] Finished build task."
}
