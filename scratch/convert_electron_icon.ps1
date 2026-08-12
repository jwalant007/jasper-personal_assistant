Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\electron\assets\icon.png"
$electronAssets = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\electron\assets"

if (-not (Test-Path $electronAssets)) {
    New-Item -ItemType Directory -Path $electronAssets | Out-Null
}

$pngDest = Join-Path $electronAssets "icon.png"
$icoDest = Join-Path $electronAssets "icon.ico"

if ($srcPath -ne $pngDest) {
    Copy-Item $srcPath -Destination $pngDest -Force
    Write-Host "Updated electron/assets/icon.png"
}

# Convert PNG to high-res ICO for Windows application & NSIS installer
$img = [System.Drawing.Image]::FromFile($srcPath)
$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$g.DrawImage($img, 0, 0, $size, $size)
$g.Dispose()

# Create .ico file header and data
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()
$ms.Dispose()
$bmp.Dispose()
$img.Dispose()

$fs = [System.IO.File]::Create($icoDest)
$bw = New-Object System.IO.BinaryWriter($fs)

# ICONDIR header: Reserved (2 bytes), Type 1=Icon (2 bytes), Count 1 (2 bytes)
$bw.Write([uint16]0)
$bw.Write([uint16]1)
$bw.Write([uint16]1)

# ICONDIRENTRY entry
$bw.Write([byte]0) # 0 means 256px
$bw.Write([byte]0) # 0 means 256px
$bw.Write([byte]0) # Color count
$bw.Write([byte]0) # Reserved
$bw.Write([uint16]1) # Color planes
$bw.Write([uint16]32) # Bits per pixel
$bw.Write([uint32]$pngBytes.Length) # Image data size
$bw.Write([uint32]22) # Offset of image data (6 header + 16 entry = 22)

# Image data (PNG format embedded in ICO container)
$bw.Write($pngBytes)

$bw.Close()
$fs.Close()

Write-Host "Successfully generated high-res Windows icon at: $icoDest"
