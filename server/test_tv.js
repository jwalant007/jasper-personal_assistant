const http = require('http');

function soap(action, bodyXml) {
  return new Promise((resolve, reject) => {
    const xml = '<?xml version="1.0" encoding="utf-8"?>' +
      '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
      '<s:Body>' +
      `<u:${action} xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">` +
      bodyXml +
      `</u:${action}>` +
      '</s:Body>' +
      '</s:Envelope>';

    const req = http.request({
      hostname: '192.168.29.229',
      port: 7676,
      path: '/smp_16_',
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        'SOAPAction': `"urn:schemas-upnp-org:service:RenderingControl:1#${action}"`,
        'Content-Length': Buffer.byteLength(xml)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });

    req.on('error', reject);
    req.write(xml);
    req.end();
  });
}

async function run() {
  const getVol = await soap('GetVolume', '<InstanceID>0</InstanceID><Channel>Master</Channel>');
  console.log('Current Volume:', getVol.body.match(/<CurrentVolume>(.*?)<\/CurrentVolume>/)[1]);

  const setRes = await soap('SetVolume', '<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>60</DesiredVolume>');
  console.log('SetVolume response:', setRes.status, setRes.body);

  const getVol2 = await soap('GetVolume', '<InstanceID>0</InstanceID><Channel>Master</Channel>');
  console.log('New Volume:', getVol2.body.match(/<CurrentVolume>(.*?)<\/CurrentVolume>/)[1]);

  // Set back to 61
  await soap('SetVolume', '<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>61</DesiredVolume>');
  console.log('Restored to 61!');
}

run().catch(console.error);
