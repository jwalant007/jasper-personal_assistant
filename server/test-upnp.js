const http = require('http');

const xml = '<?xml version="1.0" encoding="utf-8"?>' +
'<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
'<s:Body>' +
'<u:GetVolume xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">' +
'<InstanceID>0</InstanceID>' +
'<Channel>Master</Channel>' +
'</u:GetVolume>' +
'</s:Body>' +
'</s:Envelope>';

function testUpnp(host, port = 7676, path = '/smp_4_') {
  return new Promise((resolve) => {
    console.log(`[UPnP Test] Probing http://${host}:${port}${path}...`);
    const req = http.request({
      host,
      port,
      path,
      method: 'POST',
      timeout: 2500,
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        'SOAPACTION': '"urn:schemas-upnp-org:service:RenderingControl:1#GetVolume"',
        'Content-Length': Buffer.byteLength(xml)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log(`[UPnP ${host}] Result:`, res.statusCode, d.substring(0, 100));
        resolve(true);
      });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`[UPnP ${host}] Connection timed out after 2500ms (TV in standby/offline)`);
      resolve(false);
    });

    req.on('error', e => {
      console.log(`[UPnP ${host}] Notice:`, e.message);
      resolve(false);
    });

    req.write(xml);
    req.end();
  });
}

(async () => {
  await testUpnp('192.168.29.228');
  await testUpnp('192.168.29.229');
  console.log('[UPnP Test] Diagnostic probe completed.');
})();
