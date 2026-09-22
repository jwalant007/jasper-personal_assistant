# ===============================================================================
# JWALANT BHATT CREATION - GLOBAL PUBLIC CLOUD TUNNEL LAUNCHER (SOLUTION 3)
# ===============================================================================

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "     ⚡ JWALANT BHATT CREATION - GLOBAL CLOUD TUNNEL FOR 4G / 5G ⚡" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[SYSTEM INFO] Creating secure public HTTPS Cloud Tunnel for port 5173..." -ForegroundColor Yellow
Write-Host "[SYSTEM INFO] This allows any mobile phone (on 4G/5G) or laptop anywhere in the world to access JASPER!" -ForegroundColor White
Write-Host ""

# Launch Cloudflare Quick Tunnel (Zero config, no password screen, high speed)
npx --yes cloudflared tunnel --url http://localhost:5173

