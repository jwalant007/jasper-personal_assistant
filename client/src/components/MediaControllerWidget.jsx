import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, ExternalLink, Search, Radio, Headphones, X, Globe } from 'lucide-react';
import geminiClient from '../utils/geminiClient';
import { API_BASE } from '../utils/apiConfig';

export default function MediaControllerWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null); // null = no song loaded
  const [showAppPicker, setShowAppPicker] = useState(false);

  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // Poll real-time Windows System Media Transport Controls now-playing info
  useEffect(() => {
    let isMounted = true;

    const fetchNowPlaying = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/system/media/now-playing`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (!isMounted) return;

        if (data.success && data.title) {
          setCurrentTrack({
            title: data.title,
            artist: data.artist || 'Unknown Artist',
            album: data.album || '',
            duration: data.durationFormatted || '—:——',
            position: data.positionFormatted || '0:00',
            durationMs: data.durationMs || 0,
            positionMs: data.positionMs || 0,
            source: data.app || 'system'
          });
          setIsPlaying(data.isPlaying);
          if (data.durationMs > 0) {
            setProgress(Math.min(100, Math.max(0, (data.positionMs / data.durationMs) * 100)));
          }
        }
      } catch (e) {
        // Silent fail on network error
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Audio Spectrum visualizer canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barCount = 28;
      const barWidth = 3;
      const barGap = 2;
      const startX = (canvas.width - (barCount * (barWidth + barGap))) / 2;
      
      for (let i = 0; i < barCount; i++) {
        // Bouncing bars when playing, flatline when idle
        const baseHeight = isPlaying && currentTrack ? Math.random() * (canvas.height - 4) + 2 : 2;
        const x = startX + i * (barWidth + barGap);
        const y = canvas.height - baseHeight;
        
        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, '#00f0ff');
        gradient.addColorStop(1, '#0055ff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, baseHeight);
      }
      
      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, currentTrack]);

  // Handle play button — if no track, show app picker; otherwise toggle playback
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    sendMediaCommand('playpause');
  };

  const handleMediaAction = async (action) => {
    if (action === 'next') {
      setProgress(0);
      sendMediaCommand('next');
    } else if (action === 'prev') {
      setProgress(0);
      sendMediaCommand('prev');
    }
  };

  const sendMediaCommand = async (action) => {
    try {
      await fetch(`${API_BASE}/api/system/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    } catch (e) {
      console.warn("Failed to dispatch media command:", e);
    }
  };

  // Launch a music app and mark playback as active
  const launchMusicApp = async (appId) => {
    setShowAppPicker(false);

    const appConfig = {
      spotify: {
        type: 'native',
        appName: 'spotify',
        label: 'Spotify'
      },
      ytmusic: {
        type: 'url',
        url: 'https://music.youtube.com',
        label: 'YouTube Music'
      },
      youtube: {
        type: 'url',
        url: 'https://www.youtube.com',
        label: 'YouTube'
      }
    };

    const config = appConfig[appId];
    if (!config) return;

    try {
      if (config.type === 'native') {
        await fetch(`${API_BASE}/api/system/launch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appName: config.appName })
        });
      } else {
        await fetch(`${API_BASE}/api/system/launch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: config.url })
        });
      }
    } catch (e) {
      if (config.type === 'url') {
        window.open(config.url, '_blank');
      }
      console.warn(`Failed to launch ${config.label}`, e);
    }
  };

  // Build search URLs (only when track exists)
  const getSearchUrl = (platform) => {
    if (!currentTrack || !currentTrack.title) return '#';
    const query = encodeURIComponent(`${currentTrack.title} ${currentTrack.artist || ''}`.trim());
    const urls = {
      ytmusic: `https://music.youtube.com/search?q=${query}`,
      spotify: `https://open.spotify.com/search/${query}`,
      youtube: `https://www.youtube.com/results?search_query=${query}`
    };
    return urls[platform] || urls.ytmusic;
  };

  const openMusicLink = async (url) => {
    if (url === '#') return;
    try {
      await fetch(`${API_BASE}/api/system/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="sidebar-widget-card select-none" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="flex justify-between items-center border-b border-cyan-500/10 pb-1.5 mb-2.5">
        <span className="media-header-link" style={{ cursor: 'default' }}>
          <Music size={11} className="text-cyan-400" />
          SYSTEM MEDIA LINK
        </span>
        <div className="flex items-center space-x-1.5">
          <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[9px] font-mono font-bold">
            <Globe className="w-2.5 h-2.5 animate-spin-slow" />
            <span>LIVE TRANSLATE ACTIVE</span>
          </span>
          <span className="font-mono text-[8px] text-sky-500 uppercase tracking-widest font-bold">
            {!currentTrack ? 'IDLE' : isPlaying ? 'STREAMING' : 'PAUSED'}
          </span>
        </div>
      </div>


      <div className="flex flex-col gap-2 font-mono">

        {/* Track Info — empty state or active track */}
        {currentTrack && currentTrack.title ? (
          <div className="flex flex-col">
            <button
              onClick={() => openMusicLink(getSearchUrl('ytmusic'))}
              className="media-track-link"
              title={`Click to search "${currentTrack.title}"`}
            >
              <span className="truncate">{currentTrack.title}</span>
              <Search size={9} className="media-search-icon" />
            </button>
            <span className="media-artist-idle truncate">
              {currentTrack.artist}
            </span>
          </div>
        ) : (
          <div className="media-idle-state">
            <Headphones size={14} className="media-idle-icon" />
            <span className="media-idle-text">NO TRACK LOADED</span>
            <span className="media-idle-sub">Play music on PC to sync title</span>
          </div>
        )}

        {/* Dynamic Spectrum Equalizer */}
        <canvas 
          ref={canvasRef} 
          width={180} 
          height={20} 
          className="media-visualizer-canvas my-1 mx-auto block"
        />

        {/* Progress bar slider */}
        <div className="flex items-center gap-2 text-[8px] text-sky-600 font-bold select-none">
          <span>{currentTrack ? currentTrack.position || '0:00' : '0:00'}</span>
          <div className="progress-container flex-1">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{currentTrack ? currentTrack.duration || '—:——' : '—:——'}</span>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-between items-center mt-1">
          <button 
            onClick={() => handleMediaAction('prev')}
            className="btn-control p-1.5"
            title="Previous Track"
          >
            <SkipBack size={12} />
          </button>
          
          <button 
            onClick={handlePlayPause}
            className={`btn-control p-2 ${!currentTrack ? 'media-play-pulse' : ''} border-cyan-500/40 bg-cyan-950/20 text-cyan-400`}
            title={!currentTrack ? 'Choose Music App' : isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying && currentTrack ? <Pause size={14} className="text-cyan-400" /> : <Play size={14} className="text-cyan-400" />}
          </button>
          
          <button 
            onClick={() => handleMediaAction('next')}
            className="btn-control p-1.5"
            title="Next Track"
          >
            <SkipForward size={12} />
          </button>
        </div>

        {/* Quick Music Service Links */}
        <div className="media-service-links">
          <button 
            onClick={() => launchMusicApp('ytmusic')}
            className="media-service-btn media-service-ytm"
            title="Open YouTube Music"
          >
            <Radio size={8} />
            YT MUSIC
          </button>
          <button 
            onClick={() => launchMusicApp('spotify')}
            className="media-service-btn media-service-spotify"
            title="Open Spotify App"
          >
            <Music size={8} />
            SPOTIFY
          </button>
          <button 
            onClick={() => launchMusicApp('youtube')}
            className="media-service-btn media-service-yt"
            title="Open YouTube"
          >
            <Play size={8} />
            YOUTUBE
          </button>
        </div>
      </div>

      {/* App Picker Overlay */}
      {showAppPicker && (
        <div className="media-app-picker-overlay">
          <div className="media-app-picker">
            <div className="media-picker-header">
              <span className="media-picker-title">
                <Headphones size={12} />
                CHOOSE MUSIC APP
              </span>
              <button onClick={() => setShowAppPicker(false)} className="media-picker-close">
                <X size={12} />
              </button>
            </div>

            <div className="media-picker-options">
              <button 
                onClick={() => launchMusicApp('spotify')}
                className="media-picker-btn media-picker-spotify"
              >
                <div className="media-picker-icon">🎵</div>
                <div className="media-picker-label">Spotify</div>
                <div className="media-picker-desc">Desktop App</div>
              </button>

              <button 
                onClick={() => launchMusicApp('ytmusic')}
                className="media-picker-btn media-picker-ytm"
              >
                <div className="media-picker-icon">🎧</div>
                <div className="media-picker-label">YouTube Music</div>
                <div className="media-picker-desc">Browser</div>
              </button>

              <button 
                onClick={() => launchMusicApp('youtube')}
                className="media-picker-btn media-picker-yt"
              >
                <div className="media-picker-icon">▶️</div>
                <div className="media-picker-label">YouTube</div>
                <div className="media-picker-desc">Browser</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
