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
  Gamepad2, 
  ShieldCheck, 
  Zap, 
  X,
  Play
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
      category: '🎮 Gaming & Mobile Apps',
      phrase: 'Jasper open ffc mobile and play matches',
      desc: 'Launches EA SPORTS FC Mobile on your connected phone or Virtual Uplink and initializes match mode.',
      badge: 'POPULAR'
    },
    {
      category: '🎮 Gaming & Mobile Apps',
      phrase: 'Jasper open whatsapp',
      desc: 'Opens WhatsApp on your connected Android device.'
    },
    {
      category: '💻 PC Volume & Audio',
      phrase: 'Set PC volume to 75',
      desc: 'Adjusts Windows master output volume to specified percentage.'
    },
    {
      category: '💻 PC Volume & Audio',
      phrase: 'Mute PC audio / Unmute PC audio',
      desc: 'Toggles Windows audio mute state.'
    },
    {
      category: '💻 PC Application Control',
      phrase: 'Open notepad / launch chrome / open calculator',
      desc: 'Launches native Windows applications directly.'
    },
    {
      category: '📺 Samsung Smart TV',
      phrase: 'Turn off TV / Wake TV',
      desc: 'Sends power toggles or Wake-On-LAN magic packets to your Samsung Smart TV.'
    },
    {
      category: '📺 Samsung Smart TV',
      phrase: 'TV volume up / TV volume down / mute TV',
      desc: 'Adjusts television volume over WebSocket (8002/8001) or Legacy TCP (55000).'
    },
    {
      category: '🎵 Media & Spotify',
      phrase: 'Play music / pause music / skip song / previous song',
      desc: 'Controls Spotify playback or ambient audio stream.'
    },
    {
      category: '📈 Real-time Market Intel',
      phrase: 'Check stock price of TSLA / what is BTC price',
      desc: 'Fetches real-time Yahoo Finance stock and crypto market tickers.'
    },
    {
      category: '🌐 Web Search & News',
      phrase: 'Search internet for latest AI news',
      desc: 'Scrapes live web search results via DuckDuckGo.'
    }
  ];

  const pcGuide = [
    { title: 'App Launcher', desc: 'Directly launch Notepad, Chrome, Calculator, Task Manager, Command Prompt, or File Explorer.' },
    { title: 'System Diagnostics', desc: 'Queries real-time CPU core usage, total/available RAM memory, and active processes.' },
    { title: 'Windows Power Actions', desc: 'Trigger graceful system Shutdown, Restart, or Sleep with safety confirmation overrides.' },
    { title: 'Media Transport Control', desc: 'Interacts with Windows System Media Transport Controls to inspect active track metadata.' }
  ];

  const phoneGuide = [
    { title: 'Virtual ADB Phone Uplink', desc: 'When no physical phone is connected, JASPER automatically activates the Virtual Phone Uplink (Galaxy S24 Ultra, Android 14) so all phone features work out-of-the-box.' },
    { title: 'Physical Phone Pairing (Wireless ADB)', desc: 'Enable USB Debugging & Wireless ADB on your Android phone, then enter your phone IP (e.g. 192.168.1.50:5555) in the Phone Control Widget.' },
    { title: 'Cellular Calls & SMS Prefill', desc: 'Initiate direct phone dialer actions or prefill text messages to your phone contacts.' },
    { title: 'EA SPORTS FC Mobile & App Aliases', desc: 'Saying "open ffc mobile" automatically maps to package com.ea.gp.fifamobile and launches the game.' },
    { title: 'Contacts & Notifications Sync', desc: 'Read active phone notifications or sync mobile address book contacts directly into JASPER.' }
  ];

  const tvGuide = [
    { title: 'LAN Subnet Auto-Discovery', desc: 'On server startup, JASPER scans your Wi-Fi network (ports 8002, 8001, 55000) for Samsung Smart TVs and connects automatically.' },
    { title: 'Virtual Smart TV Gateway', desc: 'If your TV is off or disconnected, JASPER uses the Virtual TV Gateway (Samsung Neo QLED 8K) so remote commands never throw errors.' },
    { title: 'First-Time TV Authorization', desc: 'When connecting to a real TV for the first time, select "Allow Remote Control" on your TV screen.' },
    { title: 'Wake-On-LAN (WOL)', desc: 'Sends network magic packets to turn on TVs in standby mode when MAC address is saved.' }
  ];

  const spotifyGuide = [
    { title: 'Zero-Config Ambient Media Engine', desc: 'Without Spotify Client ID setup, JASPER plays ambient neural stream audio so playback buttons work immediately.' },
    { title: 'Spotify OAuth PKCE Integration', desc: 'Enter your Spotify Developer Client ID in Spotify Controller settings to authorize your personal Spotify account.' }
  ];

  const faqItems = [
    { q: 'Do I need a physical Android phone to test phone features?', a: 'No! JASPER includes a high-fidelity Virtual ADB Phone Uplink (Galaxy S24 Ultra, 94% battery) that simulates calls, SMS, contacts, and screenshots out of the box.' },
    { q: 'Why does Samsung TV status show Virtual Gateway?', a: 'If your Samsung TV is powered off or not detected on your Wi-Fi subnet, JASPER seamlessly switches to Virtual Gateway mode so remote commands work without crashing.' },
    { q: 'Where is my Google Gemini API Key stored?', a: 'API keys are stored securely in your browser localStorage under "jasper_gemini_key". If unconfigured, JASPER operates using built-in local offline parsers.' },
    { q: 'What port does the JASPER server run on?', a: 'The Node.js Express server runs on port 3001 (http://localhost:3001). Mobile apps use dynamic getApiBase() to connect over LAN.' }
  ];

  const filteredCommands = voiceCommands.filter(c => 
    c.phrase.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-cyan-500/20 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BookOpen size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-orbitron font-extrabold text-base sm:text-lg tracking-wider text-cyan-300">
                  JASPER USER MANUAL &amp; APP GUIDE
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  v1.0.1
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Official operational manual, voice phrases, and hardware bridge instructions
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
        <div className="flex items-center gap-1 p-2 border-b border-cyan-500/20 bg-slate-950/30 overflow-x-auto">
          {[
            { id: 'voice', label: 'Voice Commands', icon: Mic },
            { id: 'pc', label: 'PC Control', icon: Monitor },
            { id: 'phone', label: 'Phone Uplink', icon: Smartphone },
            { id: 'tv', label: 'Smart TV', icon: Tv },
            { id: 'spotify', label: 'Media & Spotify', icon: Music },
            { id: 'faq', label: 'FAQ & Setup', icon: HelpCircle }
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
                    placeholder="Search voice commands (e.g. ffc mobile, tv, volume, stock)..."
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
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
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

          {/* TAB 2: PC Control */}
          {activeTab === 'pc' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm">
                  <Monitor size={18} />
                  <span>PC Command Center Capabilities</span>
                </div>
                <p className="text-xs text-slate-400">
                  JASPER connects directly to your Windows host environment using local PowerShell automation and Node.js system APIs.
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

          {/* TAB 3: Phone Uplink */}
          {activeTab === 'phone' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm">
                  <Smartphone size={18} />
                  <span>Android Phone Bridge &amp; FFC Mobile Controls</span>
                </div>
                <p className="text-xs text-slate-400">
                  Supports physical ADB devices as well as the zero-config **Virtual ADB Uplink** mode.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {phoneGuide.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-cyan-300">{item.title}</h4>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Smart TV */}
          {activeTab === 'tv' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm">
                  <Tv size={18} />
                  <span>Samsung Smart TV Protocol &amp; Auto-Discovery</span>
                </div>
                <p className="text-xs text-slate-400">
                  Integrates Samsung Tizen OS WebSockets (Ports 8002/8001), Legacy Samsung TCP (Port 55000), and Wake-on-LAN.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tvGuide.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-cyan-300">{item.title}</h4>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Spotify */}
          {activeTab === 'spotify' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold text-sm">
                  <Music size={18} />
                  <span>Media Controls &amp; Spotify Engine</span>
                </div>
                <p className="text-xs text-slate-400">
                  Zero-config playback works immediately via the JASPER Ambient Audio Engine or your personal Spotify account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {spotifyGuide.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-cyan-300">{item.title}</h4>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: FAQ */}
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
            <span>JASPER Autonomous AI Protocol v1.0.1 Active</span>
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
