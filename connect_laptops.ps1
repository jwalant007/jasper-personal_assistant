# ===============================================================================
# JWALANT BHATT CREATION - TWO-LAPTOP DIRECT CABLE CONNECT SCRIPT
# ===============================================================================

$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*", "Wi-Fi*" | Where-Object { $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress

if (-not $ip) {
    $ip = "localhost"
}

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "     ⚡ JWALANT BHATT CREATION - TWO-LAPTOP DIRECT CABLE BRIDGE ⚡" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💻 LAPTOP 1 (This Machine): Developer & AI Node" -ForegroundColor Yellow
Write-Host "   -> Making code edits, solving issues, and serving JASPER OS." -ForegroundColor White
Write-Host ""
Write-Host "🖥️ LAPTOP 2 (Target Machine): Operator JASPER OS Node" -ForegroundColor Green
Write-Host "   -> Connect Laptop 2 to Laptop 1 with an Ethernet Cable (or same Wi-Fi)." -ForegroundColor White
Write-Host "   -> Open Chrome on Laptop 2 and navigate to:" -ForegroundColor White
Write-Host ""
Write-Host "      👉 http://$($ip):5000" -ForegroundColor BrightCyan -NoNewline
Write-Host "   or   " -NoNewline
Write-Host "http://$($ip):5173" -ForegroundColor BrightCyan
Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "⚡ Real-Time Auto-Sync: Any code changes made on Laptop 1 instantly" -ForegroundColor Green
Write-Host "   update Laptop 2's screen in real-time without needing a restart!" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Cyan
