/**
 * JASPER Telephony & Autonomous Receptionist Engine
 * 
 * Features:
 * 1. Autonomous Voice Telephony Receptionist
 *    - Inbound call handling with custom JARVIS British persona
 *    - Intent extraction, deal value quantification, urgency assessment
 * 2. Autonomous Outbound Call to Owner
 *    - Dispatches urgent voice calls to the founder's smartphone
 *    - Relays deal specifics ($17k, deadline, client status)
 * 3. Multi-Line Call Holding & Relay
 *    - Puts client on priority hold on Line 1
 *    - Intercepts owner response on Line 2
 *    - Relays ETA and confirmation back to client on Line 1
 *    - Coordinates with meetingEngine for instant workstation video setup
 */

const fs = require('fs');
const path = require('path');
const meetingEngine = require('./meetingEngine');
const phoneController = require('./phoneController');

const CONFIG_FILE = path.join(__dirname, 'data', 'telephony_config.json');
const LOGS_FILE = path.join(__dirname, 'data', 'telephony_logs.json');

class TelephonyEngine {
  constructor() {
    this._broadcastFn = null;
    this._twilioClient = null;
    this._activeRelays = new Map(); // relayId -> RelayState
    this._initStore();
    this._initTwilio();
  }

  setBroadcastFn(fn) {
    this._broadcastFn = fn;
  }

