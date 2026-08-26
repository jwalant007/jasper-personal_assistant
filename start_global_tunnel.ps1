# ===============================================================================
# JWALANT BHATT CREATION - GLOBAL PUBLIC CLOUD TUNNEL LAUNCHER (SOLUTION 3)
# ===============================================================================

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "     ⚡ JWALANT BHATT CREATION - GLOBAL CLOUD TUNNEL FOR 4G / 5G ⚡" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[SYSTEM INFO] Creating secure public HTTPS Cloud Tunnel for port 5173..." -ForegroundColor Yellow
Write-Host "[SYSTEM INFO] This allows Laptop 2 (on 4G) or any device anywhere to access JASPER OS!" -ForegroundColor White
Write-Host ""

# Launch LocalTunnel via npx
npx --yes localtunnel --port 5173
