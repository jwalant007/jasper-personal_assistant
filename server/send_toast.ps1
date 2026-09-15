param(
    [string]$Title = "🚨 JASPER EMERGENCY ALERT",
    [string]$Message = "Emergency keyword detected in incoming message!",
    [switch]$PlaySound
)

# 1. Play audible sound alert
try {
    [System.Media.SystemSounds]::Hand.Play()
} catch {}

# 2. Native Windows 10/11 Toast Notification via WinRT
$toastSent = $false
try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
    $toastXml = [xml]$template.GetXml()
    $textNodes = $toastXml.GetElementsByTagName("text")
    $textNodes[0].InnerText = $Title
    $textNodes[1].InnerText = $Message

    $xmlDoc = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]::new()
    $xmlDoc.LoadXml($toastXml.OuterXml)

    $toast = [Windows.UI.Notifications.ToastNotification]::new($xmlDoc)
    $toast.Priority = [Windows.UI.Notifications.ToastNotificationPriority]::High

    $appId = "{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe"
    $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId)
    $notifier.Show($toast)
    $toastSent = $true
    Write-Output "WinRT Toast sent successfully"
} catch {
    Write-Output "WinRT Toast failed: $($_.Exception.Message)"
}

# 3. Fallback: Balloon Tip if WinRT failed
if (-not $toastSent) {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        $notify = New-Object System.Windows.Forms.NotifyIcon
        $notify.Icon = [System.Drawing.SystemIcons]::Warning
        $notify.BalloonTipTitle = $Title
        $notify.BalloonTipText = $Message
        $notify.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Error
        $notify.Visible = $true
        $notify.ShowBalloonTip(10000)
        Start-Sleep -Seconds 1
        $notify.Dispose()
        Write-Output "Balloon Tip notification sent"
    } catch {
        Write-Output "Balloon Tip failed: $($_.Exception.Message)"
    }
}