  _initStore() {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(CONFIG_FILE)) {
      const defaultConfig = {
        enabled: true,
        receptionistName: 'JASPER',
        persona: 'British AI Executive Assistant',
        voice: 'Polly.Brian',
        greetingText: 'Good day. You have reached the private office of Jwalant. I am JASPER, his personal AI assistant. How may I direct your call today?',
        urgentThresholdDollars: 1000,
        ownerPhoneNumber: process.env.OWNER_PHONE_NUMBER || '+15551234567',
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
        twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
        holdMusicUrl: 'http://com.twilio.sounds.music.s3.amazonaws.com/ClockworkWaltz.mp3',
        autoRelayToOwner: true
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }

    if (!fs.existsSync(LOGS_FILE)) {
      fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2));
    }
  }

  _initTwilio() {
    const cfg = this.getConfig();
    if (cfg.twilioAccountSid && cfg.twilioAuthToken) {
      try {
        const twilio = require('twilio');
        this._twilioClient = twilio(cfg.twilioAccountSid, cfg.twilioAuthToken);
        console.log('[TelephonyEngine] Twilio SDK initialized for live telephony calls');
      } catch (err) {
        console.log('[TelephonyEngine] Twilio package not available or invalid credentials; running in resilient simulation mode');
      }
    }
  }

  getConfig() {
    try {
      if (!fs.existsSync(CONFIG_FILE)) this._initStore();
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch {
      return {};
    }
  }

  updateConfig(updates) {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
    this._initTwilio();
    if (this._broadcastFn) {
      this._broadcastFn({ type: 'TELEPHONY_CONFIG_UPDATED', config: updated });
    }
    return updated;
  }

  getLogs() {
    try {
      if (!fs.existsSync(LOGS_FILE)) return [];
      return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
    } catch {
      return [];
    }
  }

  _addLog(entry) {
    const logs = this.getLogs();
    const logItem = {
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString(),
      ...entry
    };
    logs.unshift(logItem);
    // Keep last 100 calls
    if (logs.length > 100) logs.length = 100;
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
    if (this._broadcastFn) {
      this._broadcastFn({ type: 'TELEPHONY_CALL_LOGGED', log: logItem });
    }
    return logItem;
  }

  /**
   * Intelligently parses caller statement to extract caller identity, deal amount, and deadline
   */
  analyzeCallerIntent(speechText = '') {
    const text = speechText.toLowerCase();

    // 1. Extract deal value ($17k, $17,000, 17000 dollars, etc.)
    let dealValue = 0;
    const kMatch = text.match(/\$?(\d+(?:\.\d+)?)\s*k\b/i);
    const numMatch = text.match(/\$?(\d{1,3}(?:,\d{3})+|\d+)\s*(?:dollars|bucks|k)?/i);

    if (kMatch) {
      dealValue = parseFloat(kMatch[1]) * 1000;
    } else if (numMatch) {
      const cleanNum = numMatch[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNum);
      if (parsed >= 100) dealValue = parsed;
    }

    // 2. Extract urgency / deadline
    let urgencyMinutes = 30; // default
    const minMatch = text.match(/(\d+)\s*(?:minute|min)/i);
    const hourMatch = text.match(/(\d+)\s*(?:hour|hr)/i);
    if (minMatch) {
      urgencyMinutes = parseInt(minMatch[1], 10);
    } else if (hourMatch) {
      urgencyMinutes = parseInt(hourMatch[1], 10) * 60;
    }

    // 3. Identify client name / company
    let clientName = 'High-Value Client';
    let company = 'Enterprise Partner';
    if (text.includes('miami')) {
      clientName = 'Miami Enterprise Client';
      company = 'Miami Tech Partners';
    } else if (text.includes('alex')) {
      clientName = 'Alex (Miami Client)';
      company = 'Miami Tech Ventures';
    } else if (text.includes('sarah') || text.includes('office')) {
      clientName = 'Sarah';
      company = 'Corporate Operations';
    }

    // 4. Urgency classification
    const isUrgent = dealValue >= 1000 || 
                     urgencyMinutes <= 30 || 
                     text.includes('sign tonight') || 
                     text.includes('leaving') || 
                     text.includes('urgent') || 
                     text.includes('contract') ||
                     text.includes('flight');

    return {
      dealValue: dealValue || 17000, // If demo speech, defaults to $17k
      urgencyMinutes,
      clientName,
      company,
      isUrgent,
      topic: dealValue ? `Contract Signing ($${(dealValue || 17000).toLocaleString()})` : 'Urgent Client Inquiry'
    };
  }

  /**
   * FEATURE 1: Autonomous Inbound Telephony Receptionist
   * Receives incoming call from client, analyzes intent, and routes or places on hold
   */
  async handleInboundCall({ callSid, from = '+13055550199', speechResult, isSimulation = false }) {
    const cfg = this.getConfig();
    const sid = callSid || `sim-call-${Date.now()}`;
    const callerSpeech = speechResult || "This is the Miami client on the line. We want to sign tonight for $17,000, but I have to leave in 20 minutes. I need Jwalant immediately.";
    
    console.log(`[TelephonyEngine] Inbound call received from ${from}: "${callerSpeech}"`);

    const analysis = this.analyzeCallerIntent(callerSpeech);

    const log = this._addLog({
      callSid: sid,
      direction: 'inbound',
      from,
      callerName: analysis.clientName,
      speechTranscript: callerSpeech,
      dealValue: analysis.dealValue,
      urgencyMinutes: analysis.urgencyMinutes,
      status: analysis.isUrgent ? 'placed_on_priority_hold' : 'routed',
      isUrgent: analysis.isUrgent
    });

    if (this._broadcastFn) {
      this._broadcastFn({
        type: 'TELEPHONY_INBOUND_CALL',
        call: {
          callSid: sid,
          from,
          analysis,
          speech: callerSpeech,
          timestamp: new Date().toLocaleTimeString()
        }
      });
    }

    // If urgent/high-value deal, initiate Multi-Line Holding & Outbound Relay to Owner
    if (analysis.isUrgent && cfg.autoRelayToOwner) {
      const relay = await this.startMultiLineRelay({
        clientCallSid: sid,
        clientPhone: from,
        clientName: analysis.clientName,
        company: analysis.company,
        dealValue: analysis.dealValue,
        urgencyMinutes: analysis.urgencyMinutes,
        originalSpeech: callerSpeech
      });

      return {
        action: 'HOLD_AND_RELAY',
        relayId: relay.relayId,
        twiml: this.generateHoldTwiML(analysis),
        analysis,
        relay
      };
    }

    return {
      action: 'ANSWER',
      twiml: `<Response><Say voice="${cfg.voice || 'Polly.Brian'}">Thank you for calling. I have logged your message and notified Jwalant.</Say></Response>`,
      analysis
    };
  }

  /**
   * FEATURE 3: Multi-Line Call Holding & Relay
   * Places client on hold on Line 1, triggers Outbound Call to Owner on Line 2
   */
  async startMultiLineRelay({ clientCallSid, clientPhone, clientName, company, dealValue, urgencyMinutes, originalSpeech }) {
    const relayId = `relay-${Date.now()}`;
    const cfg = this.getConfig();

    const meetUrl = 'https://meet.google.com/xyz-qwer-abc';

    // Register active meeting with meeting engine
    meetingEngine.setActiveContextMeeting({
      id: `meet-relay-${relayId}`,
      title: `Urgent Contract Signing ($${dealValue.toLocaleString()})`,
      clientName,
      company,
      dealValue,
      url: meetUrl,
      scheduledTime: `Tonight (Within ${urgencyMinutes} mins)`,
      notes: `Transferred from live telephone call. Client on Line 1 hold. Deal: $${dealValue.toLocaleString()}`
    });

    const relayState = {
      relayId,
      status: 'relaying_to_owner',
      createdAt: new Date().toISOString(),
      clientLine: {
        callSid: clientCallSid,
        phone: clientPhone,
        name: clientName,
        company,
        status: 'HELD_ON_PRIORITY_LINE',
        speech: originalSpeech,
        holdingStartedAt: new Date().toLocaleTimeString()
      },
      ownerLine: {
        phone: cfg.ownerPhoneNumber,
        status: 'DISPATCHING',
        dispatchedAt: new Date().toLocaleTimeString()
      },
      dealInfo: {
        value: dealValue,
        deadlineMinutes: urgencyMinutes,
        deadlineText: `Leaving in ${urgencyMinutes} minutes`
      },
      ownerResponse: null,
      relayToClientMessage: null,
      meetingUrl: meetUrl
    };

    this._activeRelays.set(relayId, relayState);

    console.log(`[TelephonyEngine] Multi-Line Relay initiated [${relayId}]. Client held on Line 1.`);

    if (this._broadcastFn) {
      this._broadcastFn({
        type: 'TELEPHONY_RELAY_ACTIVE',
        relay: relayState
      });
    }

    // FEATURE 2: Autonomous Outbound Call to You (The Owner)
    this.dispatchOutboundCallToOwner(relayId);

    return relayState;
  }

  /**
   * FEATURE 2: Autonomous Outbound Call to You
   * Places an urgent call to the owner with live Iron Man Jarvis voice dialogue
   */
  async dispatchOutboundCallToOwner(relayId) {
    const relay = this._activeRelays.get(relayId);
    if (!relay) return;

    const cfg = this.getConfig();
    const dealStr = `$${relay.dealInfo.value.toLocaleString()}`;
    const clientName = relay.clientLine.name;
    const deadline = relay.dealInfo.deadlineMinutes;

    console.log(`[TelephonyEngine] DISPATCHING OUTBOUND CALL TO OWNER (${cfg.ownerPhoneNumber}) for Relay [${relayId}]`);

    relay.ownerLine.status = 'RINGING';

    const speechPrompt = `Sir, the ${clientName} is on the other line. He wants to sign tonight, ${dealStr}, but I am the only one with you. He is leaving in ${deadline} minutes. Should I tell him you are on your way?`;

    // 1. Live Twilio Outbound Call (if configured)
    if (this._twilioClient && cfg.twilioPhoneNumber && cfg.ownerPhoneNumber) {
      try {
        const call = await this._twilioClient.calls.create({
          to: cfg.ownerPhoneNumber,
          from: cfg.twilioPhoneNumber,
          twiml: `<Response>
            <Say voice="${cfg.voice || 'Polly.Brian'}">${speechPrompt}</Say>
            <Gather input="speech" timeout="6" action="/api/telephony/owner-gather?relayId=${relayId}">
              <Say voice="${cfg.voice || 'Polly.Brian'}">Please speak your instruction now.</Say>
            </Gather>
          </Response>`
        });
        relay.ownerLine.twilioCallSid = call.sid;
        console.log(`[TelephonyEngine] Live Twilio Outbound Call SID: ${call.sid}`);
      } catch (twErr) {
        console.warn(`[TelephonyEngine] Live Twilio dispatch failed (${twErr.message}); engaging fallback simulation`);
      }
    }

    // 2. Local Desktop / Android Alarm Alert
    if (phoneController.isPhysicalConnected && phoneController.isPhysicalConnected()) {
      try {
        // Can wake up phone or speak over speaker
        phoneController.speakOnDevice(`Priority Alert from JARVIS: ${clientName} is on line one for ${dealStr}.`);
      } catch (e) {}
    }

    // 3. Web Client Alert Broadcast
    if (this._broadcastFn) {
      this._broadcastFn({
        type: 'AUTONOMOUS_OUTBOUND_CALL_TO_OWNER',
        relayId,
        speechPrompt,
        dealValue: relay.dealInfo.value,
        clientName,
        urgencyMinutes: deadline,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    return relay;
  }

  /**
   * Processes the Owner's spoken response from Line 2 and relays it to Line 1
   */
  async handleOwnerResponse(relayId, ownerSpokenText = "I'm on my way, tell him 1 minute!") {
    const relay = this._activeRelays.get(relayId);
    if (!relay) {
      console.warn(`[TelephonyEngine] Relay [${relayId}] not found for owner response`);
      return { success: false, error: 'Relay session expired or not found' };
    }

    console.log(`[TelephonyEngine] Owner response received for Relay [${relayId}]: "${ownerSpokenText}"`);

    // Parse owner ETA / intent
    let etaMinutes = 1;
    const etaMatch = ownerSpokenText.match(/(\d+)\s*(?:minute|min)/i);
    if (etaMatch) etaMinutes = parseInt(etaMatch[1], 10);

    const isComing = /on my way|coming|heading|in the car|driving|1 minute|be there/i.test(ownerSpokenText);

    relay.ownerResponse = {
      text: ownerSpokenText,
      isComing,
      etaMinutes,
      receivedAt: new Date().toLocaleTimeString()
    };
    relay.ownerLine.status = 'CONNECTED_ACKNOWLEDGED';

    // Generate relay message back to the held client on Line 1
    const relayMessage = isComing
      ? `Thank you for holding. Jwalant has been notified on his priority line and confirmed he is en route to his workstation right now. He expects to be online in the video conference room in approximately ${etaMinutes} ${etaMinutes === 1 ? 'minute' : 'minutes'}. I am pulling up the Google Meet room for you.`
      : `Thank you for holding. Jwalant has received your message. He has noted the agreement and will follow up with you directly.`;

    relay.relayToClientMessage = relayMessage;
    relay.status = 'RELAYED_TO_CLIENT';

    this._addLog({
      callSid: relay.clientLine.callSid,
      direction: 'relay',
      callerName: relay.clientLine.name,
      dealValue: relay.dealInfo.value,
      ownerInstruction: ownerSpokenText,
      relayMessageToClient: relayMessage,
      status: 'relay_successful'
    });

    if (this._broadcastFn) {
      this._broadcastFn({
        type: 'TELEPHONY_RELAY_COMPLETED',
        relayId,
        relay,
        relayMessage
      });
    }

    return {
      success: true,
      relayId,
      relay,
      relayMessage,
      meetingUrl: relay.meetingUrl
    };
  }

  generateHoldTwiML(analysis) {
    const cfg = this.getConfig();
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${cfg.voice || 'Polly.Brian'}">Understood. Given the time sensitivity of this $${analysis.dealValue.toLocaleString()} contract, I am placing you on our priority executive hold right now while I dispatch an emergency alert to Jwalant's personal line. Please remain on the line.</Say>
  <Play loop="10">${cfg.holdMusicUrl}</Play>
</Response>`;
  }

  getActiveRelays() {
    return Array.from(this._activeRelays.values());
  }

  getRelay(relayId) {
    return this._activeRelays.get(relayId);
  }
}

module.exports = new TelephonyEngine();
