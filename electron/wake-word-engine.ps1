# JASPER Windows Native Always-On Wake Word Engine
# 100% Offline, Zero Cloud Dependencies, Zero Continuous Audio Streaming
param(
    [float]$ConfidenceThreshold = 0.65,
    [string]$MicDevice = "Default"
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-JsonEvent([hashtable]$data) {
    try {
        $json = ($data | ConvertTo-Json -Compress)
        [Console]::Out.WriteLine($json)
        [Console]::Out.Flush()
    } catch {}
}

# Load speech assembly
try {
    Add-Type -AssemblyName System.Speech
} catch {
    Write-JsonEvent @{ type = "ERROR"; message = "System.Speech assembly unavailable" }
    Exit 1
}

$Engine = $null
$isListening = $false
$currentThreshold = $ConfidenceThreshold

function Init-AudioDevice() {
    try {
        if ($Engine -eq $null) {
            $global:Engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
            
            # Build wake phrase choices
            $WakeChoices = New-Object System.Speech.Recognition.Choices
            $WakeChoices.Add("Hey Jasper")
            $WakeChoices.Add("Jasper")
            $WakeChoices.Add("Hey Jasper get ready for work")
            $WakeChoices.Add("Hey Jasper, get ready for work")
            
            $GrammarBuilder = New-Object System.Speech.Recognition.GrammarBuilder
            $GrammarBuilder.Append($WakeChoices)
            
            $Grammar = New-Object System.Speech.Recognition.Grammar($GrammarBuilder)
            $Engine.LoadGrammar($Grammar)
        }
        
        $Engine.SetInputToDefaultAudioDevice()
        $global:isListening = $true
        Write-JsonEvent @{
            type = "READY";
            device = "Default";
            threshold = $currentThreshold;
            recognizer = $Engine.RecognizerInfo.Name
        }
        return $true
    } catch {
        Write-JsonEvent @{ type = "WARNING"; message = "Audio input initialization failed: $_" }
        return $false
    }
}

function Mute-AudioDevice() {
    try {
        if ($Engine -ne $null) {
            # Releasing input device stops Windows mic recording indicator
            $Engine.SetInputToNull()
            $global:isListening = $false
            Write-JsonEvent @{ type = "MUTED"; listening = $false }
        }
    } catch {
        Write-JsonEvent @{ type = "ERROR"; message = "Failed to mute audio device: $_" }
    }
}

function Resume-AudioDevice() {
    try {
        if ($Engine -ne $null) {
            $Engine.SetInputToDefaultAudioDevice()
            $global:isListening = $true
            Write-JsonEvent @{ type = "RESUMED"; listening = $true }
        } else {
            Init-AudioDevice
        }
    } catch {
        Write-JsonEvent @{ type = "ERROR"; message = "Failed to resume audio device: $_" }
    }
}

# Start background thread to read commands from Stdin asynchronously
$StdinQueue = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()
$ThreadAction = [System.Threading.ParameterizedThreadStart]{
    param($queue)
    try {
        while ($true) {
            $line = [Console]::In.ReadLine()
            if ($line -eq $null) { break }
            $queue.Enqueue($line.Trim())
        }
    } catch {}
}
$ReaderThread = [System.Threading.Thread]::new($ThreadAction)
$ReaderThread.IsBackground = $true
$ReaderThread.Start($StdinQueue)

# Initial Audio setup
$initialized = Init-AudioDevice
if (-not $initialized) {
    # Keep retrying until audio device is plugged in
    while (-not $initialized) {
        Start-Sleep -Seconds 5
        $initialized = Init-AudioDevice
    }
}

# Main Recognition Loop
while ($true) {
    # Process any pending stdin commands
    $cmd = ""
    while ($StdinQueue.TryDequeue([ref]$cmd)) {
        if ($cmd -match "^PAUSE") {
            Mute-AudioDevice
        } elseif ($cmd -match "^RESUME") {
            Resume-AudioDevice
        } elseif ($cmd -match "^SET_THRESHOLD\s+([0-9.]+)") {
            $newVal = [float]$Matches[1]
            if ($newVal -gt 0 -and $newVal -le 1.0) {
                $currentThreshold = $newVal
                Write-JsonEvent @{ type = "THRESHOLD_UPDATED"; threshold = $currentThreshold }
            }
        } elseif ($cmd -match "^QUIT") {
            Write-JsonEvent @{ type = "SHUTTING_DOWN" }
            if ($Engine -ne $null) { $Engine.Dispose() }
            Exit 0
        }
    }

    if ($isListening) {
        try {
            # Synchronous recognition with short 2-second timeout so stdin remains responsive
            $Result = $Engine.Recognize([TimeSpan]::FromSeconds(2))
            if ($Result -ne $null) {
                $Text = $Result.Text
                $Confidence = [Math]::Round($Result.Confidence, 3)
                
                if ($Confidence -ge $currentThreshold) {
                    Write-JsonEvent @{
                        type = "WAKE";
                        phrase = $Text;
                        confidence = $Confidence;
                        timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    }
                } else {
                    Write-JsonEvent @{
                        type = "HEARD_SUBTHRESHOLD";
                        phrase = $Text;
                        confidence = $Confidence;
                        threshold = $currentThreshold
                    }
                }
            }
        } catch {
            if ($_.Exception.Message -match "No audio input") {
                Start-Sleep -Seconds 3
            } else {
                Start-Sleep -Milliseconds 250
            }
        }
    } else {
        # Muted / paused - sleep quietly with minimal CPU
        Start-Sleep -Milliseconds 500
    }
}
