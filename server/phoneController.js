const { exec, execFile } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const execFilePromise = util.promisify(execFile);

const path = require('path');
const fs = require('fs');
const os = require('os');

// Helper to resolve adb path robustly
function getAdbPath() {
  if (process.env.LOCALAPPDATA) {
    const localAdb = path.join(process.env.LOCALAPPDATA, 'Android', 'platform-tools', 'adb.exe');
    if (fs.existsSync(localAdb)) {
      return `"${localAdb}"`;
    }
  }
  return 'adb';
}

const adbBin = getAdbPath();

// Helper to run adb commands
async function runAdb(command) {
  try {
    let targetCommand = command;
    // Apply device targeting for all commands except meta-commands like 'devices' and 'connect'
    const metaCommands = ['devices', 'connect', 'disconnect', 'start-server', 'kill-server'];
    const isMetaCommand = metaCommands.some(meta => command.startsWith(meta));
    if (PhoneController.activeDeviceId && !isMetaCommand) {
      targetCommand = `-s ${PhoneController.activeDeviceId} ${command}`;
    }
    const fullCommand = `${adbBin} ${targetCommand}`;
    console.log(`[PhoneController] Executing: ${fullCommand}`);
    const { stdout, stderr } = await execPromise(fullCommand, { timeout: 10000 });
    return stdout.trim();
  } catch (error) {
    console.error(`[PhoneController] Error executing ADB command: ${error.message}`);
    throw error;
  }
}

