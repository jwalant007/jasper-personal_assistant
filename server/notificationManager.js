const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class NotificationManager {
  constructor() {
    this.scriptPath = path.join(__dirname, 'send_toast.ps1');
    this.activeEmergencies = [];
    this.isSpeechActive = false;
  }

  /**
   * Trigger native Windows 10/11 Toast Notification with sound
   */
  sendWindowsToast({ title = '🚨 JASPER EMERGENCY ALERT', message = 'Emergency detected!', playSound = true }) {
    return new Promise((resolve) => {
      try {
        if (!fs.existsSync(this.scriptPath)) {
          console.warn('[NotificationManager] Toast script not found at:', this.scriptPath);
          return resolve(false);
        }

        const args = [
          '-NoProfile',
          '-ExecutionPolicy', 'Bypass',
          '-File', this.scriptPath,
          '-Title', title,
          '-Message', message
        ];
        if (playSound) args.push('-PlaySound');

        const ps = spawn('powershell.exe', args, { windowsHide: true });
        
        ps.on('close', (code) => {
          if (code === 0) {
            console.log(`[NotificationManager] ✓ Native Windows Toast delivered: "${title}"`);
            resolve(true);
          } else {
            console.warn(`[NotificationManager] Toast script finished with exit code ${code}`);
            resolve(false);
          }
        });

        ps.on('error', (err) => {
          console.warn('[NotificationManager] Failed to launch toast process:', err.message);
          resolve(false);
        });
      } catch (err) {
        console.error('[NotificationManager] Error in sendWindowsToast:', err);
        resolve(false);
      }
    });
  }

  /**
   * Speak emergency alert via Windows Speech Synthesis
   */
  speakEmergencyVoice(text) {
    if (!text) return;
    try {
      const cleanText = text.replace(/["'\\]/g, ' ').slice(0, 150);
      const script = `Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Rate = 1; $synth.Speak("${cleanText}")`;
      const ps = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true });
      ps.on('error', () => {});
    } catch (e) {}
  }

  /**
   * Trigger unified Emergency Alert: Toast + Audio + TTS + Broadcast
   */
  async triggerEmergencyAlert({
    source = 'whatsapp',
    sender = 'Unknown',
    senderName = 'Unknown Sender',
    message = '',
    broadcastFn = null
  }) {
    const alertId = `EMERGENCY-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    console.log(`\n=================================================================`);
    console.log(`🚨 [JASPER EMERGENCY ALERT DETECTED]`);
    console.log(`   Source:      ${source.toUpperCase()}`);
    console.log(`   Sender:      ${senderName} (${sender})`);
    console.log(`   Message:     "${message}"`);
    console.log(`   Timestamp:   ${formattedTime}`);
    console.log(`=================================================================\n`);

    const title = `🚨 URGENT EMERGENCY: ${senderName}`;
    const snippet = message.length > 90 ? message.slice(0, 87) + '...' : message;
    const toastBody = `${senderName} (${sender}): "${snippet}"`;

    // 1. Deliver native Windows 10/11 Desktop Toast with alert audio
    this.sendWindowsToast({ title, message: toastBody, playSound: true });

    // 2. Speak voice warning in background
    this.speakEmergencyVoice(`Emergency alert from ${senderName}. ${snippet}`);

    // 3. Dispatch to User's Phone Lock-Screen via Cloud Push Relay (ntfy.sh)
    try {
      const { sendPushToPhone } = require('./weatherSentinel');
      sendPushToPhone({
        title: `🚨 URGENT: ${senderName}`,
        message: `${snippet} (Source: ${source.toUpperCase()})`,
        priority: 'urgent',
        tags: 'rotating_light,sos'
      });
    } catch (e) {}

    const emergencyPayload = {
      id: alertId,
      source,
      sender,
      senderName,
      message,
      title,
      timestamp,
      formattedTime,
      active: true
    };

    this.activeEmergencies.unshift(emergencyPayload);
    if (this.activeEmergencies.length > 50) this.activeEmergencies.pop();

    // 3. Broadcast to all open UI clients over WebSocket
    if (typeof broadcastFn === 'function') {
      broadcastFn({
        type: 'EMERGENCY_ALERT',
        emergency: emergencyPayload
      });
    }

    return emergencyPayload;
  }

  getActiveEmergencies() {
    return this.activeEmergencies;
  }

  dismissEmergency(id) {
    if (id === 'all') {
      this.activeEmergencies.forEach(e => e.active = false);
      return true;
    }
    const target = this.activeEmergencies.find(e => e.id === id);
    if (target) {
      target.active = false;
      return true;
    }
    return false;
  }
}

module.exports = new NotificationManager();
