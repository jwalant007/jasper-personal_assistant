import React, { useState, useEffect, useRef } from 'react';
import { Move, X, RotateCcw } from 'lucide-react';

/**
 * Reusable Draggable Modal Container
 * Allows any app/widget in Classic or Spatial mode to be dragged anywhere on the screen
 * with full mouse and touch support.
 */
export default function DraggableModalWrapper({ 
  isOpen = true, 
  onClose, 
  title, 
  children, 
  initialPos = null,
  maxWidth = 'max-w-5xl',
  className = ''
}) {
  const [pos, setPos] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, startLeft: 0, startTop: 0 });

  const handleDragStart = (clientX, clientY) => {
    if (!dragRef.current) return;
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
      if (!isDragging) return;
      if (animFrame) cancelAnimationFrame(animFrame);

      animFrame = requestAnimationFrame(() => {
        const dx = clientX - dragStartRef.current.x;
        const dy = clientY - dragStartRef.current.y;
        
        const newX = dragStartRef.current.startLeft + dx;
        const newY = Math.max(10, dragStartRef.current.startTop + dy);

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
  }, [isDragging]);

  if (!isOpen) return null;

  const modalStyle = pos ? {
    position: 'fixed',
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    transform: 'none',
    margin: 0,
    zIndex: 70
  } : {};

  return (
    <div className={`fixed inset-0 z-50 ${pos ? 'pointer-events-none' : 'flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto'}`}>
      {/* Click outside backdrop when centered */}
      {!pos && (
        <div 
          className="fixed inset-0 -z-10" 
          onClick={onClose}
        />
      )}

      <div
        ref={dragRef}
        style={modalStyle}
        className={`pointer-events-auto relative ${maxWidth} w-full flex flex-col transition-shadow duration-150 ${
          isDragging 
            ? 'cursor-grabbing shadow-[0_0_50px_rgba(245,197,66,0.4)] ring-2 ring-amber-400/50 select-none' 
            : 'shadow-2xl'
        } ${className}`}
      >
        {/* Futuristic Drag Grip Handle */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-amber-950/90 via-neutral-900/95 to-amber-950/90 border border-amber-500/40 rounded-t-xl text-amber-300 text-xs font-mono select-none cursor-grab active:cursor-grabbing backdrop-blur-xl shadow-md"
        >
          <div className="flex items-center gap-2">
            <Move className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-bold text-[10px] sm:text-xs text-amber-200 uppercase tracking-wider">
              {title || 'DRAGGABLE WINDOW'}
            </span>
            <span className="hidden sm:inline px-1.5 py-0.2 bg-amber-500/20 border border-amber-400/40 rounded text-[9px] text-amber-300">
              DRAG ANYWHERE
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {pos && (
              <button
                type="button"
                onClick={() => setPos(null)}
                title="Reset to center"
                className="px-1.5 py-0.5 rounded bg-neutral-800/80 hover:bg-amber-500/20 text-neutral-300 hover:text-amber-200 text-[9px] flex items-center gap-1 border border-neutral-700 transition-all"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Center</span>
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="p-1 rounded bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-500/30 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Children Content */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