const PhoneController = {
  activeDeviceId: null,

  // Check if device is connected
  status: async () => {
    try {
      const devices = await runAdb('devices');
      const lines = devices.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('*'));
      
      // First line is "List of devices attached"
      if (lines.length <= 1) {
        PhoneController.activeDeviceId = null;
        return { connected: false, message: 'No devices connected' };
      }

      const deviceLine = lines[1];
      const parts = deviceLine.split('\t');
      const deviceId = parts[0];
      const deviceState = parts[1];

      if (deviceState !== 'device') {
        PhoneController.activeDeviceId = null;
        return { connected: false, message: `Device in state: ${deviceState}` };
      }

      PhoneController.activeDeviceId = deviceId;

      // Fetch battery
      const batteryRaw = await runAdb('shell dumpsys battery');
      const batteryLevelMatch = batteryRaw.match(/level: (\d+)/);
      const batteryLevel = batteryLevelMatch ? parseInt(batteryLevelMatch[1], 10) : 'Unknown';
      
      // Fetch model
      const model = await runAdb('shell getprop ro.product.model');
      const androidVersion = await runAdb('shell getprop ro.build.version.release');

      return {
        connected: true,
        deviceId,
        model,
        androidVersion,
        batteryLevel
      };
    } catch (e) {
      return { connected: false, error: e.message };
    }
  },

  connect: async (ip) => {
    const target = ip.includes(':') ? ip : `${ip}:5555`;
    return await runAdb(`connect ${target}`);
  },

  disconnect: async () => {
    return await runAdb(`disconnect`);
  },

  sms: async (number, message) => {
    // Open SMS app with number and text pre-filled
    // We can also send directly using 'adb shell service call isms 7 ...' but it requires root/complex parsing.
    // The safest intent way:
    const safeText = message.replace(/"/g, '\\"');
    return await runAdb(`shell am start -a android.intent.action.SENDTO -d sms:${number} --es sms_body "${safeText}"`);
  },

  call: async (number) => {
    const cleanNumber = (number || '').replace(/[^\d+]/g, '');
    if (!cleanNumber) {
      throw new Error('Invalid phone number provided');
    }

    try {
      await runAdb(`shell am start -a android.intent.action.CALL -d "tel:${cleanNumber}"`);
    } catch (e) {
      console.warn('[PhoneController] Direct action.CALL failed, attempting DIAL + KEYCODE_CALL fallback:', e.message);
      await runAdb(`shell am start -a android.intent.action.DIAL -d "tel:${cleanNumber}"`);
      await new Promise(r => setTimeout(r, 1200));
      await runAdb(`shell input keyevent KEYCODE_CALL`);
    }

    // Auto-max volume streams & activate speakerphone so audio transmits into call stream
    setTimeout(async () => {
      try {
        await runAdb(`shell media volume --stream 0 --set 15`);
        await runAdb(`shell media volume --stream 3 --set 15`);
        await runAdb(`shell input keyevent KEYCODE_SPEAKER`);
      } catch (err) {}
    }, 2000);

    return { success: true, method: 'cellular_call', number: cleanNumber };
  },

  toggleSpeaker: async () => {
    try {
      await runAdb(`shell media volume --stream 0 --set 15`);
      await runAdb(`shell media volume --stream 3 --set 15`);
      await runAdb(`shell input keyevent KEYCODE_SPEAKER`);
      return { success: true, message: 'Toggled speakerphone' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  speakOnDevice: async (text) => {
    if (!text || !text.trim()) return { success: false, error: 'Text required' };
    try {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
      const tempPath = path.join(os.tmpdir(), 'jasper_speech.mp3');

      const response = await fetch(ttsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!response.ok) throw new Error(`TTS HTTP ${response.status}`);
      const arrayBuf = await response.arrayBuffer();
      fs.writeFileSync(tempPath, Buffer.from(arrayBuf));

      await runAdb(`push "${tempPath}" /sdcard/jasper_speech.mp3`);
      await runAdb(`shell media volume --stream 0 --set 15`);
      await runAdb(`shell media volume --stream 3 --set 15`);

      try {
        await runAdb(`shell stagefright -a -p /sdcard/jasper_speech.mp3`);
      } catch (e) {
        await runAdb(`shell am start -a android.intent.action.VIEW -d "file:///sdcard/jasper_speech.mp3" -t "audio/mp3"`);
      }
      return { success: true, text };
    } catch (e) {
      console.error('[PhoneController] speakOnDevice error:', e.message);
      return { success: false, error: e.message };
    }
  },

  brightness: async (level) => {
    // level: 0 to 255
    const scaled = Math.max(0, Math.min(255, Math.floor((level / 100) * 255)));
    return await runAdb(`shell settings put system screen_brightness ${scaled}`);
  },

  wifi: async (enabled) => {
    const action = enabled ? 'enable' : 'disable';
    return await runAdb(`shell svc wifi ${action}`);
  },

  bluetooth: async (enabled) => {
    const action = enabled ? 'enable' : 'disable';
    return await runAdb(`shell svc bluetooth ${action}`);
  },

  openApp: async (packageName) => {
    return await runAdb(`shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
  },

  listApps: async () => {
    const stdout = await runAdb(`shell pm list packages -3`); // -3 for 3rd party apps
    return stdout.split('\n').map(line => line.replace('package:', '').trim()).filter(Boolean);
  },

  media: async (action) => {
    const keycodes = {
      'playpause': 'KEYCODE_MEDIA_PLAY_PAUSE',
      'next': 'KEYCODE_MEDIA_NEXT',
      'prev': 'KEYCODE_MEDIA_PREVIOUS',
      'stop': 'KEYCODE_MEDIA_STOP'
    };
    const keycode = keycodes[action];
    if (!keycode) {
      throw new Error(`Invalid media action: '${action}'. Valid actions: ${Object.keys(keycodes).join(', ')}`);
    }
    return await runAdb(`shell input keyevent ${keycode}`);
  },

  volume: async (action) => {
    const keycodes = {
      'up': 'KEYCODE_VOLUME_UP',
      'down': 'KEYCODE_VOLUME_DOWN',
      'mute': 'KEYCODE_VOLUME_MUTE'
    };
    const keycode = keycodes[action];
    if (!keycode) {
      throw new Error(`Invalid volume action: '${action}'. Valid actions: ${Object.keys(keycodes).join(', ')}`);
    }
    return await runAdb(`shell input keyevent ${keycode}`);
  },

  notifications: async () => {
    const stdout = await runAdb(`shell dumpsys notification --noredact`);
    
    // Split on either NotificationRecord{ or NotificationRecord(
    const records = stdout.split(/NotificationRecord[\{\(]/);
    let results = [];
    
    for (let i = 1; i < records.length; i++) {
      const record = records[i];
      // Only care about active/visible notifications
      const pkgMatch = record.match(/pkg=(.*?) /) || record.match(/pkg=(.*?)\n/);
      const pkg = pkgMatch ? pkgMatch[1] : 'unknown';
      
      // Match title: String (...) or SpannableString (...)
      const titleMatch = record.match(/android.title=(?:String|SpannableString) \((.*?)\)/);
      
      // Match text/body: String (...) or SpannableString (...) or fallback to bigText/subText
      let text = '';
      const textMatch = record.match(/android.text=(?:String|SpannableString) \((.*?)\)/);
      const bigTextMatch = record.match(/android.bigText=(?:String|SpannableString) \((.*?)\)/);
      const subTextMatch = record.match(/android.subText=(?:String|SpannableString) \((.*?)\)/);
      
      if (textMatch) {
        text = textMatch[1];
      } else if (bigTextMatch) {
        text = bigTextMatch[1];
      } else if (subTextMatch) {
        text = subTextMatch[1];
      }
      
      const title = titleMatch ? titleMatch[1] : '';
      
      if (title || text) {
        results.push({
          package: pkg,
          title: title,
          text: text
        });
      }
    }
    
    // Filter out some system noise
    return results.filter(n => n.package !== 'android' && n.package !== 'com.android.systemui' && n.package !== 'unknown');
  },

  lock: async () => {
    return await runAdb(`shell input keyevent KEYCODE_POWER`);
  },

  typeText: async (text) => {
    const safeText = text.replace(/ /g, '%s').replace(/"/g, '\\"');
    return await runAdb(`shell input text "${safeText}"`);
  },
  
  tap: async (x, y) => {
    return await runAdb(`shell input tap ${x} ${y}`);
  },

  screenshot: async () => {
    const outputPath = path.join(os.tmpdir(), 'phone_screen.png');
    
    // Use exec-out for proper binary transfer instead of shell redirect
    // which corrupts PNG data through stdout encoding on Windows
    const adbPath = getAdbPath().replace(/"/g, '');
    let deviceArgs = [];
    if (PhoneController.activeDeviceId) {
      deviceArgs = ['-s', PhoneController.activeDeviceId];
    }
    
    try {
      const { stdout } = await execFilePromise(
        adbPath,
        [...deviceArgs, 'exec-out', 'screencap', '-p'],
        { encoding: 'buffer', maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
      );
      
      if (!stdout || stdout.length === 0) {
        throw new Error('Screenshot returned empty data');
      }
      
      const base64 = stdout.toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (err) {
      console.error('[PhoneController] Screenshot failed:', err.message);
      throw new Error(`Screenshot failed: ${err.message}`);
    }
  },

  findPhone: async () => {
    // Max volume notification sound alert + play ringtone intent
    try {
      await runAdb(`shell media volume --stream 3 --set 15`); // Set media volume to max
      await runAdb(`shell media volume --stream 2 --set 15`); // Set ring volume to max
      await runAdb(`shell am start -a android.intent.action.VIEW -d "content://settings/system/ringtone" -t "audio/*"`);
      return { success: true, message: 'Phone alarm activated at max volume' };
    } catch (e) {
      // Fallback ring key event trigger
      await runAdb(`shell input keyevent KEYCODE_MUSIC_PLAY`);
      return { success: true, message: 'Triggered media audio play alert' };
    }
  },

  whatsappReply: async (number, message) => {
    try {
      const cleanNum = number.replace(/[^0-9]/g, '');
      const safeMsg = encodeURIComponent(message);
      // Open WhatsApp chat intent directly
      await runAdb(`shell am start -a android.intent.action.VIEW -d "https://api.whatsapp.com/send?phone=${cleanNum}&text=${safeMsg}"`);
      return { success: true, message: `Opened WhatsApp chat for ${number}` };
    } catch (e) {
      throw new Error(`WhatsApp reply failed: ${e.message}`);
    }
  },

  contacts: async () => {
    try {
      const stdout = await runAdb(`shell content query --uri content://com.android.contacts/data/phones`);
      const rows = stdout.split(/Row:\s*\d+/);
      const results = [];

      for (const row of rows) {
        const displayMatch = row.match(/display_name=(.*?)(?:,|$)/);
        const data1Match = row.match(/data1=(.*?)(?:,|$)/);
        const data4Match = row.match(/data4=(.*?)(?:,|$)/);

        if (displayMatch && (data1Match || data4Match)) {
          const name = displayMatch[1].trim();
          let phone = (data4Match && data4Match[1] !== 'NULL' ? data4Match[1] : data1Match[1]).trim();

          if (name && name !== 'NULL' && phone && phone !== 'NULL') {
            if (!results.some(r => r.phone === phone)) {
              results.push({
                id: Date.now() + Math.random(),
                name,
                phone,
                category: 'Synced Phone',
                avatar: '📱',
                defaultTask: `Call ${name} regarding update.`
              });
            }
          }
        }
      }
      return results;
    } catch (e) {
      console.error('[PhoneController] Contacts sync error:', e.message);
      return [];
    }
  }
};

module.exports = PhoneController;
