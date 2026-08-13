const net = require('net');

const tvIp = '192.168.29.229';

function packString(str) {
  const buf = Buffer.from(str, 'utf8');
  const lenBuf = Buffer.alloc(2);
  lenBuf.writeUInt16LE(buf.length);
  return Buffer.concat([lenBuf, buf]);
}

function packPayload(payload) {
  const lenBuf = Buffer.alloc(2);
  lenBuf.writeUInt16LE(payload.length);
  return Buffer.concat([lenBuf, payload]);
}

async function sendLegacyKey(keyName, appHeader = 'iphone.iapp.samsung') {
  return new Promise((resolve) => {
    const myIp = '192.168.29.132';
    const myMac = '74-12-B3-ED-1C-BF';

    const b64ip = Buffer.from(myIp).toString('base64');
    const b64mac = Buffer.from(myMac).toString('base64');
    const b64app = Buffer.from('JASPER Assistant').toString('base64');
    const b64remote = Buffer.from(appHeader).toString('base64');
    const b64key = Buffer.from(keyName).toString('base64');

    const payload1 = Buffer.concat([
      Buffer.from([0x00]),
      packString(b64app),
      packString(b64ip),
      packString(b64mac)
    ]);

    const packet1 = Buffer.concat([
      Buffer.from([0x00]),
      packString(b64remote),
      packPayload(payload1)
    ]);

    const payload2 = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00]),
      packString(b64key)
    ]);

    const packet2 = Buffer.concat([
      Buffer.from([0x00]),
      packString(b64remote),
      packPayload(payload2)
    ]);

    console.log(`Sending Legacy Key [${keyName}] with AppHeader [${appHeader}] to ${tvIp}:55000`);

    const client = net.connect(55000, tvIp, () => {
      client.write(packet1);
      setTimeout(() => {
        client.write(packet2);
        setTimeout(() => {
          client.end();
          resolve(true);
        }, 300);
      }, 400);
    });

    client.on('error', (err) => {
      console.log('Error:', err.message);
      resolve(false);
    });
  });
}

async function runTest() {
  await sendLegacyKey('KEY_VOLUP', 'iphone.iapp.samsung');
  await new Promise(r => setTimeout(r, 1000));
  await sendLegacyKey('KEY_VOLUP', 'iphone.PC.samsung');
  await new Promise(r => setTimeout(r, 1000));
  await sendLegacyKey('KEY_VOLUP', 'iapp.samsung');
}

runTest();
