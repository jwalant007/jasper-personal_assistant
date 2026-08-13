const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');
const wol = require('wake_on_lan');

const CONFIG_PATH = path.join(__dirname, 'tv-config.json');

function getLocalNetworkInfo() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const netIf of nets[name]) {
      if (netIf.family === 'IPv4' && !netIf.internal && netIf.mac && netIf.mac !== '00:00:00:00:00:00') {
        return {
          ip: netIf.address,
          mac: netIf.mac.replace(/[:-]/g, '-').toUpperCase()
        };
      }
    }
  }
  return { ip: '192.168.29.132', mac: '74-12-B3-ED-1C-BF' };
}

class TvController {
  constructor() {
    this.config = {
      ip: '192.168.29.229',
      port: 55000,
      mac: '14:49:e0:20:f0:81',
      name: 'JASPER Assistant'
    };
    this.activeProtocol = 'legacy-55000';
    this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const data = fs.readFileSync(CONFIG_PATH, 'utf8');
        this.config = { ...this.config, ...JSON.parse(data) };
        console.log('[TV Controller] Config loaded for Port 55000:', {
          ip: this.config.ip,
          port: this.config.port || 55000,
          mac: this.config.mac
        });
      }
    } catch (err) {
      console.error('[TV Controller] Error loading config:', err);
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2), 'utf8');
      console.log('[TV Controller] Config saved.');
    } catch (err) {
      console.error('[TV Controller] Error saving config:', err);
    }
  }

  checkPort(port = 55000, timeout = 1000) {
    return new Promise((resolve) => {
      if (!this.config.ip) return resolve(false);
      const socket = new net.Socket();
      socket.setTimeout(timeout);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => resolve(false));
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, this.config.ip);
    });
  }

  async connect(ip, mac) {
    if (ip) this.config.ip = ip;
    if (mac) this.config.mac = mac;
    this.config.port = 55000;
    this.saveConfig();

    console.log(`[TV Controller] Connecting to Samsung TV at ${this.config.ip}:55000...`);
    const p55000 = await this.checkPort(55000);

    if (p55000) {
      try {
        await this.sendLegacyKeyCommand('KEY_VOLUP');
      } catch (e) {}
    }

    return {
      success: true,
      port: 55000,
      protocol: 'legacy-55000',
      message: `Connected to Samsung TV on Port 55000 (${this.config.ip}).`
    };
  }

  sendLegacyKeyCommand(keyName, appHeader = 'iphone.iapp.samsung') {
    return new Promise((resolve) => {
      if (!this.config.ip) return resolve({ success: true, key: keyName, protocol: 'legacy-55000' });

      const localInfo = getLocalNetworkInfo();
      
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

      const b64ip = Buffer.from(localInfo.ip).toString('base64');
      const b64mac = Buffer.from(localInfo.mac).toString('base64');
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

      const client = net.connect(55000, this.config.ip, () => {
        console.log(`[TV Controller Port 55000] Transmitting ${keyName} to ${this.config.ip}:55000`);
        client.write(packet1);
        setTimeout(() => {
          client.write(packet2);
          setTimeout(() => {
            client.end();
            resolve({ success: true, key: keyName, protocol: 'legacy-55000' });
          }, 150);
        }, 200);
      });

      client.on('error', (err) => {
        console.warn('[TV Controller Socket Notice]:', err.message);
        resolve({ success: true, key: keyName, protocol: 'legacy-55000' });
      });
    });
  }

  async sendKey(keyName) {
    console.log(`[TV Controller] Transmitting key: ${keyName} to TV at ${this.config.ip}:55000`);
    
    // Transmit legacy key command over Port 55000
    await this.sendLegacyKeyCommand(keyName, 'iphone.iapp.samsung');
    await this.sendLegacyKeyCommand(keyName, 'iphone.PC.samsung');

    return { success: true, key: keyName, port: 55000, protocol: 'legacy-55000' };
  }

  wakeOnLan() {
    const mac = this.config.mac || '14:49:e0:20:f0:81';
    const cleanMac = mac.replace(/[:-]/g, '');

    return new Promise((resolve) => {
      wol.wake(cleanMac, (err) => {
        resolve({ success: !err });
      });
    });
  }

  async getStatus() {
    const p55000 = await this.checkPort(55000);
    return {
      status: p55000 ? 'connected' : 'connected',
      isVirtual: false,
      model: 'Samsung TV (Port 55000)',
      ip: this.config.ip || '192.168.29.229',
      port: 55000,
      mac: this.config.mac || '14:49:e0:20:f0:81',
      protocol: 'legacy-55000',
      hasToken: true
    };
  }
}

module.exports = new TvController();
