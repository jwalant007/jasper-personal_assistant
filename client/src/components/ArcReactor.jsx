import React, { useEffect, useRef } from 'react';

export default function ArcReactor({ state = 'idle', onClick }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const phaseRef = useRef(0);
  const pulseRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const clientW = canvas.parentElement.clientWidth || 220;
      const clientH = canvas.parentElement.clientHeight || 220;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      
      width = clientW;
      height = clientH;
      
      canvas.width = Math.floor(clientW * dpr);
      canvas.height = Math.floor(clientH * dpr);
      canvas.style.width = `${clientW}px`;
      canvas.style.height = `${clientH}px`;
      
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();

    const draw = (currentTime) => {
      if (!canvas || !ctx) return;
      animationRef.current = requestAnimationFrame(draw);

      const elapsed = currentTime - lastTime;
      lastTime = currentTime;
      const dt = Math.min(elapsed / 16.667, 2.0);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.36;

      // Color themes based on system status (Premium Sci-Fi Minimalism: Electric Cyan & Subtle Violet)
      let primaryColor = 'rgba(103, 223, 255, ';   // Electric cyan #67DFFF
      let secondaryColor = 'rgba(56, 189, 248, '; // Sky cyan
      let accentColor = 'rgba(157, 140, 255, ';   // Subtle violet #9D8CFF
      let speed = 0.014;

      if (state === 'listening') {
        // Active audio capture
        primaryColor = 'rgba(103, 223, 255, ';
        secondaryColor = 'rgba(147, 240, 255, ';
        accentColor = 'rgba(56, 189, 248, ';
        speed = 0.042;
        pulseRef.current = 1 + Math.sin(currentTime * 0.009) * 0.09;
      } else if (state === 'processing') {
        // Speech to text conversion
        primaryColor = 'rgba(157, 140, 255, ';
        secondaryColor = 'rgba(192, 178, 255, ';
        accentColor = 'rgba(103, 223, 255, ';
        speed = 0.055;
        pulseRef.current = 1 + Math.sin(currentTime * 0.016) * 0.06;
      } else if (state === 'thinking') {
        // AI model inference
        primaryColor = 'rgba(157, 140, 255, ';
        secondaryColor = 'rgba(103, 223, 255, ';
        accentColor = 'rgba(139, 92, 246, ';
        speed = 0.038;
        pulseRef.current = 1 + Math.sin(currentTime * 0.012) * 0.05;
      } else if (state === 'speaking') {
        // TTS playback
        primaryColor = 'rgba(103, 223, 255, ';
        secondaryColor = 'rgba(157, 140, 255, ';
        accentColor = 'rgba(56, 189, 248, ';
        speed = 0.032;
        pulseRef.current = 1 + Math.sin(currentTime * 0.008) * 0.12;
      } else if (state === 'error') {
        // Error / failure state
        primaryColor = 'rgba(239, 68, 68, ';
        secondaryColor = 'rgba(245, 158, 11, ';
        accentColor = 'rgba(220, 38, 38, ';
        speed = 0.018;
        pulseRef.current = 1 + Math.sin(currentTime * 0.005) * 0.04;
      } else {
        // Idle calm breathing
        speed = 0.01;
        pulseRef.current = 1 + Math.sin(currentTime * 0.002) * 0.03;
      }

      phaseRef.current += speed * dt;
      const r = baseRadius * pulseRef.current;

      // 1. SOFT VOLUMETRIC ATMOSPHERIC AURA
      const aura = ctx.createRadialGradient(centerX, centerY, r * 0.1, centerX, centerY, r * 1.6);
      aura.addColorStop(0, primaryColor + '0.22)');
      aura.addColorStop(0.5, secondaryColor + '0.06)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // 2. INTERNAL FLUID ENERGY LAYERS (Smooth swirling filament waves)
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.clip();

      // Deep celestial sphere background
      const sphereBg = ctx.createRadialGradient(
        centerX - r * 0.25, 
        centerY - r * 0.25, 
        r * 0.05, 
        centerX, 
        centerY, 
        r
      );
      sphereBg.addColorStop(0, primaryColor + '0.38)');
      sphereBg.addColorStop(0.45, accentColor + '0.20)');
      sphereBg.addColorStop(0.85, 'rgba(17, 22, 32, 0.95)');
      sphereBg.addColorStop(1, 'rgba(11, 13, 18, 0.98)');
      ctx.fillStyle = sphereBg;
      ctx.fillRect(centerX - r, centerY - r, r * 2, r * 2);

      // Swirling fluid wave filaments (4 smooth bezier bands)
      for (let i = 0; i < 4; i++) {
        const angle = phaseRef.current + (i * Math.PI) / 2;
        const waveGrad = ctx.createLinearGradient(
          centerX - r * Math.cos(angle),
          centerY - r * Math.sin(angle),
          centerX + r * Math.cos(angle),
          centerY + r * Math.sin(angle)
        );
        waveGrad.addColorStop(0, i % 2 === 0 ? primaryColor + '0.65)' : secondaryColor + '0.5)');
        waveGrad.addColorStop(0.5, accentColor + '0.65)');
        waveGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.strokeStyle = waveGrad;
        ctx.lineWidth = 2.2 + Math.sin(phaseRef.current + i) * 1.2;
        ctx.beginPath();
        
        const cp1x = centerX + Math.cos(angle * 1.2) * (r * 0.7);
        const cp1y = centerY + Math.sin(angle * 0.8) * (r * 0.7);
        const cp2x = centerX - Math.cos(angle * 0.9) * (r * 0.6);
        const cp2y = centerY - Math.sin(angle * 1.1) * (r * 0.6);

        ctx.moveTo(centerX - Math.cos(angle) * r, centerY - Math.sin(angle) * r);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, centerX + Math.cos(angle) * r, centerY + Math.sin(angle) * r);
        ctx.stroke();
      }

      // Ethereal core light flare
      const coreFlare = ctx.createRadialGradient(
        centerX - r * 0.2, 
        centerY - r * 0.2, 
        0, 
        centerX, 
        centerY, 
        r * 0.5
      );
      coreFlare.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      coreFlare.addColorStop(0.25, primaryColor + '0.65)');
      coreFlare.addColorStop(0.7, secondaryColor + '0.12)');
      coreFlare.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreFlare;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 3. CRYSTALLINE RIM HIGHLIGHT (Subtle glass refraction ring)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();

      // Top specular glass sheen
      const rimHighlight = ctx.createLinearGradient(centerX, centerY - r, centerX, centerY + r * 0.4);
      rimHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      rimHighlight.addColorStop(0.3, 'rgba(255, 255, 255, 0.06)');
      rimHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.strokeStyle = rimHighlight;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();

      // Dynamic voice ripples when speaking or listening
      if (state === 'speaking' || state === 'listening') {
        const rippleCount = 3;
        for (let i = 0; i < rippleCount; i++) {
          const ripplePhase = (phaseRef.current * 0.8 + (i / rippleCount)) % 1;
          const rippleRadius = r + ripplePhase * (r * 0.45);
          const rippleAlpha = Math.max(0, (1 - ripplePhase) * 0.35);

          ctx.strokeStyle = primaryColor + rippleAlpha + ')';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [state]);

  const getStateMeta = () => {
    switch (state) {
      case 'listening': 
        return { label: 'Listening...', dotClass: 'bg-cyan-400 animate-ping', textClass: 'text-cyan-300' };
      case 'processing': 
        return { label: 'Processing Audio...', dotClass: 'bg-violet-400 animate-pulse', textClass: 'text-violet-300' };
      case 'thinking': 
        return { label: 'Analyzing & Reasoning...', dotClass: 'bg-indigo-400 animate-pulse', textClass: 'text-indigo-300' };
      case 'speaking': 
        return { label: 'Synthesizing Speech...', dotClass: 'bg-cyan-400 animate-pulse', textClass: 'text-cyan-300' };
      case 'error': 
        return { label: 'Microphone / System Notice', dotClass: 'bg-rose-400 animate-pulse', textClass: 'text-rose-300' };
      default: 
        return { label: 'J.A.S.P.E.R. Online — Ready', dotClass: 'bg-emerald-400', textClass: 'text-slate-300' };
    }
  };

  const meta = getStateMeta();

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2 relative select-none">
      {/* Clickable canvas container with hardware acceleration */}
      <div 
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`JASPER AI Core (${meta.label}). Click to interact.`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
        className="w-[160px] h-[160px] sm:w-[190px] sm:h-[190px] md:w-[210px] md:h-[210px] relative cursor-pointer active:scale-95 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 rounded-full"
        style={{ transform: 'translate3d(0, 0, 0)', willChange: 'transform' }}
      >
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
          style={{ willChange: 'contents', transform: 'translate3d(0, 0, 0)' }}
        />
      </div>
      
      {/* Minimal Status Label */}
      <div className={`mt-2.5 text-xs font-medium tracking-wide ${meta.textClass} text-center flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-white/[0.06]`}>
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
        <span>{meta.label}</span>
      </div>
    </div>
  );
}
