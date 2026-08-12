[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'

$sdkRoot = "C:\Users\Jwalant\android-sdk"
$zipPath = "C:\Users\Jwalant\cmdline-tools.zip"
$toolsDir = Join-Path $sdkRoot "cmdline-tools\latest"

Write-Host "[Android SDK Setup] Step 1: Checking Google Android Command Line Tools..."

if (-not (Test-Path $toolsDir)) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $client = New-Object System.Net.WebClient
    $client.DownloadFile("https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip", $zipPath)

    Write-Host "[Android SDK Setup] Extracting Command Line Tools..."
    $tempExtract = "C:\Users\Jwalant\cmdline-temp"
    if (Test-Path $tempExtract) { Remove-Item -Recurse -Force $tempExtract }
    Expand-Archive -Path $zipPath -DestinationPath $tempExtract -Force
    Remove-Item -Force $zipPath

    New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
    Copy-Item -Path "$tempExtract\cmdline-tools\*" -Destination $toolsDir -Recurse -Force
    Remove-Item -Recurse -Force $tempExtract
}

Write-Host "[Android SDK Setup] Step 2: Pre-accepting SDK Licenses..."
$sdkManager = Join-Path $toolsDir "bin\sdkmanager.bat"
$jdkPath = "C:\Users\Jwalant\jdk17\jdk-17.0.10+7"
$env:JAVA_HOME = $jdkPath

$licensesDir = Join-Path $sdkRoot "licenses"
New-Item -ItemType Directory -Force -Path $licensesDir | Out-Null

$licHash1 = "24333f8a637187a4116d4d7650e171947f7c319e`n8933b68c94b465e6d9f14b381ee5d2db169609f4`nd56f5185472316e6cff74a9d22022004654a4685`n33b6a2b64925b96274261bef51d461c958b4e5dd"
Set-Content -Path (Join-Path $licensesDir "android-sdk-license") -Value $licHash1
Set-Content -Path (Join-Path $licensesDir "android-sdk-preview-license") -Value "84831b9409646a918e30573bab4c9c91346d8abd"
Set-Content -Path (Join-Path $licensesDir "intel-android-sys-image-license") -Value "d9758657028a404956806b2b6464383fdb28de5e"

Write-Host "[Android SDK Setup] Step 3: Installing Android SDK Platform 34 & Build-Tools..."
cmd.exe /c "(for /l %i in (1,1,30) do @echo y) | `"$sdkManager`" --sdk_root=`"$sdkRoot`" `"platforms;android-34`" `"build-tools;34.0.0`" `"platform-tools`""

Write-Host "[Android SDK Setup] Step 4: Writing local.properties file..."
$localProps = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\client\android\local.properties"
$sdkPathEscaped = $sdkRoot.Replace("\", "\\")
Set-Content -Path $localProps -Value "sdk.dir=$sdkPathEscaped"

Write-Host "[Android SDK Setup] Step 5: Compiling native Android APK..."
Set-Location "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\client\android"
& ".\gradlew.bat" assembleDebug

Write-Host "[Android SDK Setup] SUCCESS! APK compiled successfully."
