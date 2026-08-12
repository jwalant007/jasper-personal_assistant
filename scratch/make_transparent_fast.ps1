Add-Type -AssemblyName System.Drawing

$iconPath = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\electron\assets\icon.png"
$outputPath = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\electron\assets\icon_transparent.png"

$srcImg = [System.Drawing.Image]::FromFile($iconPath)
$width = $srcImg.Width
$height = $srcImg.Height

$dstImg = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($dstImg)

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Clear background to transparent (0, 0, 0, 0)
$g.Clear([System.Drawing.Color]::Transparent)

# Margin tight to the outer metallic edge (~12.8% margin on each side)
$margin = $width * 0.1285
$diameter = $width - (2 * $margin)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse([float]$margin, [float]$margin, [float]$diameter, [float]$diameter)

$g.SetClip($path)
$g.DrawImage($srcImg, 0, 0, $width, $height)

$path.Dispose()
$g.Dispose()
$srcImg.Dispose()

$dstImg.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dstImg.Dispose()

Write-Host "Updated transparent icon: $outputPath"
