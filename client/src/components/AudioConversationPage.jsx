import React, { useState, useEffect, useRef } from 'react';
import ArcReactor from './ArcReactor';
import { Mic, MicOff, Volume2, VolumeX, X, Send, Radio, Sparkles, MessageSquare, Shield, Activity } from 'lucide-react';

export default function AudioConversationPage({
  jasperState,
  onToggleListening,
  latestQuery,
  latestResponse,
  speakingText,
  onStopSpeaking,
  onManualSubmit,
  onClose
}) {
  const [inputText, setInputText] = useState('');
  const [waveBars, setWaveBars] = useState(Array(24).fill(15));
  const chatScrollRef = useRef(null);

  // Equalizer animation when listening or speaking
  useEffect(() => {
    let interval;
    if (jasperState === 'speaking' || jasperState === 'listening') {
      interval = setInterval(() => {
        setWaveBars(prev => prev.map(() => Math.floor(Math.random() * 45) + 10));
      }, 90);
    } else {
      setWaveBars(Array(24).fill(12));
    }
    return () => clearInterval(interval);
  }, [jasperState]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [latestQuery, latestResponse, speakingText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onManualSubmit(inputText);
    setInputText('');
  };

  const getStatusBadge = () => {
    switch (jasperState) {
      case 'listening':
        return {
          label: 'VOICE RECOGNITION ACTIVE',
          subLabel: 'Speak your command or query clearly...',
          colorClass: 'border-orange-500/50 bg-orange-950/40 text-orange-400 glow-orange',
          dotClass: 'bg-orange-500 animate-ping'
        };
      case 'processing':
        return {
          label: 'PROCESSING NEURAL INTENT',
          subLabel: 'Synthesizing knowledge vectors...',
          colorClass: 'border-purple-500/50 bg-purple-950/40 text-purple-300',
          dotClass: 'bg-purple-400 animate-bounce'
        };
      case 'speaking':
        return {
          label: 'JASPER VOCALIZING RESPONSE',
          subLabel: 'Output audio transmission in progress...',
          colorClass: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300 glow-cyan',
          dotClass: 'bg-cyan-400 animate-pulse'
        };
      default:
        return {
          label: 'VOICE OVERRIDE STANDBY',
          subLabel: 'Tap microphone or central reactor to speak',
          colorClass: 'border-sky-500/30 bg-sky-950/20 text-sky-400',
          dotClass: 'bg-sky-500'
        };
    }
  };

  const status = getStatusBadge();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl text-cyan-50 overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
      
      {/* Background Holographic Grid */}
      <div className="hologram-grid opacity-60" />
      
      {/* Ambient Radial Glow behind Core */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          jasperState === 'listening' ? 'bg-orange-600/15' : 
          jasperState === 'processing' ? 'bg-purple-600/20' : 
          jasperState === 'speaking' ? 'bg-cyan-500/20' : 'bg-cyan-900/10'
        }`}
      />

      {/* Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-cyan-500/20 bg-black/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-orbitron font-extrabold text-base sm:text-lg tracking-[0.2em] text-cyan-400 glow-cyan leading-none">
                JASPER AUDIO CONVERSATION
              </h2>
              <span className="px-2 py-0.5 text-[9px] font-mono border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 rounded font-bold uppercase tracking-wider">
                LIVE VOICE LINK
              </span>
            </div>
            <span className="font-mono text-[10px] text-sky-500 tracking-wider mt-1 uppercase">
              STARK NEURAL SPEECH SYNTHESIZER & REAL-TIME SPEECH RECOGNITION
            </span>
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/40 rounded bg-cyan-950/40 hover:bg-cyan-900/60 hover:border-cyan-400 hover:text-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>EXIT AUDIO MODE</span>
        </button>
      </header>

      {/* Main Conversation Canvas */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden p-4 sm:p-6 gap-6">
        
        {/* Left / Top: Arc Reactor Visualizer & Sound Spectrum */}
        <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-b from-cyan-950/20 to-black/40 border border-cyan-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,240,255,0.05)] overflow-hidden">
          
          {/* Status Badge Tag */}
          <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 ${status.colorClass}`}>
            <span className={`w-2 h-2 rounded-full ${status.dotClass}`} />
            <span>{status.label}</span>
          </div>
          
          <div className="mt-1 text-[11px] font-mono text-sky-400 tracking-wide text-center">
            {status.subLabel}
          </div>

          {/* Central Reactor Visualizer Component */}
          <div className="w-64 h-64 sm:w-80 sm:h-80 my-4 sm:my-6 relative cursor-pointer" onClick={onToggleListening}>
            <ArcReactor state={jasperState} onClick={onToggleListening} />
          </div>

          {/* Dynamic Audio Equalizer Bars */}
          <div className="flex items-end justify-center gap-1.5 h-14 w-full max-w-sm px-4 py-2 border border-cyan-500/15 rounded-xl bg-black/40">
            {waveBars.map((height, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-t transition-all duration-100 ${
                  jasperState === 'listening' ? 'bg-orange-500 shadow-[0_0_8px_rgba(255,85,0,0.8)]' :
                  jasperState === 'speaking' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]' :
                  jasperState === 'processing' ? 'bg-purple-500 shadow-[0_0_8px_rgba(180,0,255,0.8)]' : 'bg-cyan-950'
                }`}
                style={{ height: `${height}px` }}
              />
            ))}
          </div>

          {/* Quick Voice Control Buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={onToggleListening}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-orbitron font-bold text-sm tracking-wider transition-all cursor-pointer shadow-lg ${
                jasperState === 'listening'
                  ? 'bg-orange-600 border-2 border-orange-400 text-white shadow-[0_0_25px_rgba(255,85,0,0.6)] animate-pulse'
                  : 'bg-cyan-950/80 border-2 border-cyan-500/50 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
              }`}
            >
              {jasperState === 'listening' ? (
                <>
                  <MicOff className="w-5 h-5 text-white animate-spin" />
                  <span>LISTENING... (TAP TO STOP)</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-cyan-400" />
                  <span>TAP TO SPEAK</span>
                </>
              )}
            </button>

            {jasperState === 'speaking' && (
              <button
                onClick={onStopSpeaking}
                className="flex items-center gap-2 px-4 py-3 rounded-full font-mono text-xs font-bold text-red-300 border border-red-500/40 bg-red-950/50 hover:bg-red-900 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                title="Mute / Stop Vocalization"
              >
                <VolumeX className="w-4 h-4 text-red-400" />
                <span>MUTE AUDIO</span>
              </button>
            )}
          </div>
        </div>

        {/* Right / Bottom: Live Audio Transcript & Spoken Response Card */}
        <div className="flex-1 flex flex-col bg-slate-900/60 border border-cyan-500/20 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          
          {/* Audio Log Title */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-500/20 bg-black/40 font-orbitron text-xs font-bold text-cyan-400 tracking-wider">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>LIVE AUDIO TRANSCRIPT</span>
            </div>
            <span className="font-mono text-[10px] text-sky-500 font-normal uppercase">
              ENHANCED HIGH-READABILITY TEXT
            </span>
          </div>

          {/* Scrollable Conversation Content */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Display User Query */}
            {latestQuery ? (
              <div className="flex flex-col gap-2 bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                <div className="flex items-center justify-between font-mono text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" />
                    <span>USER VOICE INPUT</span>
                  </span>
                  <span>CONFIRMED</span>
                </div>
                <p className="font-mono text-cyan-100 text-lg sm:text-xl font-medium tracking-wide">
                  "{latestQuery}"
                </p>
              </div>
            ) : (
              <div className="text-center py-8 font-mono text-xs text-sky-600/70 uppercase tracking-widest border border-dashed border-cyan-500/15 rounded-xl">
                Awaiting your spoken request, Sir...
              </div>
            )}

            {/* Display JASPER Spoken Response in 32px Font Size */}
            {latestResponse && (
              <div className="flex flex-col gap-3 bg-gradient-to-br from-cyan-950/60 to-black/80 border-2 border-cyan-500/40 rounded-xl p-6 shadow-[0_0_25px_rgba(0,240,255,0.2)]">
                <div className="flex items-center justify-between font-orbitron text-xs text-cyan-400 font-extrabold uppercase tracking-widest border-b border-cyan-500/20 pb-2">
                  <span className="flex items-center gap-2 glow-cyan">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                    <span>JASPER VOCAL TRANSMISSION</span>
                  </span>
                  <span className="font-mono text-[10px] text-sky-400 font-normal">20PX TEXT</span>
                </div>

                {/* 20px Spoken Response Text Display */}
                <div 
                  className="whitespace-pre-wrap leading-snug font-sans text-cyan-50 glow-cyan tracking-wide font-normal"
                  style={{ fontSize: '20px', textShadow: '0 0 10px rgba(0, 240, 255, 0.4)' }}
                >
                  {latestResponse}
                </div>
              </div>
            )}
          </div>

          {/* Quick Manual Text Fallback Bar */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-cyan-500/20 bg-black/60 flex items-center gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Or type a question / command manually here..."
              className="flex-1 bg-black/60 border border-cyan-500/30 rounded-lg px-4 py-3 text-cyan-100 placeholder-sky-700/80 font-mono text-sm sm:text-base outline-none focus:border-cyan-400 transition-all"
              style={{ fontSize: '16px' }}
            />
            <button
              type="submit"
              className="flex items-center justify-center px-5 py-3 bg-cyan-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono font-bold text-sm rounded-lg hover:bg-cyan-900 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>SEND</span>
            </button>
          </form>
        </div>
      </main>

      {/* Footer System Telemetry */}
      <footer className="relative z-10 px-6 py-2 border-t border-cyan-500/15 bg-black/80 flex justify-between items-center text-[10px] font-mono text-sky-600/70 uppercase">
        <span className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-cyan-500" />
          <span>STARK HOLOGRAPHIC AUDIO INTERFACE v4.1</span>
        </span>
        <span>STATUS: BI-DIRECTIONAL AUDIO LINK ACTIVE</span>
      </footer>
    </div>
  );
}
