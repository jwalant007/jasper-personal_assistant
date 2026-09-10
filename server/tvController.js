const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');
const wol = require('wake_on_lan');
let Samsung = null;
try {
  const pkg = require('samsung-tv-control');
  Samsung = pkg.Samsung || pkg.default || pkg;
} catch (e) {
  console.warn('[TvController] samsung-tv-control import note:', e.message);
}

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

  checkPort(port = 55000, ip = null, timeout = 1200) {
    const targetIp = ip || this.config.ip;
    return new Promise((resolve) => {
      if (!targetIp) return resolve(false);
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
      socket.connect(port, targetIp);
    });
  }

  /**
   * Verify actual Samsung TV connection by sending a handshake and checking for valid response
   */
  verifySamsungConnection(ip = null, timeout = 2500) {
    const targetIp = ip || this.config.ip;
    return new Promise((resolve) => {
      if (!targetIp) return resolve(false);
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
      const b64remote = Buffer.from('iphone.iapp.samsung').toString('base64');

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

      let gotResponse = false;
      const client = net.connect(55000, targetIp, () => {
        client.write(packet1);
      });
      client.setTimeout(timeout);
      client.on('data', (data) => {
        gotResponse = true;
        client.destroy();
        // If we got any response from the TV after our handshake, it's a real Samsung TV
        resolve(true);
      });
      client.on('error', () => resolve(false));
      client.on('timeout', () => {
        client.destroy();
        resolve(gotResponse);
      });
      client.on('close', () => {
        if (!gotResponse) resolve(false);
      });
    });
  }

  async detectActivePort(ip = null) {
    const targetIp = ip || this.config.ip;
    // Check ports in parallel with short timeout: 55000 (legacy), 8002 (WSS), 8001 (WS), 7676 (UPnP)
    const [p55000, p8002, p8001, p7676] = await Promise.all([
      this.checkPort(55000, targetIp),
      this.checkPort(8002, targetIp),
      this.checkPort(8001, targetIp),
      this.checkPort(7676, targetIp)
    ]);

    if (p55000) return { port: 55000, protocol: 'legacy-55000', online: true };
    if (p8002) return { port: 8002, protocol: 'websocket-8002', online: true };
    if (p8001) return { port: 8001, protocol: 'websocket-8001', online: true };
    if (p7676) return { port: 7676, protocol: 'upnp-7676', online: true };
    return { port: this.config.port || 55000, protocol: this.activeProtocol || 'legacy-55000', online: false };
  }

  async connect(ip, mac) {
    if (ip) this.config.ip = ip;
    if (mac) this.config.mac = mac;

    const detection = await this.detectActivePort(this.config.ip);
    this.config.port = detection.port;
    this.activeProtocol = detection.protocol;
    this.saveConfig();

    console.log(`[TV Controller] Connecting to Samsung TV at ${this.config.ip}:${detection.port} (${detection.protocol}, online: ${detection.online})...`);

    if (detection.online && detection.port === 55000) {
      try {
        await this.sendLegacyKeyCommand('KEY_VOLUP');
      } catch (e) {}
    }

    return {
      success: true,
      port: detection.port,
      protocol: detection.protocol,
      online: detection.online,
      message: detection.online 
        ? `Connected to Samsung TV on Port ${detection.port} (${this.config.ip}).`
        : `Registered Samsung TV at ${this.config.ip}. TV appears to be in standby or offline.`
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
        resolve({ success: true, key: keyName, protocol: 'legacy-55000', notice: err.message });
      });
    });
  }

  /**
   * UPnP RenderingControl SOAP request helper (for TV volume / mute over Port 7676)
   */
  async sendUpnpCommand(action, bodyXml, serviceType = 'RenderingControl:1', servicePath = '/smp_4_') {
    const http = require('http');
    return new Promise((resolve) => {
      const xml = '<?xml version="1.0" encoding="utf-8"?>' +
        '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
        '<s:Body>' +
        `<u:${action} xmlns:u="urn:schemas-upnp-org:service:${serviceType}">` +
        bodyXml +
        `</u:${action}>` +
        '</s:Body>' +
        '</s:Envelope>';

      const req = http.request({
        host: this.config.ip,
        port: 7676,
        path: servicePath,
        method: 'POST',
        timeout: 2500,
        headers: {
          'Content-Type': 'text/xml; charset="utf-8"',
          'SOAPACTION': `"urn:schemas-upnp-org:service:${serviceType}#${action}"`,
          'Content-Length': Buffer.byteLength(xml)
        }
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve({ success: res.statusCode === 200, status: res.statusCode, data: d }));
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'UPnP timeout' });
      });
      req.on('error', (e) => resolve({ success: false, error: e.message }));
      req.write(xml);
      req.end();
    });
  }

  async sendKey(keyName) {
    console.log(`[TV / d2h STB Controller] Transmitting key: ${keyName} to TV at ${this.config.ip}`);
    
    // Check if UPnP RenderingControl can handle volume/mute
    if (keyName === 'KEY_MUTE') {
      try {
        await this.sendUpnpCommand('SetMute', '<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredMute>1</DesiredMute>');
      } catch (_) {}
    }

    let sentViaPackage = false;
    if (Samsung) {
      try {
        const tv = new Samsung({
          ip: this.config.ip || '192.168.29.229',
          mac: this.config.mac || '14:49:e0:20:f0:81',
          port: 55000,
          nameApp: 'JASPER Assistant',
          saveToken: false
        });

        await new Promise((resolve) => {
          tv.sendKey(keyName, (err, res) => {
            if (!err) {
              console.log(`[samsung-tv-control] Sent ${keyName} successfully to ${this.config.ip}!`);
              sentViaPackage = true;
            } else {
              console.warn('[samsung-tv-control error]:', err?.message || err);
            }
            resolve(true);
          });
        });
      } catch (err) {
        console.warn('[samsung-tv-control exception]:', err.message);
      }
    }

    // Fallback: also send manual legacy packet
    if (!sentViaPackage) {
      await this.sendLegacyKeyCommand(keyName, 'iphone..iapp.samsung');
    }

    return { success: true, key: keyName, port: this.config.port || 55000, protocol: this.activeProtocol || 'legacy-55000' };
  }

  /**
   * Switch TV input directly to HDMI (HDMI 1, HDMI 2, HDMI 3, HDMI 4, or source menu)
   */
  async switchHdmiSource(portOrAction = 1) {
    console.log(`[TV Controller] Switching HDMI source: ${portOrAction}...`);
    
    if (String(portOrAction).toLowerCase() === 'source') {
      await this.sendKey('KEY_SOURCE');
      return { success: true, action: 'KEY_SOURCE' };
    }

    if (String(portOrAction).toLowerCase() === 'cycle' || String(portOrAction).toLowerCase() === 'hdmi') {
      await this.sendKey('KEY_HDMI');
      return { success: true, action: 'KEY_HDMI' };
    }

    const portNum = parseInt(portOrAction, 10) || 1;
    const hdmiKey = `KEY_HDMI${portNum}`;
    
    // Send discrete HDMI key (e.g. KEY_HDMI1, KEY_HDMI2, etc.)
    await this.sendKey(hdmiKey);
    
    return { success: true, port: portNum, key: hdmiKey };
  }

  /**
   * Tune to a specific d2h set-top box channel via HDMI-CEC numeric keystrokes
   */
  async tuneChannel(channelStr) {
    const raw = String(channelStr).replace(/\D/g, '');
    if (!raw) return { success: false, error: 'Invalid channel number' };

    console.log(`[d2h STB via HDMI-CEC] Tuning to channel ${raw}...`);
    const sent = [];
    for (const digit of raw.split('')) {
      const key = `KEY_${digit}`;
      await this.sendKey(key);
      sent.push(key);
      await new Promise(r => setTimeout(r, 280));
    }
    // Optional enter to confirm channel switch immediately
    await new Promise(r => setTimeout(r, 200));
    await this.sendKey('KEY_ENTER');
    return { success: true, channel: raw, keysSent: sent };
  }

  /**
   * Launch an OTT application on TV / Set-Top Box (JioCinema, Hotstar, Netflix, Prime, SonyLIV, ZEE5, etc.)
   */
  async launchApp(appName) {
    const norm = String(appName).toLowerCase().replace(/[^a-z0-9]/g, '');
    console.log(`[TV Controller / JioFiber OTT] Launching app: ${norm}`);

    const directKeyMap = {
      'netflix': 'KEY_NETFLIX',
      'youtube': 'KEY_YOUTUBE',
      'prime': 'KEY_AMAZON',
      'primevideo': 'KEY_AMAZON',
      'amazon': 'KEY_AMAZON',
      'amazonprime': 'KEY_AMAZON'
    };

    if (directKeyMap[norm]) {
      const key = directKeyMap[norm];
      await this.sendKey(key);
      return { success: true, app: norm, method: 'direct_key', key };
    }

    // For JioCinema, Disney+ Hotstar, SonyLIV, ZEE5, JioTV+:
    // Send Smart Hub / Home key to bring up the TV & STB app launcher dock
    await this.sendKey('KEY_HOME');
    return { success: true, app: norm, method: 'smart_hub', key: 'KEY_HOME' };
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
    const detection = await this.detectActivePort(this.config.ip);
    
    // Port open doesn't mean connected — verify with actual Samsung handshake
    let verified = false;
    if (detection.online && detection.port === 55000) {
      try {
        verified = await this.verifySamsungConnection(this.config.ip, 2000);
      } catch (_) {
        verified = false;
      }
    } else if (detection.online) {
      // For WebSocket/UPnP ports, port open is a reasonable indicator
      verified = detection.online;
    }

    return {
      status: verified ? 'connected' : (detection.online ? 'reachable' : 'disconnected'),
      isVirtual: !verified,
      model: `Samsung TV (${detection.protocol})`,
      ip: this.config.ip || '192.168.29.229',
      port: detection.port,
      mac: this.config.mac || '14:49:e0:20:f0:81',
      protocol: detection.protocol,
      hasToken: verified,
      portOpen: detection.online,
      d2hBridge: 'HDMI-CEC',
      d2hSupported: true
    };
  }
}

module.exports = new TvController();
