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
const callIntelligenceEngine = require('./callIntelligenceEngine');

const CONFIG_FILE = path.join(__dirname, 'data', 'telephony_config.json');
const LOGS_FILE = path.join(__dirname, 'data', 'telephony_logs.json');
const CONTACTS_FILE = path.join(__dirname, 'data', 'telephony_contacts.json');

const DEFAULT_CONTACTS = [
  {
    id: 'tc-mom',
    name: 'Mom',
    phone: '+91 98200 12345',
    category: 'Family',
    isVip: true,
    avatar: '❤️',
    avatarColor: 'from-pink-500 to-rose-500',
    notes: 'Family Priority • Whitelisted for screening bypass',
    lastInteraction: 'Incoming Call (Today)',
    source: 'permanent_store'
  },
  {
    id: 'tc-sarah',
    name: 'Sarah (Office Boss)',
    phone: '+91 98233 45678',
    category: 'Work',
    isVip: true,
    avatar: '💼',
    avatarColor: 'from-blue-500 to-cyan-500',
    notes: 'Engineering & Product Lead • High Urgency',
    lastInteraction: 'Project update',
    source: 'permanent_store'
  },
  {
    id: 'tc-rahul',
    name: 'Rahul (Football Coach)',
    phone: '+91 98765 43210',
    category: 'Personal',
    isVip: false,
    avatar: '⚽',
    avatarColor: 'from-emerald-500 to-teal-500',
    notes: 'Football trial coordinator • Autonomous Screening',
    lastInteraction: 'Practice scheduling',
    source: 'permanent_store'
  },
  {
    id: 'tc-miami',
    name: 'Miami Client ($17k Deal)',
    phone: '+1 305 555 0199',
    category: 'Client',
    isVip: true,
    avatar: '💎',
    avatarColor: 'from-amber-500 to-orange-500',
    notes: 'Enterprise contract client • Auto-hold Line 1',
    lastInteraction: 'Urgent contract signing',
    source: 'permanent_store'
  },
  {
    id: 'tc-mehta',
    name: 'Dr. Mehta (Dentist)',
    phone: '+91 98211 23456',
    category: 'Health',
    isVip: false,
    avatar: '🩺',
    avatarColor: 'from-teal-500 to-emerald-500',
    notes: 'Dental clinic appointment desk',
    lastInteraction: 'Appointment check',
    source: 'permanent_store'
  },
  {
    id: 'tc-alex',
    name: 'Alex (Auto Mechanic)',
    phone: '+91 98222 34567',
    category: 'Services',
    isVip: false,
    avatar: '🔧',
    avatarColor: 'from-amber-500 to-yellow-500',
    notes: 'Vehicle servicing center',
    lastInteraction: 'Car inspection',
    source: 'permanent_store'
  },
  {
    id: 'tc-fatih',
    name: 'Fatih Makes',
    phone: '+1 555 382 9901',
    category: 'Work',
    isVip: false,
    avatar: '🛠️',
    avatarColor: 'from-purple-500 to-indigo-500',
    notes: 'CAD Engineering partner',
    lastInteraction: 'Design review',
    source: 'permanent_store'
  },
  {
    id: 'tc-pizza',
    name: 'Pizza Express',
    phone: '+91 98244 56789',
    category: 'Services',
    isVip: false,
    avatar: '🍕',
    avatarColor: 'from-red-500 to-orange-500',
    notes: 'Local order desk',
    lastInteraction: 'Order',
    source: 'permanent_store'
  }
];

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

    if (!fs.existsSync(CONTACTS_FILE)) {
      fs.writeFileSync(CONTACTS_FILE, JSON.stringify(DEFAULT_CONTACTS, null, 2));
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

  // =========================================================================
  // TELEPHONY CONTACTS & SPEED DIAL DIRECTORY
  // =========================================================================

  getContacts() {
    try {
      if (!fs.existsSync(CONTACTS_FILE)) {
        fs.writeFileSync(CONTACTS_FILE, JSON.stringify(DEFAULT_CONTACTS, null, 2));
        return DEFAULT_CONTACTS;
      }
      return JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
    } catch {
      return DEFAULT_CONTACTS;
    }
  }

  saveContacts(contacts) {
    try {
      fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
      return true;
    } catch (e) {
      console.error('[TelephonyEngine] Error saving contacts:', e.message);
      return false;
    }
  }

  normalizePhone(phone = '') {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  findContactByPhone(number = '') {
    if (!number) return null;
    const targetNorm = this.normalizePhone(number);
    if (!targetNorm) return null;

    const contacts = this.getContacts();
    for (const c of contacts) {
      const cNorm = this.normalizePhone(c.phone);
      if (cNorm && (cNorm === targetNorm || targetNorm.endsWith(cNorm) || cNorm.endsWith(targetNorm))) {
        return c;
      }
    }
    return null;
  }

  /**
   * Synchronizes contacts from:
   * 1. Android Phone via ADB (Real Address Book, Call Logs, WhatsApp notifications)
   * 2. PhoneController Fallback contacts
   * 3. Database Social Contacts (WhatsApp / Instagram)
   * 4. Busy Mode Priority Contacts
   */
  async syncContacts(options = {}) {
    try {
      const existingContacts = this.getContacts();
      const contactMap = new Map();

      // Index existing contacts by normalized phone number
      for (const c of existingContacts) {
        const norm = this.normalizePhone(c.phone);
        if (norm) {
          contactMap.set(norm, { ...c });
        }
      }

      let primarySource = 'database';
      let newlyAdded = 0;

      // 1. Sync Live Android Phone Contacts & Call Logs via phoneController
      try {
        const phoneLiveContacts = await phoneController.syncPhoneContacts();
        if (phoneLiveContacts && phoneLiveContacts.length > 0) {
          primarySource = 'phone_adb';
          for (const pc of phoneLiveContacts) {
            const norm = this.normalizePhone(pc.phone);
            if (!norm) continue;

            if (contactMap.has(norm)) {
              const current = contactMap.get(norm);
              current.lastInteraction = pc.lastMessage || current.lastInteraction;
              current.source = pc.source || current.source || 'phone_adb';
            } else {
              contactMap.set(norm, {
                id: pc.id || `tc-adb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                name: pc.name || `Caller ${pc.phone}`,
                phone: pc.phone,
                category: pc.source === 'call_app' ? 'Recent Caller' : 'Personal',
                isVip: false,
                avatar: '📱',
                avatarColor: pc.avatarColor || 'from-cyan-500 to-blue-500',
                notes: pc.lastMessage || 'Synced from connected Android device',
                lastInteraction: pc.lastTimestamp || 'Live Synced',
                source: 'phone_adb'
              });
              newlyAdded++;
            }
          }
        }
      } catch (err) {
        console.log(`[TelephonyEngine] Notice: ADB phone contacts sync: ${err.message}`);
      }

      // 2. Incorporate phoneController dialer fallback contacts
      try {
        const fallbackContacts = phoneController.fallbackContacts();
        for (const fc of fallbackContacts) {
          const norm = this.normalizePhone(fc.phone);
          if (!norm) continue;

          if (!contactMap.has(norm)) {
            contactMap.set(norm, {
              id: `tc-fb-${fc.id}`,
              name: fc.name,
              phone: fc.phone,
              category: fc.category || 'Personal',
              isVip: fc.category === 'Family' || fc.category === 'Work',
              avatar: fc.avatar || '👤',
              avatarColor: 'from-blue-500 to-indigo-500',
              notes: fc.defaultTask || 'Dialer contact',
              lastInteraction: 'Address Book',
              source: 'phone_dialer'
            });
            newlyAdded++;
          }
        }
      } catch (_) {}

      // 3. Incorporate Database Social Contacts
      try {
        const dbManager = require('./database');
        const socialContacts = dbManager.getSocialContacts();
        if (socialContacts && Array.isArray(socialContacts)) {
          for (const sc of socialContacts) {
            const norm = this.normalizePhone(sc.phone);
            if (!norm) continue;

            if (!contactMap.has(norm)) {
              contactMap.set(norm, {
                id: `tc-soc-${sc.id}`,
                name: sc.name,
                phone: sc.phone,
                category: sc.name.includes('Mom') ? 'Family' : (sc.name.includes('Boss') ? 'Work' : 'Personal'),
                isVip: sc.name.includes('Mom') || sc.name.includes('Boss'),
                avatar: sc.name.includes('Mom') ? '❤️' : '👤',
                avatarColor: sc.avatarColor || 'from-emerald-500 to-cyan-500',
                notes: sc.lastMessage || 'Social contact thread',
                lastInteraction: sc.lastTimestamp || 'Active',
                source: 'database'
              });
              newlyAdded++;
            }
          }
        }
      } catch (_) {}

      // 4. Incorporate Busy Mode Priority Contacts
      try {
        const busyModeEngine = require('./busyModeEngine');
        const priorityContacts = busyModeEngine.getPriorityContacts();
        if (priorityContacts && Array.isArray(priorityContacts)) {
          for (const pc of priorityContacts) {
            const norm = this.normalizePhone(pc.phone);
            if (!norm) continue;

            if (contactMap.has(norm)) {
              contactMap.get(norm).isVip = true;
            } else {
              contactMap.set(norm, {
                id: pc.id || `tc-pri-${Date.now()}`,
                name: pc.name,
                phone: pc.phone,
                category: pc.category || 'VIP',
                isVip: true,
                avatar: '⭐',
                avatarColor: 'from-amber-500 to-rose-500',
                notes: 'Priority Whitelist contact',
                lastInteraction: 'Priority List',
                source: 'busy_mode'
              });
              newlyAdded++;
            }
          }
        }
      } catch (_) {}

      const merged = Array.from(contactMap.values());
      this.saveContacts(merged);

      if (this._broadcastFn) {
        this._broadcastFn({
          type: 'TELEPHONY_CONTACTS_SYNCED',
          count: merged.length,
          newlyAdded,
          source: primarySource,
          contacts: merged
        });
      }

      console.log(`[TelephonyEngine] Synced ${merged.length} contacts into Telephony Hub (Source: ${primarySource}, New: ${newlyAdded}).`);

      return {
        success: true,
        count: merged.length,
        newlyAdded,
        source: primarySource,
        contacts: merged,
        message: `Successfully synchronized ${merged.length} contacts into Telephony Hub!`
      };
    } catch (err) {
      console.error('[TelephonyEngine] Error syncing contacts:', err);
      return { success: false, error: err.message, contacts: this.getContacts() };
    }
  }

  addContact(contactData = {}) {
    const contacts = this.getContacts();
    const newContact = {
      id: `tc-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: contactData.name || 'New Contact',
      phone: contactData.phone || '+1 555 0000',
      category: contactData.category || 'Personal',
      isVip: Boolean(contactData.isVip),
      avatar: contactData.avatar || (contactData.isVip ? '⭐' : '👤'),
      avatarColor: contactData.avatarColor || 'from-cyan-500 to-blue-500',
      notes: contactData.notes || 'Manually added in Telephony Hub',
      lastInteraction: 'Just added',
      source: 'manual'
    };
    contacts.unshift(newContact);
    this.saveContacts(contacts);

    if (this._broadcastFn) {
      this._broadcastFn({ type: 'TELEPHONY_CONTACT_ADDED', contact: newContact });
    }
    return newContact;
  }

  updateContact(contactId, updates = {}) {
    const contacts = this.getContacts();
    const idx = contacts.findIndex(c => c.id === contactId);
    if (idx >= 0) {
      contacts[idx] = { ...contacts[idx], ...updates };
      this.saveContacts(contacts);
      if (this._broadcastFn) {
        this._broadcastFn({ type: 'TELEPHONY_CONTACT_UPDATED', contact: contacts[idx] });
      }
      return contacts[idx];
    }
    return null;
  }

  deleteContact(contactId) {
    let contacts = this.getContacts();
    const filtered = contacts.filter(c => c.id !== contactId);
    this.saveContacts(filtered);
    if (this._broadcastFn) {
      this._broadcastFn({ type: 'TELEPHONY_CONTACT_DELETED', contactId });
    }
    return true;
  }

  toggleVip(contactId) {
    const contacts = this.getContacts();
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      contact.isVip = !contact.isVip;
      if (contact.isVip && contact.avatar === '👤') contact.avatar = '⭐';
      this.saveContacts(contacts);
      if (this._broadcastFn) {
        this._broadcastFn({ type: 'TELEPHONY_CONTACT_UPDATED', contact });
      }
      return contact;
    }
    return null;
  }

  /**
   * 1-Click Simulation: Screen an inbound call from a specific synced contact
   */
  async screenCallForContact(contactId, customSpeech) {
    const contact = this.getContacts().find(c => c.id === contactId);
    if (!contact) throw new Error('Contact not found');

    const defaultSpeech = contact.isVip
      ? `Hey Jwalant, this is ${contact.name}. I have an urgent matter requiring your input right away.`
      : `Hi Jwalant, this is ${contact.name}. I was hoping we could catch up regarding our upcoming plans.`;

    const speechResult = customSpeech || defaultSpeech;
    const callSid = `sim-screen-${contact.id}-${Date.now()}`;

    const session = await callIntelligenceEngine.startScreening({
      callId: callSid,
      from: contact.phone,
      callerName: contact.name,
      speechResult,
      isSimulation: true,
      contact
    });

    return {
      success: true,
      callId: callSid,
      contact,
      session,
      message: `Initiated autonomous call screening for ${contact.name} (${contact.phone}).`
    };
  }

  /**
   * 1-Click Simulation: Quick dial out to a synced contact
   */
  async quickDialContact(contactId) {
    const contact = this.getContacts().find(c => c.id === contactId);
    if (!contact) throw new Error('Contact not found');

    let phoneResult = null;
    try {
      phoneResult = await phoneController.makeCall(contact.phone);
    } catch (_) {}

    const log = this._addLog({
      callSid: `outbound-${contact.id}-${Date.now()}`,
      direction: 'outbound',
      from: this.getConfig().ownerPhoneNumber || '+91 7984173128',
      callerName: contact.name,
      to: contact.phone,
      speechTranscript: `Outbound call to ${contact.name}`,
      status: 'dialed',
      isUrgent: contact.isVip
    });

    return {
      success: true,
      contact,
      log,
      phoneResult,
      message: `Outbound call placed to ${contact.name} (${contact.phone}).`
    };
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
  async handleInboundCall({ callSid, from, speechResult, isSimulation = false }) {
    const cfg = this.getConfig();
    const sid = callSid || (isSimulation ? `sim-call-${Date.now()}` : `call-${Date.now()}`);
    const callerNumber = from || (isSimulation ? '+13055550199' : 'Unknown Caller');
    const callerSpeech = speechResult || (isSimulation 
      ? "This is the Miami client on the line. We want to sign tonight for $17,000, but I have to leave in 20 minutes. I need Jwalant immediately."
      : "Incoming call connected. Awaiting caller speech.");
    
    console.log(`[TelephonyEngine] Inbound call received from ${callerNumber}: "${callerSpeech}"`);

    const analysis = this.analyzeCallerIntent(callerSpeech);

    // Caller ID lookup against Synced Telephony Contacts
    const matchedContact = this.findContactByPhone(callerNumber);
    if (matchedContact) {
      analysis.clientName = matchedContact.name;
      analysis.contact = matchedContact;
      if (matchedContact.isVip) {
        analysis.isUrgent = true;
        analysis.isVip = true;
      }
    }

    const log = this._addLog({
      callSid: sid,
      direction: 'inbound',
      from,
      callerName: analysis.clientName,
      contact: matchedContact || null,
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
          contact: matchedContact || null,
          analysis,
          speech: callerSpeech,
          timestamp: new Date().toLocaleTimeString()
        }
      });
    }

    // Mirror call into CallIntelligenceEngine for live call intelligence screening
    let intelligenceSession = null;
    try {
      intelligenceSession = await callIntelligenceEngine.startScreening({
        callId: sid,
        from,
        callerName: analysis.clientName,
        speechResult: callerSpeech,
        isSimulation,
        contact: matchedContact || null
      });
    } catch (_) {}

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
        relay,
        intelligenceSession
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
        const baseUrl = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || cfg.publicUrl || 'https://jasper-personal-assistant.onrender.com').replace(/\/$/, '');
        const call = await this._twilioClient.calls.create({
          to: cfg.ownerPhoneNumber,
          from: cfg.twilioPhoneNumber,
          twiml: `<Response>
            <Say voice="${cfg.voice || 'Polly.Brian'}">${speechPrompt}</Say>
            <Gather input="speech" timeout="6" action="${baseUrl}/api/telephony/owner-gather?relayId=${relayId}">
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
    if (etaMatch) {
      etaMinutes = parseInt(etaMatch[1], 10);
    } else if (/\bfive\b/i.test(ownerSpokenText)) {
      etaMinutes = 5;
    } else if (/\bten\b/i.test(ownerSpokenText)) {
      etaMinutes = 10;
    } else if (/\btwo\b/i.test(ownerSpokenText)) {
      etaMinutes = 2;
    } else if (/\bthree\b/i.test(ownerSpokenText)) {
      etaMinutes = 3;
    }

    const isDecline = /decline|cannot|can't|not now|busy|\bno\b|pass|reject|tomorrow|cancel|unavailable/i.test(ownerSpokenText);
    const isComing = !isDecline && (/on my way|coming|heading|in the car|driving|minute|be there|\byes\b|accept|okay|\bok\b|sure|joining|ready/i.test(ownerSpokenText) || etaMatch !== null);

    const ownerFeedback = isComing
      ? `Understood, Sir. Relaying your ETA of ${etaMinutes} ${etaMinutes === 1 ? 'minute' : 'minutes'} to the client on Line 1, and launching Google Meet on your workstation right now.`
      : `Understood, Sir. I have politely informed the client that you are unavailable tonight and will follow up with them tomorrow. The meeting has been stood down.`;

    relay.ownerResponse = {
      text: ownerSpokenText,
      isComing,
      etaMinutes,
      ownerFeedback,
      receivedAt: new Date().toLocaleTimeString()
    };
    relay.ownerLine.status = isComing ? 'CONNECTED_ACCEPTED' : 'CONNECTED_DECLINED';

    // Generate relay message back to the held client on Line 1
    const relayMessage = isComing
      ? `Thank you for holding. Jwalant has been notified on his priority line and confirmed he is en route to his workstation right now. He expects to be online in the video conference room in approximately ${etaMinutes} ${etaMinutes === 1 ? 'minute' : 'minutes'}. I am pulling up the Google Meet room for you.`
      : `Thank you for holding. Jwalant has received your message. He is currently occupied in a priority engagement and cannot join the video call tonight. He has noted the contract terms and will reach out to you directly tomorrow morning.`;

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
