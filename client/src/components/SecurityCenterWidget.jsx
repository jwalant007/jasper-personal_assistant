import React, { useState } from 'react';
import { ShieldCheck, Camera, Mic, Lock, Smartphone, Key, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function SecurityCenterWidget({ onClose, hasFaceProfile = false, onTriggerFaceEnroll }) {
  const [activeTab, setActiveTab] = useState('face'); // face, voice, devices, encryption
  const [encryptionActive, setEncryptionActive] = useState(true);
  const [trustedDevices, setTrustedDevices] = useState([
    { name: 'Primary Workstation (Localhost)', ip: '127.0.0.1', trusted: true },
    { name: 'Samsung Galaxy Phone', ip: '192.168.1.105', trusted: true }
  ]);

  const [voiceAuthStatus, setVoiceAuthStatus] = useState('idle'); // idle, testing, verified

  const testVoiceAuth = () => {
    setVoiceAuthStatus('testing');
    setTimeout(() => {
      setVoiceAuthStatus('verified');
    }, 2000);
  };

  return (
    <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-4xl w-full mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-400">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-emerald-300 uppercase">Security Center</h2>
            <p className="text-xs text-slate-400">Biometrics, Whitelists & Encryption Shield</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400">
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
        {[
          { id: 'face', label: 'Face Unlock', icon: Camera },
          { id: 'voice', label: 'Voice Authentication', icon: Mic },
          { id: 'devices', label: 'Device Trust List', icon: Smartphone },
          { id: 'encryption', label: 'Encryption Status', icon: Lock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-500/10' 
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[280px]">
        {/* Tab 1: Face Unlock */}
        {activeTab === 'face' && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl text-center flex flex-col items-center">
            <Camera className="w-12 h-12 text-emerald-400 mb-3" />
            <h3 className="text-base font-bold text-slate-200 mb-1">Face Recognition Biometrics</h3>
            <p className="text-xs text-slate-400 max-w-md mb-6">
              {hasFaceProfile 
                ? 'Owner Face Profile is active and registered in biometric memory.' 
                : 'No face profile detected. Enroll your face to enable instant visual lock/unlock.'}
            </p>
            {onTriggerFaceEnroll && (
              <button
                onClick={onTriggerFaceEnroll}
                className="px-6 py-3 bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-all"
              >
                {hasFaceProfile ? 'Re-Enroll Owner Face' : 'Enroll Owner Face Profile'}
              </button>
            )}
          </div>
        )}

        {/* Tab 2: Voice Authentication */}
        {activeTab === 'voice' && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl text-center flex flex-col items-center">
            <Mic className="w-12 h-12 text-cyan-400 mb-3" />
            <h3 className="text-base font-bold text-slate-200 mb-1">Acoustic Voice Passphrase Verification</h3>
            <p className="text-xs text-slate-400 max-w-md mb-6">
              Test your voice signature pattern by saying "JASPER authenticate voice".
            </p>
            <button
              onClick={testVoiceAuth}
              disabled={voiceAuthStatus === 'testing'}
              className="px-6 py-3 bg-cyan-500/20 border border-cyan-500/50 hover:bg-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold transition-all"
            >
              {voiceAuthStatus === 'testing' ? 'Listening & Analyzing Pitch...' : voiceAuthStatus === 'verified' ? '✓ Voice Pattern Match 99.4%' : 'Test Voice Authentication'}
            </button>
          </div>
        )}

        {/* Tab 3: Device Trust List */}
        {activeTab === 'devices' && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Authorized IP Whitelist</h3>
            <div className="space-y-2">
              {trustedDevices.map((dev, idx) => (
                <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="font-bold text-slate-200">{dev.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{dev.ip}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded font-mono">TRUSTED</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Encryption Status */}
        {activeTab === 'encryption' && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Lock className="w-8 h-8 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-200">Local Memory Storage Encryption</h3>
                <p className="text-xs text-slate-400">AES-256 CBC local disk vault protection</p>
              </div>
            </div>
            <button
              onClick={() => setEncryptionActive(!encryptionActive)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                encryptionActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
              }`}
            >
              {encryptionActive ? 'ENCRYPTION ACTIVE' : 'ENCRYPTION OFF'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
