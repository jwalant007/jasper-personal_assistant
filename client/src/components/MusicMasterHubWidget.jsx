import React, { useState, useEffect } from 'react';
import { getApiBase } from '../utils/apiConfig.js';
import { speakMessage } from '../utils/speakDeviceAudio.js';
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Radio, 
  XCircle, 
  Sparkles, 
  Flame 
} from 'lucide-react';

export default function MusicMasterHubWidget({ onClose }) {
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);

  const fetchNowPlaying = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/system/media/now-playing`);
      if (res.ok) {
        const data = await res.json();
        setNowPlaying(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMediaControl = async (action) => {
    try {
      await fetch(`${getApiBase()}/api/system/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      setTimeout(fetchNowPlaying, 300);
    } catch (e) {}
  };

  const handleVolumeControl = async (action) => {
    try {
      await fetch(`${getApiBase()}/api/system/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    } catch (e) {}
  };

  const toggleBriefingAudio = () => {
    if (!isPlayingBriefing) {
      const text = "Good day, Sir! J.A.S.P.E.R. Music and Media Master Hub is active. Ready to stream audio and controls.";
      speakMessage(text, () => setIsPlayingBriefing(false));
      setIsPlayingBriefing(true);
    } else {
      window.speechSynthesis.cancel();
      setIsPlayingBriefing(false);
    }
  };

  return (
    <div className="bg-slate-950/95 border border-purple-500/40 rounded-2xl p-6 text-slate-100 backdrop-blur-2xl shadow-2xl max-w-4xl w-full mx-auto relative overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/40 rounded-xl text-purple-400">
            <Music className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-purple-300 uppercase font-orbitron flex items-center gap-2">
              Music & Media Master Hub
            </h2>
            <p className="text-xs text-slate-400 font-mono">Spotify Controller • Media Transport Keys • Audio Briefings</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all">
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Now Playing Banner */}
      <div className="p-5 bg-slate-900/80 border border-purple-500/30 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-950/80 border border-purple-500/40 rounded-xl flex items-center justify-center text-purple-400 text-2xl shadow-lg shrink-0">
            🎵
          </div>
          <div>
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> {nowPlaying?.isPlaying ? '▶ Currently Playing' : '⏸ Desktop Media Status'}
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-0.5 truncate max-w-md">
              {nowPlaying?.title || 'Spotify / Desktop Media Controller'}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {nowPlaying?.artist ? `Artist: ${nowPlaying.artist}` : 'System Media Key Controller Active'}
            </p>
          </div>
        </div>

        {/* Media Transport Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleMediaControl('prev')}
            className="p-3 bg-slate-900 border border-slate-800 hover:border-purple-400 rounded-xl text-slate-300 hover:text-purple-300 transition-all"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleMediaControl('playpause')}
            className="p-3.5 bg-purple-500/20 border border-purple-400 rounded-xl text-purple-200 hover:bg-purple-500/30 transition-all shadow-lg shadow-purple-500/20"
          >
            <Play className="w-6 h-6" />
          </button>
          <button 
            onClick={() => handleMediaControl('next')}
            className="p-3 bg-slate-900 border border-slate-800 hover:border-purple-400 rounded-xl text-slate-300 hover:text-purple-300 transition-all"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Volume & Audio Briefing Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PC Volume Control Card */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-purple-400" /> Laptop Master Volume
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => handleVolumeControl('up')}
              className="flex-1 py-2 bg-slate-950 border border-slate-800 hover:border-purple-400 rounded-xl text-xs font-bold text-purple-200 transition-all flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-4 h-4 text-purple-400" /> Volume Up
            </button>
            <button 
              onClick={() => handleVolumeControl('down')}
              className="flex-1 py-2 bg-slate-950 border border-slate-800 hover:border-purple-400 rounded-xl text-xs font-bold text-purple-200 transition-all flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-4 h-4 text-slate-400" /> Volume Down
            </button>
            <button 
              onClick={() => handleVolumeControl('mute')}
              className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-rose-400 rounded-xl text-xs font-bold text-rose-300 transition-all"
            >
              <VolumeX className="w-4 h-4 text-rose-400" /> Mute
            </button>
          </div>
        </div>

        {/* Audio Briefing TTS Player */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" /> Voice Briefing Player
          </span>
          <button
            onClick={toggleBriefingAudio}
            className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400 rounded-xl text-xs font-bold text-purple-200 flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/10"
          >
            {isPlayingBriefing ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-purple-400" />}
            {isPlayingBriefing ? 'Pause Audio Briefing' : 'Play J.A.S.P.E.R. Audio Briefing'}
          </button>
        </div>
      </div>
    </div>
  );
}
