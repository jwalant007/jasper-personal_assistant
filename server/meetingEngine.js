/**
 * JASPER Meeting Engine
 * Handles automated video conference and Google Meet workstation integration:
 * - Intelligent meeting discovery from active calls, calendar, or client context
 * - Hands-free voice launch ("Jarvis, pull up the meeting, please")
 * - Automated window focusing, maximizing, and optimal audio adjustment
 * - Multi-platform support: Google Meet, Zoom, Microsoft Teams, Webex
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const MEETINGS_FILE = path.join(__dirname, 'data', 'meetings.json');

function getScriptPath(scriptName) {
  if (process.env.JASPER_RESOURCES_PATH) {
    const resPath = path.normalize(path.join(process.env.JASPER_RESOURCES_PATH, 'server', scriptName));
    if (fs.existsSync(resPath)) return resPath;
  }
  return path.normalize(path.join(__dirname, scriptName));
}

class MeetingEngine {
  constructor() {
    this._broadcastFn = null;
    this._activeMeeting = null;
    this._initStore();
  }

  setBroadcastFn(fn) {
    this._broadcastFn = fn;
  }

  _initStore() {
    if (!fs.existsSync(path.dirname(MEETINGS_FILE))) {
      fs.mkdirSync(path.dirname(MEETINGS_FILE), { recursive: true });
    }
    if (!fs.existsSync(MEETINGS_FILE)) {
      const defaultMeetings = [
        {
          id: 'meet-miami-17k',
          title: 'Contract Signing & Onboarding ($17k)',
          clientName: 'Miami Enterprise Client',
          company: 'Miami Tech Partners LLC',
          dealValue: 17000,
          currency: 'USD',
          platform: 'Google Meet',
          url: 'https://meet.google.com/xyz-qwer-abc',
          scheduledTime: 'Tonight (Urgent)',
          deadlineMinutes: 20,
          notes: 'High-value closing call. Client wants to sign immediately.',
          status: 'ready'
        },
        {
          id: 'meet-weekly-sync',
          title: 'Executive Agency Review',
          clientName: 'Blake Stephens & Partners',
          company: 'AI Solutions Ltd',
          dealValue: 5000,
          currency: 'USD',
          platform: 'Google Meet',
          url: 'https://meet.google.com/new',
          scheduledTime: 'Tomorrow 10:00 AM',
          status: 'scheduled'
        }
      ];
      fs.writeFileSync(MEETINGS_FILE, JSON.stringify(defaultMeetings, null, 2));
    }
  }

  getMeetings() {
    try {
      if (!fs.existsSync(MEETINGS_FILE)) this._initStore();
      return JSON.parse(fs.readFileSync(MEETINGS_FILE, 'utf8'));
    } catch (err) {
      console.error('[MeetingEngine] Error reading meetings:', err.message);
      return [];
    }
  }

  saveMeetings(meetings) {
    try {
      fs.writeFileSync(MEETINGS_FILE, JSON.stringify(meetings, null, 2));
      return true;
    } catch (err) {
      console.error('[MeetingEngine] Error saving meetings:', err.message);
      return false;
    }
  }

  addMeeting(meetingData) {
    const meetings = this.getMeetings();
    const newMeeting = {
      id: `meet-${Date.now()}`,
      title: meetingData.title || 'Client Conference',
      clientName: meetingData.clientName || 'Valued Client',
      company: meetingData.company || '',
      dealValue: parseFloat(meetingData.dealValue) || 0,
      currency: meetingData.currency || 'USD',
      platform: meetingData.platform || 'Google Meet',
      url: meetingData.url || 'https://meet.google.com/new',
      scheduledTime: meetingData.scheduledTime || 'Now',
      notes: meetingData.notes || '',
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    meetings.unshift(newMeeting);
    this.saveMeetings(meetings);
    if (this._broadcastFn) {
      this._broadcastFn({ type: 'MEETINGS_UPDATED', meetings });
    }
    return newMeeting;
  }

  deleteMeeting(id) {
    let meetings = this.getMeetings();
    meetings = meetings.filter(m => m.id !== id);
    this.saveMeetings(meetings);
    if (this._broadcastFn) {
      this._broadcastFn({ type: 'MEETINGS_UPDATED', meetings });
    }
    return true;
  }

  setActiveContextMeeting(meetingObj) {
    this._activeMeeting = meetingObj;
    if (this._broadcastFn) {
      this._broadcastFn({ type: 'ACTIVE_MEETING_CONTEXT_SET', activeMeeting: meetingObj });
    }
  }

  getActiveContextMeeting() {
    return this._activeMeeting;
  }

  /**
   * Find the most relevant meeting link:
   * 1. Explicit url or meetingId or clientName
   * 2. Active context meeting from telephony relay
   * 3. Next high-value or urgent meeting from store
   * 4. Fallback: Google Meet instant room
   */
  findRelevantMeeting({ meetingId, clientName, url } = {}) {
    if (url) {
      return {
        id: 'direct-url',
        title: 'Direct Video Conference',
        clientName: clientName || 'Client',
        platform: 'Google Meet',
        url: url.trim(),
        dealValue: 0
      };
    }

    const meetings = this.getMeetings();

    if (meetingId) {
      const match = meetings.find(m => m.id === meetingId);
      if (match) return match;
    }

    if (clientName) {
      const q = clientName.toLowerCase();
      const match = meetings.find(m => 
        (m.clientName && m.clientName.toLowerCase().includes(q)) ||
        (m.company && m.company.toLowerCase().includes(q)) ||
        (m.title && m.title.toLowerCase().includes(q))
      );
      if (match) return match;
    }

    // Check active meeting set by telephony receptionist relay
    if (this._activeMeeting && this._activeMeeting.url) {
      return this._activeMeeting;
    }

    // Check if there is an urgent/ready meeting in store
    const urgentMeeting = meetings.find(m => m.status === 'ready' || (m.dealValue && m.dealValue >= 5000));
    if (urgentMeeting) return urgentMeeting;

    // First scheduled meeting
    if (meetings.length > 0) return meetings[0];

    // Default fallback
    return {
      id: 'default-meet-instant',
      title: 'Instant Google Meet Session',
      clientName: 'Client',
      platform: 'Google Meet',
      url: 'https://meet.google.com/new',
      dealValue: 0
    };
  }

  /**
   * Pulls up the meeting on the local PC workstation hands-free
   */
  async pullUpMeeting({ meetingId, clientName, url } = {}) {
    const meeting = this.findRelevantMeeting({ meetingId, clientName, url });
    const targetUrl = meeting.url || 'https://meet.google.com/new';

    console.log(`[MeetingEngine] Pulling up meeting for "${meeting.clientName}" (${targetUrl})`);

    // 1. Locate Chrome or default browser binary
    const chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
    ];
    let browserCmd = `start "" "${targetUrl}"`;
    for (const p of chromePaths) {
      if (fs.existsSync(p)) {
        browserCmd = `start "" "${p}" --start-maximized "${targetUrl}"`;
        break;
      }
    }

    // 2. Launch browser window
    const launchPromise = new Promise((resolve) => {
      exec(browserCmd, (err) => {
        if (err) {
          console.warn('[MeetingEngine] Direct browser launch failed, falling back to shell start:', err.message);
          exec(`start "" "${targetUrl}"`, () => resolve(true));
        } else {
          resolve(true);
        }
      });
    });

    await launchPromise;

    // 3. Bring window to foreground & maximize via PowerShell focus script
    const focusScript = getScriptPath('focus_window.ps1');
    if (fs.existsSync(focusScript)) {
      setTimeout(() => {
        exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${focusScript}" -TargetTitle "Meet" -ProcessName "chrome"`, (err, stdout) => {
          if (!err) console.log('[MeetingEngine] Window focus script output:', stdout.trim());
        });
      }, 700);
    }

    // 4. Adjust workstation audio volume to optimal 80% for clear client hearing
    const volScript = getScriptPath('volume.ps1');
    if (fs.existsSync(volScript)) {
      exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${volScript}" -Volume 80`, () => {});
    }

    this._activeMeeting = { ...meeting, status: 'in_progress', launchedAt: new Date().toISOString() };

    // Broadcast to UI
    if (this._broadcastFn) {
      this._broadcastFn({
        type: 'MEETING_PULLED_UP',
        meeting: this._activeMeeting,
        url: targetUrl,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    return {
      success: true,
      action: 'MEETING_LAUNCHED',
      url: targetUrl,
      title: meeting.title,
      clientName: meeting.clientName,
      dealValue: meeting.dealValue || 0,
      platform: meeting.platform,
      message: `Google Meet launched for ${meeting.clientName}. Workstation display focused and audio prepped.`
    };
  }
}

module.exports = new MeetingEngine();
