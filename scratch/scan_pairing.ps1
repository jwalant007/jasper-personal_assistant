$ips = @('192.168.29.130', '192.168.29.159', '192.168.29.229')
$code = '305724'

foreach ($ip in $ips) {
    Write-Host "Scanning $ip ..."
    # Scan common range of pairing ports
    for ($p = 30000; $p -le 49999; $p += 1) {
        $t = New-Object System.Net.Sockets.TcpClient
        try {
            $async = $t.ConnectAsync($ip, $p)
            if ($async.Wait(15) -and $t.Connected) {
                Write-Host "Found open port $p on $ip! Attempting adb pair..."
                $out = adb pair "${ip}:${p}" $code 2>&1
                Write-Host "ADB PAIR RESULT: $out"
            }
        } catch {} finally {
            $t.Dispose()
        }
    }
}
