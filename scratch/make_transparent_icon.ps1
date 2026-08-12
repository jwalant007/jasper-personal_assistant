Add-Type -AssemblyName System.Drawing

$iconPath = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\electron\assets\icon.png"
$outputPath = "c:\Users\Jwalant\.gemini\antigravity\scratch\jasper-assistant\electron\assets\icon_transparent.png"

$srcImg = [System.Drawing.Bitmap]::FromFile($iconPath)
$width = $srcImg.Width
$height = $srcImg.Height

Write-Host "Image size: ${width}x${height}"

$dstImg = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$cx = $width / 2.0
$cy = $height / 2.0

# Define radius of outer metallic boundary of Arc Reactor
# The circular symbol spans roughly 80-84% of total width
$rOuter = ($width / 2.0) * 0.830
$rFeather = ($width / 2.0) * 0.845

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $dx = $x - $cx
        $dy = $y - $cy
        $dist = [Math]::Sqrt($dx * $dx + $dy * $dy)

        $pixel = $srcImg.GetPixel($x, $y)

        if ($dist -gt $rFeather) {
            # Fully transparent outside
            $dstImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($dist -gt $rOuter) {
            # Feathered smooth alpha transition at the boundary
            $factor = 1.0 - (($dist - $rOuter) / ($rFeather - $rOuter))
            $alpha = [int]($pixel.A * $factor)
            $dstImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
        } else {
            # Keep original pixel inside circle
            $dstImg.SetPixel($x, $y, $pixel)
        }
    }
}

$srcImg.Dispose()

$dstImg.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dstImg.Dispose()

Write-Host "Saved transparent icon to: $outputPath"
