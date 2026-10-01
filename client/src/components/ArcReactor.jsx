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

      // Color themes based on system status
      let primaryColor = 'rgba(99, 102, 241, ';   // Indigo
      let secondaryColor = 'rgba(56, 189, 248, '; // Sky blue
      let accentColor = 'rgba(168, 85, 247, ';    // Purple
      let speed = 0.015;

      if (state === 'listening') {
        primaryColor = 'rgba(56, 189, 248, ';
        secondaryColor = 'rgba(45, 212, 191, ';
        accentColor = 'rgba(14, 165, 233, ';
        speed = 0.04;
        pulseRef.current = 1 + Math.sin(currentTime * 0.008) * 0.08;
      } else if (state === 'processing') {
        primaryColor = 'rgba(168, 85, 247, ';
        secondaryColor = 'rgba(236, 72, 153, ';
        accentColor = 'rgba(99, 102, 241, ';
        speed = 0.055;
        pulseRef.current = 1 + Math.sin(currentTime * 0.015) * 0.06;
      } else if (state === 'speaking') {
        primaryColor = 'rgba(99, 102, 241, ';
        secondaryColor = 'rgba(129, 140, 248, ';
        accentColor = 'rgba(56, 189, 248, ';
        speed = 0.03;
        pulseRef.current = 1 + Math.sin(currentTime * 0.007) * 0.12;
      } else {
        // Idle calm breathing
        speed = 0.01;
        pulseRef.current = 1 + Math.sin(currentTime * 0.002) * 0.03;
      }

      phaseRef.current += speed * dt;
      const r = baseRadius * pulseRef.current;

      // 1. SOFT VOLUMETRIC ATMOSPHERIC AURA
      const aura = ctx.createRadialGradient(centerX, centerY, r * 0.1, centerX, centerY, r * 1.6);
      aura.addColorStop(0, primaryColor + '0.25)');
      aura.addColorStop(0.5, secondaryColor + '0.08)');
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
      sphereBg.addColorStop(0, primaryColor + '0.45)');
      sphereBg.addColorStop(0.4, accentColor + '0.25)');
      sphereBg.addColorStop(0.85, 'rgba(10, 14, 26, 0.95)');
      sphereBg.addColorStop(1, 'rgba(5, 7, 15, 0.98)');
      ctx.fillStyle = sphereBg;
      ctx.fillRect(centerX - r, centerY - r, r * 2, r * 2);

      // Swirling fluid wave filaments (3 smooth bezier bands)
      for (let i = 0; i < 4; i++) {
        const angle = phaseRef.current + (i * Math.PI) / 2;
        const waveGrad = ctx.createLinearGradient(
          centerX - r * Math.cos(angle),
          centerY - r * Math.sin(angle),
          centerX + r * Math.cos(angle),
          centerY + r * Math.sin(angle)
        );
        waveGrad.addColorStop(0, i % 2 === 0 ? primaryColor + '0.6)' : secondaryColor + '0.5)');
        waveGrad.addColorStop(0.5, accentColor + '0.7)');
        waveGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.strokeStyle = waveGrad;
        ctx.lineWidth = 2.5 + Math.sin(phaseRef.current + i) * 1.5;
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
      coreFlare.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
      coreFlare.addColorStop(0.2, secondaryColor + '0.6)');
      coreFlare.addColorStop(0.7, primaryColor + '0.1)');
      coreFlare.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreFlare;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 3. CRYSTALLINE RIM HIGHLIGHT (Subtle glass refraction ring)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();

      // Top specular glass sheen
      const rimHighlight = ctx.createLinearGradient(centerX, centerY - r, centerX, centerY + r * 0.4);
      rimHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      rimHighlight.addColorStop(0.3, 'rgba(255, 255, 255, 0.08)');
      rimHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.strokeStyle = rimHighlight;
      ctx.lineWidth = 1.8;
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

  const getStateText = () => {
    switch (state) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return 'JASPER Active';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 relative select-none">
      {/* Clickable canvas container with hardware acceleration */}
      <div 
        onClick={onClick}
        className="w-[170px] h-[170px] sm:w-[200px] sm:h-[200px] md:w-[220px] md:h-[220px] relative cursor-pointer active:scale-95 transition-transform"
        style={{ transform: 'translate3d(0, 0, 0)', willChange: 'transform' }}
      >
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
          style={{ willChange: 'contents', transform: 'translate3d(0, 0, 0)' }}
        />
      </div>
      
      {/* Minimal Status Label */}
      <div className="mt-3 text-xs font-medium tracking-wide text-slate-300 text-center flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${
          state === 'listening' ? 'bg-sky-400 animate-ping' :
          state === 'processing' ? 'bg-purple-400 animate-pulse' :
          state === 'speaking' ? 'bg-indigo-400 animate-pulse' :
          'bg-emerald-400'
        }`} />
        <span>{getStateText()}</span>
      </div>
    </div>
  );
}
