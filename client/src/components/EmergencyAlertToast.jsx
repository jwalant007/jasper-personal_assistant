import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Bell, PhoneCall, X, ExternalLink, ShieldAlert, Volume2 } from 'lucide-react';

/**
 * Synthesizes a high-urgency multi-tone siren via Web Audio API without external audio files
 */
function playEmergencyAudioAlert() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Siren sweeps (880Hz -> 440Hz -> 880Hz)
    const tones = [0, 0.22, 0.44];
    tones.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now + t);
      osc.frequency.exponentialRampToValueAtTime(440, now + t + 0.18);

      gain.gain.setValueAtTime(0.35, now + t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + 0.21);
    });
  } catch (e) {
    console.warn('[EmergencyToast] Audio alert suppressed:', e);
  }
}

/**
 * Triggers native browser Notification if permission is allowed
 */
function triggerBrowserNotification(title, body) {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        requireInteraction: true,
        tag: 'jasper-emergency'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            requireInteraction: true,
            tag: 'jasper-emergency'
          });
        }
      });
    }
  } catch (e) {}
}

export default function EmergencyAlertToast({ emergency, onDismiss, onOpenHub }) {
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (!emergency) return;

    // Play audible siren
    if (!soundPlayedRef.current) {
      soundPlayedRef.current = true;
      playEmergencyAudioAlert();
    }

    // Trigger browser native notification
    triggerBrowserNotification(
      `🚨 EMERGENCY: ${emergency.senderName || emergency.sender || 'Urgent Alert'}`,
      `Message: "${emergency.message || 'Emergency detected'}"`
    );
  }, [emergency]);

  if (!emergency) return null;

  const senderDisplay = emergency.senderName || emergency.sender || 'Unknown Sender';
  const platformLabel = (emergency.source || 'WhatsApp').toUpperCase();

  return (
    <div 
      role="alert"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[94%] max-w-2xl animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto shadow-[0_0_50px_rgba(239,68,68,0.7)]"
    >
      <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/90 bg-gradient-to-r from-red-950/95 via-neutral-900/95 to-red-950/95 backdrop-blur-2xl p-4 sm:p-5 text-neutral-100 ring-1 ring-red-400/50">
        
        {/* Animated warning bar on top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-400 to-red-500 animate-pulse" />

        <div className="flex items-start justify-between gap-3">
          
          {/* Siren Badge */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-red-600/30 border border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse shrink-0">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-500/30 border border-red-500/60 text-red-300 rounded-md shadow-sm">
                  🚨 Critical Emergency Alert
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-neutral-800/80 border border-neutral-700 text-neutral-300 rounded-md">
                  {platformLabel}
                </span>
                <span className="text-xs font-mono text-red-400/80">
                  {emergency.formattedTime || 'Just now'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-red-100 tracking-wide mt-1">
                Emergency Message from <span className="text-amber-300 underline underline-offset-2">{senderDisplay}</span>
              </h3>
            </div>
          </div>

          {/* Close / Dismiss */}
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss Alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Message Quote Box */}
        <div className="mt-3.5 px-4 py-3 rounded-xl bg-black/50 border border-red-500/30 text-neutral-200 text-sm font-medium leading-relaxed shadow-inner">
          <p className="italic text-red-100/90 font-mono text-sm break-words">
            "{emergency.message}"
          </p>
          {emergency.sender && emergency.sender !== emergency.senderName && (
            <p className="mt-1 text-xs text-neutral-400 font-mono">
              Contact: {emergency.sender}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-red-500/20">
          <div className="flex items-center gap-2 text-xs text-amber-300/90">
            <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Spoken alarm &amp; Windows Desktop Toast dispatched</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenHub && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenHub) onOpenHub();
                  if (onDismiss) onDismiss();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Auto-Reply Hub
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs border border-neutral-600 transition-all cursor-pointer"
            >
              Acknowledge &amp; Dismiss
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
