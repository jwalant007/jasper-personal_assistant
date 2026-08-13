const net = require('net');
const http = require('http');
const https = require('https');

const tvIps = ['192.168.29.229', '192.168.29.228'];

async function testIpPort(ip, port) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(1000);
    s.on('connect', () => { s.destroy(); resolve(true); });
    s.on('error', () => resolve(false));
    s.on('timeout', () => { s.destroy(); resolve(false); });
    s.connect(port, ip);
  });
}

async function runDiagnostics() {
  console.log('=== SAMSUNG TV DEEP NETWORK DIAGNOSTICS ===');

  for (const ip of tvIps) {
    console.log(`\nTesting TV IP: ${ip}`);
    for (const port of [8001, 8002, 55000, 9197, 52235]) {
      const open = await testIpPort(ip, port);
      console.log(`  Port ${port}: ${open ? '✅ OPEN' : '❌ CLOSED/TIMEOUT'}`);
    }

    // Try UPnP RenderingControl SOAP
    try {
      const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:SetVolume xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">
<InstanceID>0</InstanceID>
<Channel>Master</Channel>
<DesiredVolume>50</DesiredVolume>
</u:SetVolume>
</s:Body>
</s:Envelope>`;

      const req = http.request({
        hostname: ip,
        port: 8001,
        path: '/upnp/control/RenderingControl1',
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset="utf-8"',
          'SOAPACTION': '"urn:schemas-upnp-org:service:RenderingControl:1#SetVolume"',
          'Content-Length': Buffer.byteLength(soapBody)
        },
        timeout: 1500
      }, (res) => {
        console.log(`  UPnP SOAP Response Status (${ip}): ${res.statusCode}`);
      });
      req.on('error', (e) => console.log(`  UPnP SOAP Error (${ip}): ${e.message}`));
      req.write(soapBody);
      req.end();
    } catch (e) {}

    // Try Tizen v2 REST API info
    try {
      http.get(`http://${ip}:8001/api/v2/`, { timeout: 1500 }, (res) => {
        let raw = '';
        res.on('data', d => raw += d);
        res.on('end', () => console.log(`  Tizen API Info (${ip}):`, raw.slice(0, 250)));
      }).on('error', (e) => console.log(`  Tizen API Info Error (${ip}):`, e.message));
    } catch (e) {}
  }
}

runDiagnostics();
