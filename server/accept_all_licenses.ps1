[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'

$sdkDirs = @("C:\Users\Jwalant\android-sdk", "C:\Users\Jwalant\AppData\Local\Android\Sdk")

$hashes = @(
    "8933b68c94b465e6d9f14b381ee5d2db169609f4",
    "24333f8a637187a4116d4d7650e171947f7c319e",
    "d56f5185472316e6cff74a9d22022004654a4685",
    "33b6a2b64925b96274261bef51d461c958b4e5dd",
    "e9647835705077365151667b82970a0408413f4d",
    "6010077470f4b441c2336bc258b409180f71b76a",
    "84831b9409646a918e30573bab4c9c91346d8abd",
    "7a93465880308e1a17953258a1f6a01490cc1b79"
)

$content = ($hashes -join "`n") + "`n"

foreach ($sdkDir in $sdkDirs) {
    $licDir = Join-Path $sdkDir "licenses"
    if (-not (Test-Path $licDir)) {
        New-Item -ItemType Directory -Force -Path $licDir | Out-Null
    }
    
    $files = @("android-sdk-license", "android-sdk-preview-license", "android-googletv-license", "android-sys-image-license", "mips-android-sys-image-license", "google_cheets_license")
    foreach ($f in $files) {
        $p = Join-Path $licDir $f
        [System.IO.File]::WriteAllText($p, $content, [System.Text.Encoding]::ASCII)
    }
    Write-Host "[License Acceptor] Created all license files in: $licDir"
}
