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

const req = http.request({
  host: '192.168.29.228',
  port: 7676,
  path: '/smp_4_',
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml; charset="utf-8"',
    'SOAPACTION': '"urn:schemas-upnp-org:service:RenderingControl:1#GetVolume"',
    'Content-Length': Buffer.byteLength(xml)
  }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('GET VOLUME RESULT:', res.statusCode, d));
});

req.on('error', e => console.log('ERR:', e.message));
req.write(xml);
req.end();
