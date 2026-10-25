import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  Square, 
  RefreshCw, 
  Download, 
  Trash2, 
  AlertTriangle, 
  Maximize2,
  Video,
  Eye,
  Sliders
} from 'lucide-react';
import { playJarvisBeep } from '../utils/jarvisAudioSynth';

export default function VisionSentinelWidget({ onClose }) {
  const [isArmed, setIsArmed] = useState(true);
  const [selectedCam, setSelectedCam] = useState('cam-webcam');
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);
  const [motionLevel, setMotionLevel] = useState(0);
  const [snapshots, setSnapshots] = useState(() => {
    const saved = localStorage.getItem('jasper_cctv_snapshots');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [
      { id: 1, time: 'Today, 04:12 PM', cam: 'Front Porch Cam', reason: 'Human Silhouette Detected' },
      { id: 2, time: 'Today, 11:30 AM', cam: 'Lab Entryway', reason: 'Door Motion Triggered' }
    ];
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const prevFrameRef = useRef(null);
  const animFrameRef = useRef(null);

  const cameras = [
    { id: 'cam-webcam', name: 'Workstation AI Lens (Live)', location: 'Desk Workstation', isLive: isWebcamActive },
    { id: 'cam-porch', name: 'Front Entrance RTSP', location: 'Main Gate', isLive: false, ip: 'rtsp://192.168.29.50:554/ch1' },
    { id: 'cam-lab', name: 'Hardware Lab Overhead', location: 'Server Rack', isLive: false, ip: 'rtsp://192.168.29.51:554/ch1' },
    { id: 'cam-living', name: 'Living Room Dome', location: 'Common Area', isLive: false, ip: 'rtsp://192.168.29.52:554/ch1' }
  ];

  // Start / Stop WebCam
  const startWebcam = async () => {
    try {
      playJarvisBeep('command');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsWebcamActive(true);
      startMotionDetection();
    } catch (err) {
      console.warn('Webcam access error:', err);
      setIsWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    playJarvisBeep('click');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsWebcamActive(false);
    setMotionDetected(false);
    setMotionLevel(0);
  };

  const startMotionDetection = () => {
    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current || !isArmed) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = 160;
        canvas.height = 120;
        ctx.drawImage(video, 0, 0, 160, 120);

        const currentFrame = ctx.getImageData(0, 0, 160, 120).data;
        if (prevFrameRef.current) {
          let diffCount = 0;
          for (let i = 0; i < currentFrame.length; i += 16) {
            const diff = Math.abs(currentFrame[i] - prevFrameRef.current[i]) +
                         Math.abs(currentFrame[i + 1] - prevFrameRef.current[i + 1]) +
                         Math.abs(currentFrame[i + 2] - prevFrameRef.current[i + 2]);
            if (diff > 90) diffCount++;
          }

          const score = Math.min(100, Math.round((diffCount / 80) * 100));
          setMotionLevel(score);

          if (score > 35) {
            setMotionDetected(true);
          } else {
            setMotionDetected(false);
          }
        }
        prevFrameRef.current = new Uint8ClampedArray(currentFrame);
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const takeSnapshot = () => {
    playJarvisBeep('command');
    const newSnap = {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cam: 'Workstation AI Lens',
      reason: 'Manual Operator Snapshot'
    };
    const updated = [newSnap, ...snapshots];
    setSnapshots(updated);
    localStorage.setItem('jasper_cctv_snapshots', JSON.stringify(updated));
  };

  const deleteSnapshot = (id) => {
    playJarvisBeep('click');
    const updated = snapshots.filter(s => s.id !== id);
    setSnapshots(updated);
    localStorage.setItem('jasper_cctv_snapshots', JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d14]/95 text-slate-100 rounded-2xl overflow-hidden border border-rose-500/25 backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-rose-500/20 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold font-orbitron tracking-wider text-rose-300 flex items-center gap-2 uppercase">
              Vision Sentinel & CCTV Feed
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500/40 text-rose-400 font-mono">
                {isArmed ? 'ARMED' : 'STANDBY'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Computer Vision Motion Sentry & Multi-Channel Feed
            </p>
          </div>
        </div>

        {/* Sentinel Mode Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              playJarvisBeep('command');
              setIsArmed(prev => !prev);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
              isArmed
                ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isArmed ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{isArmed ? 'Sentinel Armed' : 'Disarmed'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {/* Camera Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {cameras.map(c => (
            <button
              key={c.id}
              onClick={() => {
                playJarvisBeep('click');
                setSelectedCam(c.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                selectedCam === c.id
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${c.isLive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Video Viewport & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-3">
            <div className="relative aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl">
              {selectedCam === 'cam-webcam' ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${!isWebcamActive ? 'hidden' : ''}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {!isWebcamActive && (
                    <div className="text-center space-y-3 p-6">
                      <CameraOff className="w-10 h-10 text-slate-600 mx-auto" />
                      <div className="text-xs text-slate-400 font-mono">
                        Hardware Webcam feed is currently paused to save local GPU cycles.
                      </div>
                      <button
                        onClick={startWebcam}
                        className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg transition-transform hover:scale-105"
                      >
                        Activate Live Lens Stream
                      </button>
                    </div>
                  )}

                  {/* Motion Overlay HUD */}
                  {isWebcamActive && (
                    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-emerald-400 bg-black/60 px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE STREAM &bull; 30 FPS
                        </span>
                        {motionDetected && (
                          <span className="text-[11px] font-mono font-bold text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-500/60 animate-bounce flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> MOTION INTRUSION: {motionLevel}%
                          </span>
                        )}
                      </div>

                      {/* Crosshairs & Grid */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-25">
                        <div className="w-48 h-48 border border-rose-500 rounded-lg" />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-black/60 px-3 py-1.5 rounded-lg border border-slate-800">
                        <span>SENTINEL DETECTOR: ARMED</span>
                        <span>RES: 640x480 &bull; YOLO OPT</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Simulated RTSP Stream for CCTV Gate / Lab */
                <div className="text-center space-y-3 p-6">
                  <Video className="w-10 h-10 text-rose-400/50 mx-auto animate-pulse" />
                  <div className="text-xs font-semibold text-slate-200">
                    Connecting to Remote RTSP Sentry Stream...
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Gateway: {cameras.find(c => c.id === selectedCam)?.ip}
                  </div>
                  <span className="inline-block text-[10px] px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    Carrier Trunk / RTSP Buffer Ready
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stream Controls */}
            {selectedCam === 'cam-webcam' && isWebcamActive && (
              <div className="flex items-center justify-between">
                <button
                  onClick={stopWebcam}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Pause Stream
                </button>
                <button
                  onClick={takeSnapshot}
                  className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" /> Take Snapshot
                </button>
              </div>
            )}
          </div>

          {/* Snapshot Gallery & Intrusion Logs */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Security Event Log</span>
              <span className="text-[10px] font-mono text-rose-400">{snapshots.length} Records</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {snapshots.map(s => (
                <div key={s.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{s.cam}</span>
                    <button
                      onClick={() => deleteSnapshot(s.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer text-xs"
                      title="Delete record"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{s.time} &bull; {s.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Computer Vision Sentinel: {isArmed ? 'ARMED' : 'STANDBY'}</span>
        </div>
        <div className="text-rose-400">
          Intrusion Alarm: Silent Mode
        </div>
      </div>
    </div>
  );
}
