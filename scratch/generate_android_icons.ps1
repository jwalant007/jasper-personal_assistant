Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Jwalant\.gemini\antigravity-ide\brain\9a901639-f8da-4138-910c-5711633f44f2\jasper_app_icon_1785945766821.png"
if (-not (Test-Path $srcPath)) {
    $srcPath = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\electron\assets\icon.png"
}

Write-Host "Source image path: $srcPath"
$img = [System.Drawing.Image]::FromFile($srcPath)

$resDir = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\client\android\app\src\main\res"

$densities = @(
    @{ folder = "mipmap-mdpi"; size = 48 },
    @{ folder = "mipmap-hdpi"; size = 72 },
    @{ folder = "mipmap-xhdpi"; size = 96 },
    @{ folder = "mipmap-xxhdpi"; size = 144 },
    @{ folder = "mipmap-xxxhdpi"; size = 192 }
)

foreach ($d in $densities) {
    $dirPath = Join-Path $resDir $d.folder
    if (-not (Test-Path $dirPath)) {
        New-Item -ItemType Directory -Path $dirPath | Out-Null
    }

    $size = $d.size
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $g.DrawImage($img, 0, 0, $size, $size)
    $g.Dispose()

    # Save ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png
    $bmp.Save((Join-Path $dirPath "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $dirPath "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $dirPath "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Write-Host "Generated icon for $($d.folder) (${size}x${size})"
}

$img.Dispose()
Write-Host "Android launcher icons successfully generated!"
