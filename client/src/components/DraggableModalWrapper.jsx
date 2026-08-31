import React, { useState, useEffect, useRef } from 'react';
import { Move, X, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

/**
 * Reusable Draggable & Maximizable Modal Container
 * Allows any app/widget in Classic or Spatial mode to be dragged anywhere on the screen,
 * maximized to full screen (100vw x 100vh), or centered with full mouse and touch support.
 */
export default function DraggableModalWrapper({ 
  isOpen = true, 
  onClose, 
  title, 
  children, 
  initialPos = null,
  maxWidth = 'max-w-6xl',
  className = ''
}) {
  const [pos, setPos] = useState(initialPos);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, startLeft: 0, startTop: 0 });

  const handleDragStart = (clientX, clientY) => {
    if (!dragRef.current || isMaximized) return;
    const rect = dragRef.current.getBoundingClientRect();
    setIsDragging(true);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      startLeft: rect.left,
      startTop: rect.top
    };
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea')) return;
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea')) return;
    if (e.touches && e.touches.length > 0) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    let animFrame = null;

    const handleMove = (clientX, clientY) => {
      if (!isDragging || isMaximized) return;
      if (animFrame) cancelAnimationFrame(animFrame);

      animFrame = requestAnimationFrame(() => {
        const dx = clientX - dragStartRef.current.x;
        const dy = clientY - dragStartRef.current.y;
        
        const newX = dragStartRef.current.startLeft + dx;
        const newY = Math.max(8, dragStartRef.current.startTop + dy);

        setPos({ x: newX, y: newY });
      });
    };

    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onEnd = () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onEnd);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, isMaximized]);

  if (!isOpen) return null;

  const modalStyle = isMaximized ? {
    position: 'fixed',
    left: '8px',
    top: '8px',
    width: 'calc(100vw - 16px)',
    height: 'calc(100vh - 16px)',
    maxWidth: 'none',
    maxHeight: 'none',
    margin: 0,
    zIndex: 80
  } : (pos ? {
    position: 'fixed',
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: 'auto',
    maxWidth: 'calc(100vw - 24px)',
    transform: 'none',
    margin: 0,
    zIndex: 70
  } : {});

  return (
    <div className={`fixed inset-0 z-50 ${pos || isMaximized ? 'pointer-events-none' : 'flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto'}`}>
      {/* Click outside backdrop when centered */}
      {!pos && !isMaximized && (
        <div 
          className="fixed inset-0 -z-10" 
          onClick={onClose}
        />
      )}

      <div
        ref={dragRef}
        style={modalStyle}
        className={`pointer-events-auto relative ${isMaximized ? 'w-full h-full' : `${maxWidth} w-[96vw]`} flex flex-col transition-all duration-150 rounded-2xl overflow-hidden bg-neutral-950/95 border border-amber-500/40 shadow-[0_10px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl ${
          isDragging 
            ? 'cursor-grabbing shadow-[0_0_50px_rgba(245,197,66,0.4)] ring-2 ring-amber-400/50 select-none' 
            : ''
        } ${className}`}
      >
        {/* Futuristic Drag Grip Handle & Window Bar */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-amber-950/90 via-neutral-900/95 to-amber-950/90 border-b border-amber-500/40 text-amber-300 text-xs font-mono select-none cursor-grab active:cursor-grabbing backdrop-blur-xl shrink-0"
        >
          <div className="flex items-center gap-2">
            <Move className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-[11px] sm:text-xs text-amber-200 uppercase tracking-wider">
              {title || 'APPLICATION WINDOW'}
            </span>
            {isMaximized && (
              <span className="hidden sm:inline px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-400/40 rounded text-[9px] text-emerald-300">
                FULLSCREEN
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {pos && !isMaximized && (
              <button
                type="button"
                onClick={() => setPos(null)}
                title="Reset to center"
                className="px-2 py-1 rounded-lg bg-neutral-800/80 hover:bg-amber-500/20 text-neutral-300 hover:text-amber-200 text-[10px] flex items-center gap-1 border border-neutral-700 transition-all"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Center</span>
              </button>
            )}

            {/* Maximize / Restore Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Restore size" : "Maximize to full screen"}
              className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-amber-500/20 text-amber-300 hover:text-amber-100 border border-amber-500/30 transition-all"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-500/30 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Children Content (Expands to 100% height and width cleanly) */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col p-2 sm:p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
