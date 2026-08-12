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
      ip: '',
      mac: '',
      token: '',
      name: 'JASPER Assistant'
    };
    this.control = null;
    this.activeProtocol = null;
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

  checkPort(port, timeout = 2000) {
    return new Promise((resolve) => {
      if (!this.config.ip) return resolve(false);
      const socket = new net.Socket();
      socket.setTimeout(timeout);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, this.config.ip);
    });
  }

  initControl(port = 8002) {
    if (!this.config.ip) {
      throw new Error('TV IP Address not configured');
    }

    const connectionConfig = {
      ip: this.config.ip,
      mac: this.config.mac || '00:11:22:33:44:55',
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

    // 1. Try WebSocket SSL (Port 8002)
    const p8002 = await this.checkPort(8002);
    if (p8002) {
      this.activeProtocol = 'websocket-8002';
      return 'websocket-8002';
    }

    // 2. Try WebSocket HTTP (Port 8001)
    const p8001 = await this.checkPort(8001);
    if (p8001) {
      this.activeProtocol = 'websocket-8001';
      return 'websocket-8001';
    }

    // 3. Try Legacy Samsung TCP (Port 55000)
    const p55000 = await this.checkPort(55000);
    if (p55000) {
      this.activeProtocol = 'legacy-55000';
      return 'legacy-55000';
    }

    this.activeProtocol = null;
    return null;
  }

  async connect(ip, mac) {
    this.config.ip = ip;
    if (mac) this.config.mac = mac;
    this.saveConfig();

    console.log(`[TV Controller] Detecting active control protocol for ${ip}...`);
    const protocol = await this.detectProtocol();

    if (!protocol) {
      throw new Error('TV not reachable on port 8002, 8001, or 55000. Ensure TV is ON and connected to Wi-Fi.');
    }

    console.log(`[TV Controller] Active protocol detected: ${protocol}`);

    if (protocol === 'legacy-55000') {
      // Trigger pairing handshake with real MAC to display prompt on TV screen
      await this.sendLegacyKeyCommand('KEY_INFO');
      return { 
        success: true, 
        protocol: 'legacy-55000', 
        message: 'Connected via Samsung Remote Protocol (Port 55000). Authorization packet sent!' 
      };
    }

    const port = protocol === 'websocket-8001' ? 8001 : 8002;
    this.initControl(port);

    return new Promise((resolve, reject) => {
      this.control.getToken((err, token) => {
        if (err) {
          console.error('[TV Controller] Authorization error:', err);
          reject(err);
        } else {
          console.log('[TV Controller] Handshake successful, token:', token);
          if (token) {
            this.config.token = token;
            this.saveConfig();
          }
          resolve({ success: true, token, protocol });
        }
      });
    });
  }

  // Send command via Samsung Legacy TCP Socket (Port 55000) with real dynamic IP and MAC
  sendLegacyKeyCommand(keyName) {
    return new Promise((resolve, reject) => {
      if (!this.config.ip) return reject(new Error('TV IP not configured'));

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
      const b64remote = Buffer.from('iapp.samsung').toString('base64');
      const b64key = Buffer.from(keyName).toString('base64');

      // Handshake payload
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

      // Key Payload
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
        console.log(`[TV Controller Legacy] Handshake (IP: ${localInfo.ip}, MAC: ${localInfo.mac}) & Key ${keyName} -> Port 55000`);
        client.write(packet1);
        setTimeout(() => {
          client.write(packet2);
          setTimeout(() => {
            client.end();
            resolve({ success: true, key: keyName, protocol: 'legacy-55000' });
          }, 300);
        }, 400);
      });

      client.on('error', (err) => {
        console.error('[TV Controller Legacy] Socket Error:', err.message);
        reject(err);
      });
    });
  }

  async openApp(appId) {
    if (this.activeProtocol === 'legacy-55000') {
      throw new Error('App shortcuts are only supported on Tizen OS Smart TVs');
    }

    if (!this.control) {
      const port = this.activeProtocol === 'websocket-8001' ? 8001 : 8002;
      this.initControl(port);
    }

    return new Promise((resolve, reject) => {
      console.log(`[TV Controller] Opening app: ${appId}`);
      this.control.openApp(appId, (err, res) => {
        if (err) {
          console.error('[TV Controller] Failed to open app:', err);
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  async sendKey(keyName) {
    const protocol = this.activeProtocol || await this.detectProtocol();

    if (protocol === 'legacy-55000') {
      return this.sendLegacyKeyCommand(keyName);
    }

    if (!this.control) {
      const port = protocol === 'websocket-8001' ? 8001 : 8002;
      this.initControl(port);
    }

    if (keyName === 'KEY_NETFLIX') {
      return this.openApp(APPS.Netflix);
    }
    if (keyName === 'KEY_YOUTUBE') {
      return this.openApp(APPS.YouTube);
    }
    if (keyName === 'KEY_AMAZON') {
      return this.openApp(APPS['Prime Video']);
    }

    const key = KEYS[keyName];
    if (!key) {
      throw new Error(`Invalid Key Name: ${keyName}`);
    }

    return new Promise((resolve, reject) => {
      console.log(`[TV Controller] Sending key: ${keyName} (${key})`);
      this.control.sendKey(key, (err, res) => {
        if (err) {
          console.error('[TV Controller] Failed to send key:', err);
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  wakeOnLan() {
    if (!this.config.mac) {
      throw new Error('MAC Address not configured for Wake-on-LAN');
    }
    
    return new Promise((resolve, reject) => {
      const cleanMac = this.config.mac.replace(/[:-]/g, '');
      console.log(`[TV Controller] Sending WoL magic packet to MAC: ${this.config.mac}`);
      wol.wake(cleanMac, (err) => {
        if (err) {
          console.error('[TV Controller] Wake-on-LAN failed:', err);
          reject(err);
        } else {
          console.log('[TV Controller] Wake-on-LAN command sent.');
          resolve({ success: true });
        }
      });
    });
  }

  async getStatus() {
    if (!this.config.ip) {
      return { status: 'unconfigured' };
    }
    
    try {
      const protocol = await this.detectProtocol();
      if (protocol) {
        return {
          status: 'connected',
          ip: this.config.ip,
          mac: this.config.mac,
          protocol: protocol,
          hasToken: !!this.config.token || protocol === 'legacy-55000'
        };
      }
      return {
        status: 'disconnected',
        ip: this.config.ip,
        mac: this.config.mac,
        hasToken: !!this.config.token
      };
    } catch (err) {
      return {
        status: 'disconnected',
        ip: this.config.ip,
        mac: this.config.mac,
        hasToken: !!this.config.token,
        error: err.message
      };
    }
  }
}

module.exports = new TvController();
