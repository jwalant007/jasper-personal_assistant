import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Mic, 
  Monitor, 
  Smartphone, 
  Tv, 
  Music, 
  HelpCircle, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  X,
  Play,
  Wallet,
  PhoneCall,
  Box,
  Globe,
  Cpu,
  Layers,
  Sliders,
  ExternalLink
} from 'lucide-react';

export default function UserManualWidget({ onClose, onExecuteCommand }) {
  const [activeTab, setActiveTab] = useState('voice');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleTestCommand = (cmdText) => {
    if (onExecuteCommand) {
      onExecuteCommand(cmdText);
      onClose();
    }
  };

  const voiceCommands = [
    {
      category: '💰 Financial Intelligence',
      phrase: 'Jasper, how much did I spend this month?',
      desc: 'Analyzes your current monthly expenditures, pocket money burn rate, and category breakdowns.',
      badge: 'CORE'
    },
    {
      category: '💰 Financial Intelligence',
      phrase: 'What about last month?',
      desc: 'Multi-turn follow-up question. JASPER maintains context and compares prior month expenditures.',
      badge: 'CONTEXT'
    },
    {
      category: '💰 Financial Intelligence',
      phrase: 'Jasper, how much can I safely spend this week?',
      desc: 'Calculates your safe weekly allowance based on remaining pocket money (₹2,000) and days left in the month.',
      badge: 'NEW'
    },
    {
      category: '💰 Financial Intelligence',
      phrase: 'Jasper, what subscriptions am I paying for?',
      desc: 'Scans transaction history and reports recurring commitments (Netflix, Spotify, AWS, JioFiber).',
      badge: 'NEW'
    },
    {
      category: '💰 Financial Intelligence',
      phrase: 'Jasper, what if I save 500 more every month?',
      desc: 'Runs What-If financial forecasting engine and projects 1-month to 5-year balance growth.',
      badge: 'SIMULATOR'
    },
    {
      category: '🌅 Executive Routines',
      phrase: 'Jasper, give me my morning briefing',
      desc: 'Combines current time, weather, today\'s tasks, financial snapshot, and unread notifications.',
      badge: 'POPULAR'
    },
    {
      category: '🛑 Voice Interruption',
      phrase: 'Jasper stop / Cancel that',
      desc: 'Immediately halts active audio narration or active tool execution.',
      badge: 'CONTROL'
    },
    {
      category: '📱 Mobile & Telephony',
      phrase: 'Jasper, answer this call and ask why they are calling',
      desc: 'Activates call screening via connected Android ADB or Twilio receptionist.',
      badge: 'TELEPHONY'
    },
    {
      category: '📱 Mobile & Telephony',
      phrase: 'Jasper, find my phone',
      desc: 'Rings your connected physical Android smartphone at maximum volume.',
      badge: 'ADB'
    },
    {
      category: '🎨 3D & Blender',
      phrase: 'Jasper, open Blender and create a basic stadium model',
      desc: 'Sends Python script to local Blender CLI and renders real 3D mesh.',
      badge: '3D CLI'
    },
    {
      category: '💻 PC Audio & Apps',
      phrase: 'Set PC volume to 75',
      desc: 'Adjusts Windows master output volume to specified percentage via PowerShell.',
      badge: 'PC'
    },
    {
      category: '📺 Samsung Smart TV',
      phrase: 'Turn off TV / Wake TV',
      desc: 'Sends power toggle commands or Wake-On-LAN magic packets to your Smart TV over LAN.',
      badge: 'TV'
    }
  ];

  const financeGuide = [
    { 
      title: 'Monthly Pocket Money & Allowance', 
      desc: 'JASPER is configured for your ₹2,000 monthly allowance. Daily burn rate is ₹66.67/day. Balances update in real time across checking, UPI wallets, and petty cash.' 
    },
    { 
      title: 'Autonomous Guardian Sentinel', 
      desc: 'If spending reaches 85% (₹1,700), JASPER flags approaching limit. If breached, an autonomous WhatsApp/SMS advisory is dispatched to your configured guardian contact.' 
    },
    { 
      title: 'Bank Statement CSV Import', 
      desc: 'In Pay Vault, click "Import Statement". Paste CSV rows in the format: "Date, Description, Amount, Type, Merchant". JASPER parses and categorizes all entries.' 
    },
    { 
      title: 'Adaptive Category Learning', 
      desc: 'In the Ledger, changing a category from the dropdown teaches JASPER: future transactions from that merchant will automatically inherit your chosen category.' 
    },
    { 
      title: 'Multi-Horizon Forecasting & What-If', 
      desc: 'Computes Base, Conservative, and Optimistic projections across 1m, 3m, 6m, 1y, 3y, and 5y horizons based on empirical net cash-flow burn rates.' 
    },
    { 
      title: 'Subscriptions & Recurring Charges', 
      desc: 'Detects repeat bills (Netflix, Spotify, Wifi, Cloud hosting) and displays total monthly commitments and annual financial impacts.' 
    }
  ];

  const phoneGuide = [
    { 
      title: 'Authentic Android Device Link (No Virtual Mocks)', 
      desc: 'JASPER connects strictly to real Android devices via Wireless ADB or USB cable. Zero simulated fake phones.' 
    },
    { 
      title: 'Wireless ADB Pairing Steps', 
      desc: '1. Settings → About Phone → tap "Build Number" 7 times.\n2. Developer Options → enable "Wireless Debugging".\n3. Note the IP & Port (e.g., 192.168.1.50:42931).\n4. Enter in Phone Control Widget and click "Connect Physical Mobile".' 
    },
    { 
      title: 'USB Cable Debugging', 
      desc: 'Connect phone via USB, enable USB Debugging in Developer Options, and check "Always allow from this computer" when prompted.' 
    },
    { 
      title: 'Live Screen Mirroring & Touch Input', 
      desc: 'Streams real screencaps from physical device via adb exec-out screencap. Click anywhere inside the phone canvas to tap coordinates.' 
    },
    { 
      title: 'Contacts & Notifications Sync', 
      desc: 'Pulls phone address book and status bar notifications using Android dumpsys notification and content provider queries.' 
    }
  ];

  const telephonyGuide = [
    { 
      title: 'Authentic Call Screening & Intelligence', 
      desc: 'Where supported by carrier and Android ADB, JASPER detects incoming calls, greets the caller, transcribes the caller\'s response, and asks whether you want the call transferred.' 
    },
    { 
      title: 'Twilio Cloud PSTN Configuration', 
      desc: 'In Telephony Config tab, enter Twilio Phone Number, Account SID, and Auth Token. Point your Twilio Voice Webhook to https://your-domain/api/telephony/voice-webhook.' 
    },
    { 
      title: 'Local ADB Call Interception', 
      desc: 'When Android is connected via ADB, JASPER monitors incoming ringing state and can answer or end calls via adb shell input keyevent 5 / 6.' 
    },
    { 
      title: 'Nuance Understanding', 
      desc: 'Distinguishes between tentative decisions ("Maybe tomorrow") vs. definite commitments ("Yes, 6 PM confirmed") and logs call context to memory.' 
    }
  ];

  const blenderGuide = [
    { 
      title: 'Local Blender 3D CLI Integration', 
      desc: 'Translates natural-language commands into Blender Python scripts executed via blender.exe in background mode (--background --python).' 
    },
    { 
      title: 'Blender Software Prerequisites', 
      desc: 'Install Blender 4.x from blender.org. Ensure blender.exe is in your Windows PATH or default install directory (C:\\Program Files\\Blender Foundation\\Blender 4.x).' 
    },
    { 
      title: 'Holographic Screen Visualization', 
      desc: 'Uses Three.js / WebGL for holographic screen rendering. Does not claim to be physical hologram hardware—clearly visualized as digital 3D viewport.' 
    },
    { 
      title: 'Supported Operations', 
      desc: 'Create meshes (stadiums, objects), set materials, position cameras, add floodlights, and render photorealistic output frames.' 
    }
  ];

  const satelliteGuide = [
    { 
      title: 'Public Internet Geospatial APIs', 
      desc: 'Obtains satellite and orbital telemetry exclusively through legitimate public web APIs: NASA GIBS TrueColor, RainViewer Cloud Radar, and WhereTheISS.at REST API.' 
    },
    { 
      title: 'Zero Consumer Hardware Claims', 
      desc: 'JASPER never claims that consumer laptop hardware is directly receiving satellite RF signals. All data is fetched transparently via standard HTTPS.' 
    },
    { 
      title: 'ISS Real-Time Orbit Tracking', 
      desc: 'Tracks live coordinates, altitude (418 km), velocity (27,600 km/h), and ground-track polyline of the International Space Station.' 
    },
    { 
      title: 'Global Weather Radar Layers', 
      desc: 'Overlays real-time precipitation radar frames on Leaflet maps with timestamps and rain intensity.' 
    }
  ];

  const pcGuide = [
    { title: 'App Launcher', desc: 'Directly launch Notepad, Chrome, Calculator, Task Manager, Command Prompt, or File Explorer.' },
    { title: 'System Diagnostics', desc: 'Queries real-time CPU core usage, total/available RAM memory, and active processes.' },
    { title: 'Windows Power Actions', desc: 'Trigger graceful system Shutdown, Restart, or Sleep with safety confirmation overrides.' },
    { title: 'Media Transport Control', desc: 'Interacts with Windows System Media Transport Controls to inspect active track metadata.' },
    { title: 'Smart TV LAN Discovery', desc: 'Scans Wi-Fi for Samsung Smart TVs on ports 8002/8001 and sends remote control commands via WebSocket.' }
  ];

  const faqItems = [
    { 
      q: 'Does JASPER use fake data or simulated phone calls?', 
      a: 'No. Following the Zero-Fake Directive, all mock data, simulated calls, and fake device connections have been removed. If a service or hardware is offline, JASPER clearly marks it "Setup Required" or "Offline".' 
    },
    { 
      q: 'How does JASPER handle my ₹2,000 monthly pocket money?', 
      a: 'Your monthly spending cap is set to ₹2,000. JASPER tracks your daily safe burn rate (₹66.67/day) and triggers Guardian warnings if you exceed 85% (₹1,700).' 
    },
    { 
      q: 'How do I run JASPER with Local AI (Ollama)?', 
      a: 'Install Ollama (ollama.ai) on your PC and run "ollama run llama3". JASPER automatically detects the local bridge on http://localhost:11434 and uses local processing for privacy-sensitive tasks.' 
    },
    { 
      q: 'How do I import my bank statements?', 
      a: 'Open Pay Vault & Guardian Hub, switch to the "Ledger & Statement Import" tab, click "Import Statement", and paste your CSV statement rows.' 
    },
    { 
      q: 'Does JASPER store my banking passwords or UPI PINs?', 
      a: 'NEVER. Under JASPER\'s Zero-Trust Security Model, UPI PINs, ATM PINs, CVVs, passwords, and OTPs are strictly prohibited from being stored or passed to AI models.' 
    }
  ];

  const filteredCommands = voiceCommands.filter(c => 
    c.phrase.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-cyan-500/20 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <BookOpen size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-orbitron font-extrabold text-base sm:text-lg tracking-wider text-cyan-300">
                  JASPER OS MASTER GUIDE &amp; SETUP REFERENCE
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ZERO-FAKE VERIFIED
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Official architecture, voice commands, hardware bridges, and integration setup guides
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1 p-2 border-b border-cyan-500/20 bg-slate-950/40 overflow-x-auto">
          {[
            { id: 'voice', label: 'Voice & AI Core', icon: Mic },
            { id: 'finance', label: 'Financial Intelligence', icon: Wallet },
            { id: 'phone', label: 'Android ADB Link', icon: Smartphone },
            { id: 'telephony', label: 'Call Assistant & PSTN', icon: PhoneCall },
            { id: 'blender', label: 'Blender 3D Studio', icon: Box },
            { id: 'satellite', label: 'Satellite & Geospatial', icon: Globe },
            { id: 'pc', label: 'PC & Smart TV', icon: Monitor },
            { id: 'faq', label: 'FAQ & Security', icon: HelpCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-xs transition-all shrink-0 ${
                  isActive 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-950/40 font-bold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: Voice Commands */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-2.5 text-cyan-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search voice commands (e.g. spend, morning, blender, volume, phone)..."
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <span className="text-[11px] font-mono text-cyan-400 text-right">
                  Showing {filteredCommands.length} commands
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCommands.map((cmd, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-2 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                          {cmd.category}
                        </span>
                        {cmd.badge && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        "{cmd.phrase}"
                      </p>
                      <p className="text-[11px] font-sans text-slate-400 mt-1">
                        {cmd.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 mt-1">
                      <button
                        onClick={() => copyToClipboard(cmd.phrase, idx)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span className="text-emerald-400 font-bold">COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>COPY PHRASE</span>
                          </>
                        )}
                      </button>

                      {onExecuteCommand && (
                        <button
                          onClick={() => handleTestCommand(cmd.phrase)}
                          className="flex items-center justify-center gap-1 py-1 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-[10px] border border-cyan-500/30 transition-colors font-bold"
                          title="Execute command in JASPER right now"
                        >
                          <Play size={10} fill="currentColor" />
                          <span>TEST</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Financial Intelligence */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-orbitron font-bold text-sm">
                  <Wallet size={18} />
                  <span>Personal Financial Intelligence &amp; Guardian Budget System</span>
                </div>
                <p className="text-xs text-slate-400">
                  Secure, encrypted financial center. Zero storage of PINs, passwords, or CVVs. Integrated with statement import and WhatsApp Guardian Sentinel.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {financeGuide.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-indigo-300">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Phone Uplink */}
          {activeTab === 'phone' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm">
                  <Smartphone size={18} />
                  <span>Physical Android Smartphone Bridge (Wireless ADB)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Direct connection to your real phone hardware using standard Android Debug Bridge (ADB).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {phoneGuide.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-cyan-300">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Telephony & Call Assistant */}
          {activeTab === 'telephony' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm">
                  <PhoneCall size={18} />
                  <span>JASPER Call Assistant &amp; Telephony Hub</span>
                </div>
                <p className="text-xs text-slate-400">
                  Screens incoming calls, extracts intent, and provides real-time in-call assistance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {telephonyGuide.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-cyan-300">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Blender 3D Studio */}
          {activeTab === 'blender' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm">
                  <Box size={18} />
                  <span>3D Hologram &amp; Blender Python CLI Automation</span>
                </div>
                <p className="text-xs text-slate-400">
                  Translates natural language instructions into real Blender Python rendering operations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {blenderGuide.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-cyan-300">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Satellite & Geospatial */}
          {activeTab === 'satellite' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm">
                  <Globe size={18} />
                  <span>Public Geospatial Feeds &amp; Orbital Satellite Tracking</span>
                </div>
                <p className="text-xs text-slate-400">
                  Real satellite imagery and orbital passes obtained via public authorized REST APIs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {satelliteGuide.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-cyan-300">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: PC & Smart TV */}
          {activeTab === 'pc' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm">
                  <Monitor size={18} />
                  <span>PC Command Center &amp; Smart TV Gateway</span>
                </div>
                <p className="text-xs text-slate-400">
                  Direct Windows system control and local network Smart TV integration.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pcGuide.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-cyan-300">{item.title}</h4>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: FAQ & Security */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <h4 className="font-mono text-xs font-bold text-cyan-300 flex items-center gap-2">
                    <HelpCircle size={14} className="text-cyan-400 shrink-0" />
                    {item.q}
                  </h4>
                  <p className="text-xs text-slate-300 pl-5 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-cyan-500/20 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>JASPER Unified Operating System • Zero-Fake Verified</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40 transition-colors"
          >
            CLOSE MANUAL
          </button>
        </div>

      </div>
    </div>
  );
}
