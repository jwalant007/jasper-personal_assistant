const { exec } = require('child_process');

const script = `
Add-Type -AssemblyName System.Drawing;
Add-Type -AssemblyName System.Windows.Forms;

$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
$bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height);
$graphics = [System.Drawing.Graphics]::FromImage($bitmap);
$graphics.CopyFromScreen($screen.X, $screen.Y, 0, 0, $screen.Size);

$ms = New-Object System.IO.MemoryStream;
$bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg);
$bytes = $ms.ToArray();
$base64 = [Convert]::ToBase64String($bytes);

$graphics.Dispose();
$bitmap.Dispose();
$ms.Dispose();

[Console]::Out.Write('DATA_START:' + $base64 + ':DATA_END');
`;

const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/\r?\n/g, ' ')}"`;

exec(psCommand, { maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
  if (err) {
    console.error('PS Error:', err);
    console.error('Stderr:', stderr);
    return;
  }
  const match = stdout.match(/DATA_START:([\s\S]*?):DATA_END/);
  console.log('Match found:', !!match);
  if (match) {
    console.log('Base64 length:', match[1].length);
  }
});
