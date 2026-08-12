[cmdletbinding()]
param()

$ErrorActionPreference = 'Stop'

try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime

    $asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
        $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    } | Select-Object -First 1

    function Await-Async($asyncOp) {
        if (-not $asyncOp) { return $null }
        $typeArg = $asyncOp.GetType().GetInterface('Windows.Foundation.IAsyncOperation`1').GetGenericArguments()[0]
        $closedMethod = $asTaskGeneric.MakeGenericMethod($typeArg)
        $task = $closedMethod.Invoke($null, @($asyncOp))
        $task.Wait()
        return $task.Result
    }

    $asyncMgr = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync()
    $mgr = Await-Async $asyncMgr

    $session = $mgr.GetCurrentSession()
    if (-not $session) {
        $sessions = $mgr.GetSessions()
        if ($sessions -and $sessions.Count -gt 0) {
            foreach ($s in $sessions) {
                $pb = $s.GetPlaybackInfo()
                if ($pb -and $pb.PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing) {
                    $session = $s
                    break
                }
            }
            if (-not $session) {
                $session = $sessions[0]
            }
        }
    }

    if ($session) {
        $propsAsync = $session.TryGetMediaPropertiesAsync()
        $props = Await-Async $propsAsync

        $playbackInfo = $session.GetPlaybackInfo()
        $status = if ($playbackInfo) { $playbackInfo.PlaybackStatus.ToString() } else { "Unknown" }

        $timeline = $session.GetTimelineProperties()
        $durationMs = if ($timeline -and $timeline.EndTime) { [long]$timeline.EndTime.TotalMilliseconds } else { 0 }
        $positionMs = if ($timeline -and $timeline.Position) { [long]$timeline.Position.TotalMilliseconds } else { 0 }

        $appId = $session.SourceAppUserModelId
        
        $title = $props.Title
        $artist = $props.Artist
        $album = $props.AlbumTitle

        if (-not $title) {
            $spotifyProc = Get-Process spotify -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle -ne "Spotify" -and $_.MainWindowTitle -ne "Spotify Free" -and $_.MainWindowTitle -ne "Spotify Premium" } | Select-Object -First 1
            if ($spotifyProc) {
                $parts = $spotifyProc.MainWindowTitle -split ' - ', 2
                if ($parts.Count -eq 2) {
                    $artist = $parts[0]
                    $title = $parts[1]
                } else {
                    $title = $spotifyProc.MainWindowTitle
                }
            }
        }

        $result = [PSCustomObject]@{
            success = $true
            isPlaying = ($status -eq "Playing")
            status = $status
            app = $appId
            title = $title
            artist = $artist
            album = $album
            durationMs = $durationMs
            positionMs = $positionMs
        }
        $result | ConvertTo-Json -Compress
    } else {
        $spotifyProc = Get-Process spotify -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle -ne "Spotify" -and $_.MainWindowTitle -ne "Spotify Free" -and $_.MainWindowTitle -ne "Spotify Premium" } | Select-Object -First 1
        if ($spotifyProc) {
            $parts = $spotifyProc.MainWindowTitle -split ' - ', 2
            $artist = if ($parts.Count -eq 2) { $parts[0] } else { "Spotify" }
            $title = if ($parts.Count -eq 2) { $parts[1] } else { $spotifyProc.MainWindowTitle }
            
            [PSCustomObject]@{
                success = $true
                isPlaying = $true
                status = "Playing"
                app = "Spotify"
                title = $title
                artist = $artist
                album = ""
                durationMs = 0
                positionMs = 0
            } | ConvertTo-Json -Compress
        } else {
            [PSCustomObject]@{ success = $true; isPlaying = $false; title = ""; artist = "" } | ConvertTo-Json -Compress
        }
    }
} catch {
    $spotifyProc = Get-Process spotify -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle -ne "Spotify" -and $_.MainWindowTitle -ne "Spotify Free" -and $_.MainWindowTitle -ne "Spotify Premium" } | Select-Object -First 1
    if ($spotifyProc) {
        $parts = $spotifyProc.MainWindowTitle -split ' - ', 2
        $artist = if ($parts.Count -eq 2) { $parts[0] } else { "Spotify" }
        $title = if ($parts.Count -eq 2) { $parts[1] } else { $spotifyProc.MainWindowTitle }
        
        [PSCustomObject]@{
            success = $true
            isPlaying = $true
            status = "Playing"
            app = "Spotify"
            title = $title
            artist = $artist
            album = ""
            durationMs = 0
            positionMs = 0
        } | ConvertTo-Json -Compress
    } else {
        [PSCustomObject]@{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
    }
}
