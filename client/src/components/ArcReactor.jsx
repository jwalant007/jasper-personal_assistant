import React, { useEffect, useRef } from 'react';

export default function ArcReactor({ state = 'idle', onClick }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const angleRef = useRef(0);
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

      // Delta normalizer (target 60fps = 16.6ms)
      const dt = Math.min(elapsed / 16.667, 2.0);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.38;

      // Dynamic variables based on operational state
      let speed = 0.01;
      let targetGlowColor = 'rgba(245, 197, 66, '; // Champagne Gold
      let coreColor = '#ffd700'; // 24K Gold
      let outerColor = 'rgba(212, 175, 55, 0.35)'; // Burnished Bronze Gold

      if (state === 'listening') {
        speed = 0.035;
        targetGlowColor = 'rgba(255, 153, 0, '; 
        coreColor = '#ff9900';
        outerColor = 'rgba(255, 153, 0, 0.35)';
        pulseRef.current = 1 + Math.sin(currentTime * 0.008) * 0.1;
      } else if (state === 'processing') {
        speed = -0.05;
        targetGlowColor = 'rgba(255, 215, 0, '; 
        coreColor = '#ffe066';
        outerColor = 'rgba(245, 197, 66, 0.45)';
        pulseRef.current = 1 + Math.sin(currentTime * 0.015) * 0.06;
      } else if (state === 'speaking') {
        speed = 0.018;
        targetGlowColor = 'rgba(245, 197, 66, ';
        coreColor = '#ffd700';
        outerColor = 'rgba(212, 175, 55, 0.3)';
        pulseRef.current = 1 + Math.sin(currentTime * 0.006) * 0.14;
      } else {
        // Idle
        speed = 0.007;
        pulseRef.current = 1 + Math.sin(currentTime * 0.002) * 0.03;
      }

      angleRef.current += speed * dt;
      const r = baseRadius * pulseRef.current;

      // 1. OUTERMOST AMBIENT GLOW (Optimized radial gradient)
      const ambientGlow = ctx.createRadialGradient(centerX, centerY, r * 0.2, centerX, centerY, r * 1.4);
      ambientGlow.addColorStop(0, targetGlowColor + '0.12)');
      ambientGlow.addColorStop(0.6, targetGlowColor + '0.03)');
      ambientGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // 2. BACKGROUND CONCENTRIC RADAR RINGS
      ctx.strokeStyle = outerColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * 1.18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, r * 1.06, 0, Math.PI * 2);
      ctx.stroke();

      // 3. MAIN OUTER FLANGED RING (GPU-friendly dual-stroke glow)
      ctx.strokeStyle = targetGlowColor + '0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();

      // Draw notches on outer ring
      const notches = 12;
      ctx.fillStyle = coreColor;
      for (let i = 0; i < notches; i++) {
        const notchAngle = angleRef.current + (i * Math.PI * 2) / notches;
        const nx1 = centerX + Math.cos(notchAngle) * r;
        const ny1 = centerY + Math.sin(notchAngle) * r;
        
        ctx.beginPath();
        ctx.arc(nx1, ny1, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. INNER COIL RING (Segmented golden arcs)
      const coils = 10;
      const coilLength = (Math.PI * 2) / coils - 0.15;
      ctx.lineWidth = 4;
      ctx.strokeStyle = state === 'listening' ? 'rgba(255, 153, 0, 0.75)' : 'rgba(212, 175, 55, 0.75)';
      for (let i = 0; i < coils; i++) {
        const startA = -angleRef.current + (i * Math.PI * 2) / coils;
        const endA = startA + coilLength;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * 0.75, startA, endA);
        ctx.stroke();
      }

      // Inner coil accents
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * 0.68, 0, Math.PI * 2);
      ctx.stroke();

      // 5. THE CORE ENERGY CENTER
      const coreR = r * 0.45;
      const coreGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreR);
      coreGlow.addColorStop(0, '#ffffff');
      coreGlow.addColorStop(0.3, coreColor);
      coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreR, 0, Math.PI * 2);
      ctx.fill();

      // 6. DYNAMIC SOUNDWAVE SPECTRUM LINES (When speaking)
      if (state === 'speaking') {
        const waveLines = 32;
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
        for (let i = 0; i < waveLines; i++) {
          const waveAngle = (i * Math.PI * 2) / waveLines;
          const val = Math.sin(i * 0.8 + currentTime * 0.012) * Math.cos(i * 0.2 + currentTime * 0.003);
          const offset = Math.abs(val) * 14 + 2;
          
          const startX = centerX + Math.cos(waveAngle) * (r * 0.4);
          const startY = centerY + Math.sin(waveAngle) * (r * 0.4);
          const endX = centerX + Math.cos(waveAngle) * (r * 0.4 - offset);
          const endY = centerY + Math.sin(waveAngle) * (r * 0.4 - offset);
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }

      // 7. CENTER TARGET TRIANGLE (Stark Mark VI style)
      ctx.strokeStyle = '#fffdf0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const triAngle = angleRef.current * 1.5 + (i * Math.PI * 2) / 3 - Math.PI / 2;
        const tx = centerX + Math.cos(triAngle) * (r * 0.15);
        const ty = centerY + Math.sin(triAngle) * (r * 0.15);
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.closePath();
      ctx.stroke();
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [state]);

  const getStateText = () => {
    switch (state) {
      case 'listening': return 'JASPER LISTENING...';
      case 'processing': return 'COMPUTING RESPONSE...';
      case 'speaking': return 'JASPER VOCALIZING...';
      default: return 'SYSTEM STANDBY';
    }
  };

  const getStateColorClass = () => {
    switch (state) {
      case 'listening': return 'text-amber-400 glow-orange';
      case 'processing': return 'text-yellow-300 glow-gold';
      default: return 'text-amber-300 glow-gold';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 relative select-none" style={{ contain: 'paint layout' }}>
      {/* Clickable canvas container with hardware acceleration */}
      <div 
        onClick={onClick}
        className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[240px] md:h-[240px] relative cursor-pointer active:scale-95 transition-transform"
        style={{ transform: 'translate3d(0, 0, 0)', willChange: 'transform' }}
      >
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
          style={{ willChange: 'contents', transform: 'translate3d(0, 0, 0)' }}
        />
      </div>
      
      {/* HUD State Indicator */}
      <div className={`mt-4 font-orbitron text-xs font-semibold tracking-widest text-center ${getStateColorClass()}`}>
        {getStateText()}
      </div>
      <div className="mt-1 font-mono text-[9px] text-amber-500/70 uppercase tracking-wider text-center">
        {state === 'idle' ? 'Click reactor to manually query' : 'Press ESC to abort'}
      </div>
    </div>
  );
}
