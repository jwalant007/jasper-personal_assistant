param (
    [string]$TargetTitle = "Google Meet",
    [string]$ProcessName = "chrome"
)

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinUtil {
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);
}
"@

# Give the browser a moment to initialize if just launched
Start-Sleep -Milliseconds 600

$proc = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Sort-Object -Property StartTime -Descending | Select-Object -First 1

if (-not $proc) {
    # Fallback to any browser (msedge, firefox, brave)
    $proc = Get-Process -Name "msedge","brave","firefox" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Sort-Object -Property StartTime -Descending | Select-Object -First 1
}

if ($proc -and $proc.MainWindowHandle -ne [IntPtr]::Zero) {
    $hwnd = $proc.MainWindowHandle
    # 3 = SW_MAXIMIZE, 9 = SW_RESTORE
    [WinUtil]::ShowWindowAsync($hwnd, 3) | Out-Null
    [WinUtil]::SetForegroundWindow($hwnd) | Out-Null
    Write-Output "SUCCESS: Window focused for process $($proc.Name) (PID: $($proc.Id))"
} else {
    Write-Output "INFO: Target browser process handle not found or minimized"
}
