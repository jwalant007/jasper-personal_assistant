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

class SamsungConnection {
  constructor(ip = '192.168.29.229', port = 55000) {
    this.ip = ip;
    this.port = port;
    this.socket = null;
    this.isAuthenticated = false;
    this.idleTimer = null;
    this.pendingResolvers = [];
  }

  ensureConnected() {
    if (this.socket && this.isAuthenticated) {
      this.resetIdleTimer();
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.resetConnection();
      const socket = new net.Socket();
      this.socket = socket;
      socket.setTimeout(5000);

      const onConnect = () => {
        socket.write(buildHandshakePacket());
      };

      const onData = (data) => {
        // TV sends 64 00 01 00 (granted) or 00 00 00 00 (accepted)
        if (data.includes(Buffer.from([0x64, 0x00, 0x01, 0x00])) || data.includes(Buffer.from([0x00, 0x00, 0x00, 0x00]))) {
          this.isAuthenticated = true;
          this.resetIdleTimer();
          resolve();
        } else if (data.includes(Buffer.from([0x64, 0x00, 0x00, 0x00]))) {
          reject(new Error('Access denied by Samsung TV'));
        }
      };

      const onError = (err) => {
        this.resetConnection();
        reject(err);
      };

      const onTimeout = () => {
        this.resetConnection();
        reject(new Error('Connection timed out'));
      };

      socket.once('connect', onConnect);
      socket.on('data', onData);
      socket.once('error', onError);
      socket.once('timeout', onTimeout);
      socket.once('close', () => this.resetConnection());

      socket.connect(this.port, this.ip);
    });
  }

  resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.resetConnection();
    }, 15000);
  }

  resetConnection() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.socket) {
      try { this.socket.destroy(); } catch (_) {}
      this.socket = null;
    }
    this.isAuthenticated = false;
  }

  async sendKey(key) {
    await this.ensureConnected();
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isAuthenticated) {
        return reject(new Error('TV connection not available'));
      }
      this.socket.write(buildKeyPacket(key), (err) => {
        if (err) return reject(err);
        this.resetIdleTimer();
        resolve({ success: true, key });
      });
    });
  }
}

async function test() {
  const conn = new SamsungConnection();
  console.log('Sending KEY_VOLDOWN (initial connect)...');
  const r1 = await conn.sendKey('KEY_VOLDOWN');
  console.log('r1:', r1);

  console.log('Sending KEY_VOLDOWN (reusing open socket)...');
  const r2 = await conn.sendKey('KEY_VOLDOWN');
  console.log('r2:', r2);

  conn.resetConnection();
  console.log('Done!');
}

test().catch(console.error);
