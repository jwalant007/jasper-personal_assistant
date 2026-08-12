# JASPER Background Wake-Word Listener
# Uses native Windows System.Speech.Recognition (runs 100% offline, 0 dependencies)

# Force console output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================================================="
Write-Host "         JASPER BACKGROUND VOICE ENGINE ACTIVATING..."
Write-Host "================================================================="

try {
    # Load the speech recognition assembly
    Add-Type -AssemblyName System.Speech
} catch {
    Write-Error "[FATAL] System.Speech assembly not available. Ensure Windows Speech features are installed."
    Exit 1
}

# Create the recognition engine
$Engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine

# Try connecting default audio input
try {
    $Engine.SetInputToDefaultAudioDevice()
} catch {
    Write-Warning "-------------------------------------------------------------"
    Write-Warning "[WARNING] No microphone or default audio input device found!"
    Write-Warning "Please connect a microphone for hands-free wake-up features."
    Write-Warning "-------------------------------------------------------------"
    
    # Wait for audio device to become available and retry
    while ($true) {
        Start-Sleep -Seconds 10
        try {
            $Engine.SetInputToDefaultAudioDevice()
            Write-Host "[SYSTEM] Microphone detected! Audio device initialized successfully."
            break
        } catch {}
    }
}

# Define the wake words. Include variations to handle natural pronunciations.
$WakeChoices = New-Object System.Speech.Recognition.Choices
$WakeChoices.Add("Hey Jasper")
$WakeChoices.Add("Jasper")

$GrammarBuilder = New-Object System.Speech.Recognition.GrammarBuilder
$GrammarBuilder.Append($WakeChoices)

$Grammar = New-Object System.Speech.Recognition.Grammar($GrammarBuilder)
$Engine.LoadGrammar($Grammar)

Write-Host "[SYSTEM] Wake-phrase loaded: 'Hey Jasper'"
Write-Host "[SYSTEM] Mode: ALWAYS ON / OFFLINE LISTENING..."
Write-Host "[SYSTEM] Standing by..."

while ($true) {
    try {
        # Synchronous recognition with timeout (blocks until audio heard or timeout)
        # We use a 30-second timeout so the script stays alive and doesn't freeze permanently
        $Result = $Engine.Recognize([TimeSpan]::FromSeconds(30))
        
        if ($Result) {
            $Text = $Result.Text
            $Confidence = $Result.Confidence
            
            Write-Host "[HEARD] '$Text' (Confidence: [$( [Math]::Round($Confidence, 2) )])"
            
            # 0.65 threshold works well for clear speech without too many false triggers
            if ($Confidence -ge 0.65) {
                Write-Host "[WAKE DETECTED] Activating JASPER system core..."
                
                # Send HTTP POST to the local Express server
                try {
                    $BodyObj = @{ source = "voice_background"; confidence = $Confidence }
                    $BodyJson = $BodyObj | ConvertTo-Json
                    
                    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/system/wake" -ContentType "application/json; charset=utf-8" -Body $BodyJson
                    Write-Host "[SUCCESS] Express server notified. Response: $($response | ConvertTo-Json -Compress)"
                } catch {
                    Write-Warning "[ERROR] Failed to send wake signal to Express server. Is server running on port 3001?"
                }
            }
        }
    } catch {
        Write-Warning "[ERROR] Exception during speech loop: $_"
        Start-Sleep -Seconds 2
    }
}
