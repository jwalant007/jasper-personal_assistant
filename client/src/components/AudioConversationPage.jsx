import React, { useState, useEffect, useRef } from 'react';
import ArcReactor from './ArcReactor';
import { Mic, MicOff, Volume2, VolumeX, X, Send, Radio, Sparkles, MessageSquare, Shield, Activity, ArrowLeft } from 'lucide-react';

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
  const [waveBars, setWaveBars] = useState(Array(24).fill(12));
  const chatScrollRef = useRef(null);

  // Equalizer animation when listening or speaking
  useEffect(() => {
    let interval;
    if (jasperState === 'speaking' || jasperState === 'listening') {
      interval = setInterval(() => {
        setWaveBars(prev => prev.map(() => Math.floor(Math.random() * 38) + 8));
      }, 90);
    } else {
      setWaveBars(Array(24).fill(10));
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
          label: 'Listening',
          subLabel: 'Capturing microphone input...',
          colorClass: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300',
          dotClass: 'bg-cyan-400 animate-ping'
        };
      case 'processing':
        return {
          label: 'Processing Audio',
          subLabel: 'Converting speech to text...',
          colorClass: 'border-violet-400/40 bg-violet-500/10 text-violet-300',
          dotClass: 'bg-violet-400 animate-pulse'
        };
      case 'thinking':
        return {
          label: 'Thinking',
          subLabel: 'Generating intelligence directive...',
          colorClass: 'border-indigo-400/40 bg-indigo-500/10 text-indigo-300',
          dotClass: 'bg-indigo-400 animate-pulse'
        };
      case 'speaking':
        return {
          label: 'Speaking',
          subLabel: 'Synthesizing voice playback...',
          colorClass: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200',
          dotClass: 'bg-cyan-400 animate-pulse'
        };
      case 'error':
        return {
          label: 'Microphone / System Notice',
          subLabel: 'Check permissions or retry speaking',
          colorClass: 'border-rose-400/40 bg-rose-500/10 text-rose-300',
          dotClass: 'bg-rose-400 animate-pulse'
        };
      default:
        return {
          label: 'Ready',
          subLabel: 'Tap microphone or central core to talk',
          colorClass: 'border-white/[0.1] bg-slate-900/80 text-slate-300',
          dotClass: 'bg-emerald-400'
        };
    }
  };

  const status = getStatusBadge();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B0D12] text-slate-100 overflow-hidden select-none animate-in fade-in duration-200 font-sans">
      
      {/* Ambient Radial Glow behind Core */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          jasperState === 'listening' ? 'bg-cyan-500/10' : 
          jasperState === 'processing' ? 'bg-violet-600/10' : 
          jasperState === 'thinking' ? 'bg-indigo-600/10' : 
          jasperState === 'speaking' ? 'bg-cyan-400/15' : 
          jasperState === 'error' ? 'bg-rose-600/10' : 'bg-cyan-900/5'
        }`}
      />

      {/* Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Return to Workspace"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm sm:text-base text-white tracking-tight">
                Jasper Voice Conversation
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full">
                Real-time
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Low-latency neural audio synthesis & voice recognition
            </span>
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 border border-white/[0.1] rounded-xl bg-slate-900/80 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Close</span>
        </button>
      </header>

      {/* Main Conversation Canvas */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden p-4 sm:p-6 gap-6">
        
        {/* Left: Breathing Core Visualizer & Sound Spectrum */}
        <div className="flex-1 flex flex-col items-center justify-center relative bg-slate-900/40 border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl shadow-2xl overflow-hidden">
          
          {/* Status Badge Tag */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium tracking-wide transition-all duration-300 ${status.colorClass}`}>
            <span className={`w-2 h-2 rounded-full ${status.dotClass}`} />
            <span>{status.label}</span>
          </div>
          
          <div className="mt-1 text-xs text-slate-400 text-center">
            {status.subLabel}
          </div>

          {/* Central Reactor Visualizer Component */}
          <div className="w-56 h-56 sm:w-72 sm:h-72 my-4 sm:my-6 relative cursor-pointer" onClick={onToggleListening}>
            <ArcReactor state={jasperState} onClick={onToggleListening} />
          </div>

          {/* Audio Equalizer Bars */}
          <div className="flex items-end justify-center gap-1.5 h-12 w-full max-w-xs px-4 py-2 border border-white/[0.06] rounded-xl bg-slate-950/60">
            {waveBars.map((height, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-100 ${
                  jasperState === 'listening' ? 'bg-rose-400' :
                  jasperState === 'speaking' ? 'bg-sky-400' :
                  jasperState === 'processing' ? 'bg-indigo-400' : 'bg-slate-700'
                }`}
                style={{ height: `${height}px` }}
              />
            ))}
          </div>

          {/* Voice Controls */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={onToggleListening}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer shadow-lg ${
                jasperState === 'listening'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
              }`}
            >
              {jasperState === 'listening' ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Listening... (Tap to pause)</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Tap to Speak</span>
                </>
              )}
            </button>

            {jasperState === 'speaking' && (
              <button
                onClick={onStopSpeaking}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium text-rose-300 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer"
                title="Stop speaking"
              >
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>Mute</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Transcript Card */}
        <div className="flex-1 flex flex-col bg-slate-900/40 border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
          
          {/* Audio Log Title */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-slate-950/40 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Live Transcript</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Synchronized audio stream
            </span>
          </div>

          {/* Scrollable Conversation Content */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-scroll p-5 space-y-4 assistant-workspace-scrollbar">
            
            {/* Display User Query */}
            {latestQuery ? (
              <div className="flex flex-col gap-1.5 bg-slate-950/60 border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-indigo-400" />
                    <span>You said</span>
                  </span>
                </div>
                <p className="text-slate-100 text-base font-normal leading-relaxed">
                  "{latestQuery}"
                </p>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-white/[0.06] rounded-xl">
                Ready to listen. Say "Hey Jasper" or tap the microphone.
              </div>
            )}

            {/* Display JASPER Spoken Response */}
            {latestResponse && (
              <div className="flex flex-col gap-2 bg-indigo-500/[0.06] border border-indigo-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between text-xs text-indigo-300 font-medium border-b border-white/[0.06] pb-2">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Jasper Response</span>
                  </span>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-100 font-normal text-base sm:text-lg">
                  {latestResponse}
                </div>
              </div>
            )}
          </div>

          {/* Quick Manual Text Fallback Bar */}
          <form onSubmit={handleSubmit} className="p-3.5 border-t border-white/[0.06] bg-slate-950/60 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Or type a question or command..."
              className="flex-1 bg-slate-900 border border-white/[0.08] rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 font-sans text-xs sm:text-sm outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer shadow-sm shadow-indigo-500/20"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </main>

      {/* Footer System Telemetry */}
      <footer className="relative z-10 px-6 py-2.5 border-t border-white/[0.06] bg-slate-950/90 flex justify-between items-center text-[11px] text-slate-500 font-sans">
        <span className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Duplex Voice Connection Active</span>
        </span>
        <span>Secure Local Audio Stream</span>
      </footer>
    </div>
  );
}
