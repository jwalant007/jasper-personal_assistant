import React, { useRef, useEffect } from 'react';
import { Bot, Sparkles, Volume2, Mic, XCircle } from 'lucide-react';

export default function AiAvatarWidget({ isSpeaking = false, isListening = false, stateText = 'J.A.S.P.E.R. Active', onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animFrameId;
    let angle = 0;

    const render = () => {
      angle += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Outer Glow Halo
      const gradient = ctx.createRadialGradient(cx, cy, 30, cx, cy, 140);
      gradient.addColorStop(0, isSpeaking ? 'rgba(59, 130, 246, 0.4)' : isListening ? 'rgba(16, 185, 129, 0.4)' : 'rgba(139, 92, 246, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.fill();

      // Outer Rotating Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * 0.5);
      ctx.strokeStyle = isSpeaking ? '#3b82f6' : isListening ? '#10b981' : '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, 95 + Math.sin(angle) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Inner Pulse Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-angle * 0.8);
      ctx.strokeStyle = '#06b6d4';
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
      ctx.strokeStyle = isSpeaking ? '#60a5fa' : '#a78bfa';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Eyes
      const eyeOffset = 18;
      const eyeY = cy - 12;
      const blink = Math.sin(angle * 0.3) > 0.96 ? 2 : 7; // Occasional blink

      // Left Eye
      ctx.beginPath();
      ctx.ellipse(cx - eyeOffset, eyeY, 6, blink, 0, 0, Math.PI * 2);
      ctx.fillStyle = isListening ? '#34d399' : '#38bdf8';
      ctx.fill();

      // Right Eye
      ctx.beginPath();
      ctx.ellipse(cx + eyeOffset, eyeY, 6, blink, 0, 0, Math.PI * 2);
      ctx.fillStyle = isListening ? '#34d399' : '#38bdf8';
      ctx.fill();

      // Animated Mouth (Lip-Sync when speaking)
      ctx.beginPath();
      const mouthY = cy + 18;
      if (isSpeaking) {
        // Mouth opens and closes dynamically to voice output
        const mouthHeight = Math.abs(Math.sin(angle * 4)) * 14 + 3;
        ctx.ellipse(cx, mouthY, 14, mouthHeight, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#60a5fa';
        ctx.fill();
      } else if (isListening) {
        // Smiling arc during listening
        ctx.arc(cx, mouthY - 4, 12, 0.2, Math.PI - 0.2);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        // Neutral futuristic mouth bar
        ctx.roundRect(cx - 10, mouthY, 20, 4, 2);
        ctx.fillStyle = '#a78bfa';
        ctx.fill();
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrameId);
  }, [isSpeaking, isListening]);

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
        {isSpeaking ? (
          <>
            <Volume2 className="w-4 h-4 text-blue-400 animate-bounce" />
            <span className="text-blue-300 font-semibold">J.A.S.P.E.R. Speaking...</span>
          </>
        ) : isListening ? (
          <>
            <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-semibold">Listening to user...</span>
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
