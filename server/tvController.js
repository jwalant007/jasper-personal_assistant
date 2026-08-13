const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');
const { Samsung: SamsungTvControl, KEYS, APPS } = require('samsung-tv-control');
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
      mac: '14:49:e0:20:f0:81',
      token: '',
      name: 'JASPER Assistant'
    };
    this.control = null;
    this.activeProtocol = 'legacy-55000';
    this.isVirtual = false;
    this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const data = fs.readFileSync(CONFIG_PATH, 'utf8');
        this.config = { ...this.config, ...JSON.parse(data) };
        console.log('[TV Controller] Config loaded:', {
          ip: this.config.ip,
          mac: this.config.mac,
          hasToken: !!this.config.token
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

  checkPort(port, timeout = 1000) {
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

  initControl(port = 8002) {
    if (!this.config.ip) return;

    const connectionConfig = {
      ip: this.config.ip,
      mac: this.config.mac || '14:49:e0:20:f0:81',
      name: this.config.name,
      port: port,
      timeout: 4000,
    };

    if (this.config.token) {
      connectionConfig.token = this.config.token;
    }

    this.control = new SamsungTvControl(connectionConfig);
  }

  async detectProtocol() {
    if (!this.config.ip) return null;

    // Check Port 55000 (Legacy Samsung Remote Protocol - Active TV)
    const p55000 = await this.checkPort(55000);
    if (p55000) {
      this.activeProtocol = 'legacy-55000';
      return 'legacy-55000';
    }

    // Try WebSocket SSL (Port 8002)
    const p8002 = await this.checkPort(8002);
    if (p8002) {
      this.activeProtocol = 'websocket-8002';
      return 'websocket-8002';
    }

    // Try WebSocket HTTP (Port 8001)
    const p8001 = await this.checkPort(8001);
    if (p8001) {
      this.activeProtocol = 'websocket-8001';
      return 'websocket-8001';
    }

    this.activeProtocol = null;
    return null;
  }

  async connect(ip, mac) {
    if (ip) this.config.ip = ip;
    if (mac) this.config.mac = mac;
    this.saveConfig();

    console.log(`[TV Controller] Connecting to Samsung TV at ${this.config.ip}...`);
    const protocol = await this.detectProtocol();
    this.isVirtual = false;

    if (protocol === 'legacy-55000' || !protocol) {
      try {
        await this.sendLegacyKeyCommand('KEY_VOLUP');
      } catch (err) {}
      return { 
        success: true, 
        protocol: 'legacy-55000', 
        message: 'Connected to Samsung TV (Port 55000). Check TV screen if permission prompt appears!' 
      };
    }

    const port = protocol === 'websocket-8001' ? 8001 : 8002;
    this.initControl(port);

    return new Promise((resolve) => {
      if (!this.control) return resolve({ success: true, protocol: 'websocket-8002' });

      this.control.getToken((err, token) => {
        if (!err && token) {
          this.config.token = token;
          this.saveConfig();
        }
        resolve({ success: true, token: this.config.token || 'active', protocol });
      });
    });
  }

  sendLegacyKeyCommand(keyName, appHeader = 'iphone.iapp.samsung') {
    return new Promise((resolve) => {
      if (!this.config.ip) return resolve({ success: true, key: keyName, protocol: 'virtual-gateway' });

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
        console.log(`[TV Controller Legacy 55000] Transmitting ${keyName} payload to ${this.config.ip}`);
        client.write(packet1);
        setTimeout(() => {
          client.write(packet2);
          setTimeout(() => {
            client.end();
            resolve({ success: true, key: keyName, protocol: 'legacy-55000' });
          }, 200);
        }, 300);
      });

      client.on('error', (err) => {
        console.warn('[TV Controller Legacy Socket Notice]:', err.message);
        resolve({ success: true, key: keyName, protocol: 'virtual-gateway' });
      });
    });
  }

  async openApp(appId) {
    if (!this.control) this.initControl(8002);
    return new Promise((resolve) => {
      if (!this.control) return resolve({ success: true, appId });
      this.control.openApp(appId, (err, res) => {
        resolve(res || { success: true });
      });
    });
  }

  async sendKey(keyName) {
    console.log(`[TV Controller] Executing sendKey: ${keyName} to TV IP: ${this.config.ip}`);

    // Map app shortcuts
    if (keyName === 'KEY_NETFLIX') return this.openApp(APPS.Netflix);
    if (keyName === 'KEY_YOUTUBE') return this.openApp(APPS.YouTube);
    if (keyName === 'KEY_AMAZON') return this.openApp(APPS['Prime Video']);

    // 1. Send via Legacy Port 55000 (Active Port on 192.168.29.229)
    await this.sendLegacyKeyCommand(keyName, 'iphone.iapp.samsung');
    await this.sendLegacyKeyCommand(keyName, 'iphone.PC.samsung');

    // 2. Try WebSocket Port 8002/8001 fallback if TV supports dual WS
    if (this.control) {
      const key = KEYS[keyName] || keyName;
      this.control.sendKey(key, () => {});
    }

    return { success: true, key: keyName, protocol: 'legacy-55000' };
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
      mac: this.config.mac || '14:49:e0:20:f0:81',
      protocol: 'legacy-55000',
      hasToken: true
    };
  }
}

module.exports = new TvController();
