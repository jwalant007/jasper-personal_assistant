import React, { useRef, useEffect } from 'react';
import { Bot, Sparkles, Volume2, Mic, XCircle } from 'lucide-react';

export default function AiAvatarWidget({ 
  jasperState = 'idle', 
  isSpeaking = false, 
  isListening = false, 
  stateText = 'J.A.S.P.E.R. Active', 
  onClose 
}) {
  const canvasRef = useRef(null);

  const speaking = isSpeaking || jasperState === 'speaking';
  const listening = isListening || jasperState === 'listening';
  const processing = jasperState === 'processing';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animFrameId;
    let angle = 0;

    const render = () => {
      angle += processing ? 0.12 : 0.05;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Helper for safe roundRect
      const drawRoundedRect = (x, y, w, h, r) => {
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, w, h, r);
        } else {
          ctx.rect(x, y, w, h);
        }
      };

      // Outer Glow Halo
      const gradient = ctx.createRadialGradient(cx, cy, 30, cx, cy, 140);
      if (speaking) {
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
      } else if (listening) {
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
      } else if (processing) {
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
      } else {
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
      }
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.fill();

      // Outer Rotating Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * (processing ? 1.2 : 0.5));
      ctx.strokeStyle = speaking ? '#3b82f6' : listening ? '#10b981' : processing ? '#f59e0b' : '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, 95 + Math.sin(angle) * (processing ? 6 : 3), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Inner Pulse Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-angle * (processing ? 1.6 : 0.8));
      ctx.strokeStyle = processing ? '#06b6d4' : '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 18]);
      ctx.beginPath();
      ctx.arc(0, 0, 75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Avatar Face Core Outline
      ctx.beginPath();
      ctx.arc(cx, cy, 55, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = speaking ? '#60a5fa' : listening ? '#34d399' : processing ? '#fbbf24' : '#a78bfa';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Eyes
      const eyeOffset = 18;
      const eyeY = cy - 12;
      const blink = Math.sin(angle * 0.3) > 0.96 ? 2 : 7; // Occasional blink

      // Left Eye
      ctx.beginPath();
      ctx.ellipse(cx - eyeOffset, eyeY, 6, blink, 0, 0, Math.PI * 2);
      ctx.fillStyle = listening ? '#34d399' : processing ? '#fbbf24' : '#38bdf8';
      ctx.fill();

      // Right Eye
      ctx.beginPath();
      ctx.ellipse(cx + eyeOffset, eyeY, 6, blink, 0, 0, Math.PI * 2);
      ctx.fillStyle = listening ? '#34d399' : processing ? '#fbbf24' : '#38bdf8';
      ctx.fill();

      // Animated Mouth
      ctx.beginPath();
      const mouthY = cy + 18;
      if (speaking) {
        // Mouth opens and closes dynamically to voice output
        const mouthHeight = Math.abs(Math.sin(angle * 4)) * 14 + 3;
        ctx.ellipse(cx, mouthY, 14, mouthHeight, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#60a5fa';
        ctx.fill();
      } else if (listening) {
        // Smiling arc during listening
        ctx.arc(cx, mouthY - 4, 12, 0.2, Math.PI - 0.2);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (processing) {
        // Thinking pulsing wave bar
        const waveWidth = 16 + Math.sin(angle * 3) * 6;
        drawRoundedRect(cx - waveWidth / 2, mouthY, waveWidth, 4, 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      } else {
        // Neutral futuristic mouth bar
        drawRoundedRect(cx - 10, mouthY, 20, 4, 2);
        ctx.fillStyle = '#a78bfa';
        ctx.fill();
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrameId);
  }, [speaking, listening, processing]);

  return (
    <div className="bg-slate-950/90 border border-violet-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-md w-full mx-auto relative overflow-hidden flex flex-col items-center text-center">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between border-b border-violet-500/20 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-violet-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Live AI Avatar</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-rose-400">
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Avatar Canvas */}
      <div className="relative my-2">
        <canvas ref={canvasRef} width={300} height={300} className="w-[220px] h-[220px]" />
      </div>

      {/* Status Indicators */}
      <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-300">
        {speaking ? (
          <>
            <Volume2 className="w-4 h-4 text-blue-400 animate-bounce" />
            <span className="text-blue-300 font-semibold">J.A.S.P.E.R. Speaking...</span>
          </>
        ) : listening ? (
          <>
            <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-semibold">Listening to user...</span>
          </>
        ) : processing ? (
          <>
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-amber-300 font-semibold">Neural Processing & Synthesis...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>{stateText}</span>
          </>
        )}
      </div>
    </div>
  );
}
