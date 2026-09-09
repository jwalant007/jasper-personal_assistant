const net = require('net');

function serialize(strOrBuf, raw = false) {
  let buf = Buffer.isBuffer(strOrBuf) ? strOrBuf : Buffer.from(strOrBuf, 'utf8');
  if (!raw) {
    buf = Buffer.from(buf.toString('base64'), 'utf8');
  }
  const lenBuf = Buffer.alloc(2);
  lenBuf.writeUInt16LE(buf.length);
  return Buffer.concat([lenBuf, buf]);
}

function buildHandshakePacket(name = 'JASPER Remote', description = 'Control', id = 'iapp.samsung') {
  const payload = Buffer.concat([
    Buffer.from([0x64, 0x00]),
    serialize(description),
    serialize(id),
    serialize(name)
  ]);
  return Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00]),
    serialize(payload, true)
  ]);
}

function buildKeyPacket(key) {
  const payload = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00]),
    serialize(key)
  ]);
  return Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00]),
    serialize(payload, true)
  ]);
}

function sendKey(key, ip = '192.168.29.229', port = 55000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let authed = false;

    socket.setTimeout(5000);
    socket.connect(port, ip, () => {
      console.log('[Node TV] Connected to TV port 55000');
      socket.write(buildHandshakePacket());
    });

    socket.on('data', (data) => {
      console.log('[Node TV] Data received:', data.length, 'bytes, hex:', data.toString('hex'));
      
      // Check for authorization granted (0x64 0x00 0x01 0x00) or ready state
      if (data.includes(Buffer.from([0x64, 0x00, 0x01, 0x00])) || data.includes(Buffer.from([0x00, 0x00, 0x00, 0x00]))) {
        if (!authed) {
          authed = true;
          console.log('[Node TV] Access granted! Transmitting key:', key);
          socket.write(buildKeyPacket(key));
          setTimeout(() => {
            socket.destroy();
            resolve(true);
          }, 300);
        }
      }
    });

    socket.on('timeout', () => {
      console.log('[Node TV] Socket timeout');
      socket.destroy();
      resolve(false);
    });

    socket.on('error', (err) => {
      console.error('[Node TV] Socket error:', err.message);
      socket.destroy();
      reject(err);
    });
  });
}

async function run() {
  console.log('Testing sending KEY_VOLUP from Node.js...');
  const res = await sendKey('KEY_VOLUP');
  console.log('Result:', res);
}

run().catch(console.error);
