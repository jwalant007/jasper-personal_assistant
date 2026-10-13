import React, { useState, useEffect } from 'react';
import { useJasperUser } from '../context/JasperUserContext';
import { 
  Lock, KeyRound, Camera, UserPlus, Eye, EyeOff, 
  ChevronRight, ArrowLeft, Check, Sparkles, AlertCircle, Fingerprint
} from 'lucide-react';

const AVATAR_OPTIONS = ['👑', '🚀', '💻', '🧠', '⚡', '👤', '🎨', '🔬', '🛡️', '🌟'];

export default function MultiUserLockTerminal({
  onUnlockSuccess,
  biometricMode = 'idle',
  onTriggerFaceScan,
  onTriggerFaceEnroll,
  videoRef,
  canvasRef,
  scanProgress = 0,
  scanStatusText = '',
  failedAuthAttempts = 0,
  intrusionAlertDispatched = false,
  onFailedAttempt
}) {
  const { usersList, currentUser, login, register } = useJasperUser();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Login form state
  const [selectedUserId, setSelectedUserId] = useState(() => {
    return currentUser?.userId || 'jwalant';
  });
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form state
  const [regUserId, setRegUserId] = useState('');
  const [regName, setRegName] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regAvatar, setRegAvatar] = useState('👤');
  const [regRole, setRegRole] = useState('Personal Assistant');

  // Sync selected user with list
  useEffect(() => {
    if (usersList.length > 0 && !usersList.some(u => u.userId === selectedUserId)) {
      setSelectedUserId(usersList[0].userId);
    }
  }, [usersList, selectedUserId]);

  const selectedUserObj = usersList.find(u => u.userId === selectedUserId) || currentUser || {
    userId: 'jwalant',
    name: 'Jwalant',
    avatar: '👑',
    hasPin: true
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorText('');
    setIsSubmitting(true);

    const res = await login(selectedUserId, pin);
    setIsSubmitting(false);

    if (res.success) {
      setErrorText('');
      setPin('');
      if (onUnlockSuccess) onUnlockSuccess(res.user);
    } else {
      const errMsg = res.error || 'Incorrect passcode';
      setErrorText(errMsg);
      if (onFailedAttempt) onFailedAttempt('wrong_password');
    }
  };

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorText('');
    const cleanId = regUserId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanId) {
      setErrorText('Please enter a valid user ID (letters and numbers only)');
      return;
    }
    if (!regName.trim()) {
      setErrorText('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      userId: cleanId,
      name: regName.trim(),
      pin: regPin.trim(),
      avatar: regAvatar,
      role: regRole.trim() || 'User'
    });
    setIsSubmitting(false);

    if (res.success) {
      setErrorText('');
      if (onUnlockSuccess) onUnlockSuccess(res.user);
    } else {
      setErrorText(res.error || 'Could not create account');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-[#07080c]/90 backdrop-blur-3xl overflow-y-auto select-none font-sans text-slate-100">
      {/* Background Soft Lighting Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-sm rounded-3xl bg-slate-900/70 border border-white/[0.08] p-7 sm:p-8 backdrop-blur-2xl shadow-2xl relative flex flex-col gap-5 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* VIEW 1: SIGN IN / UNLOCK */}
        {activeTab === 'login' && (
          <div className="flex flex-col items-center text-center gap-4">
            {/* User Avatar Circle */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-white/[0.12] flex items-center justify-center text-3xl shadow-xl">
                {selectedUserObj.avatar || '👤'}
              </div>
              {selectedUserObj.hasPin && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-950 border border-white/[0.12] flex items-center justify-center text-slate-300 shadow">
                  <KeyRound size={12} className="text-amber-400" />
                </div>
              )}
            </div>

            {/* User Greeting & Name */}
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                {selectedUserObj.name || 'User'}
              </h2>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-mono">
                <span>@{selectedUserObj.userId}</span>
                {selectedUserObj.role && (
                  <>
                    <span>&bull;</span>
                    <span className="font-sans text-[11px]">{selectedUserObj.role}</span>
                  </>
                )}
              </div>
            </div>

            {/* Profile Switcher Pills (If multiple accounts exist) */}
            {usersList.length > 1 && (
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/60 border border-white/[0.06] max-w-full overflow-x-auto custom-scrollbar">
                {usersList.map((u) => {
                  const isSelected = u.userId.toLowerCase() === selectedUserId.toLowerCase();
                  return (
                    <button
                      key={u.userId}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(u.userId);
                        setErrorText('');
                        setPin('');
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-white/[0.12] text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      }`}
                      title={u.name}
                    >
                      <span>{u.avatar || '👤'}</span>
                      <span className="text-[11px] truncate max-w-[80px]">{u.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Camera / Biometric Scan Active Preview */}
            {(biometricMode === 'face_scan' || biometricMode === 'face_enroll') && (
              <div className="w-full flex flex-col items-center gap-2.5 py-1">
                <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-indigo-400/50 bg-black shadow-lg">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover transform scale-x-[-1]" 
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="w-full text-center">
                  <span className="text-[11px] text-indigo-300 font-medium animate-pulse">
                    {scanStatusText || 'Verifying Face ID...'}
                  </span>
                  <div className="w-36 h-1 bg-slate-800 rounded-full mx-auto mt-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300" 
                      style={{ width: `${scanProgress}%` }} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PIN / Passcode Form */}
            <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-3 mt-1">
              <div className="relative flex items-center">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (errorText) setErrorText('');
                  }}
                  placeholder={selectedUserObj.hasPin ? 'Enter Passcode' : 'Press Unlock (No PIN set)'}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/[0.1] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Error indicator */}
              {errorText && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 bg-rose-950/30 border border-rose-500/20 py-2 px-3 rounded-xl animate-in fade-in duration-150">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{errorText}</span>
                </div>
              )}

              {/* Failed attempts notice */}
              {failedAuthAttempts > 0 && (
                <div className="text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-500/20 py-1.5 px-3 rounded-xl">
                  {failedAuthAttempts >= 3 
                    ? 'Security alert dispatched to linked phone' 
                    : `Incorrect attempts: ${failedAuthAttempts}/3`}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {onTriggerFaceScan && (
                  <button
                    type="button"
                    onClick={() => onTriggerFaceScan(selectedUserObj)}
                    className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-white/[0.1] text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Unlock using Face ID"
                  >
                    <Camera size={16} />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md hover:shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Unlocking...' : 'Unlock'}
                </button>
              </div>
            </form>

            {/* Bottom Tab Toggle */}
            <div className="pt-2 border-t border-white/[0.06] w-full flex items-center justify-between text-xs text-slate-400">
              <span>Need a new account?</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorText('');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
              >
                Create Profile &rarr;
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: CREATE NEW PROFILE */}
        {activeTab === 'register' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorText('');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
              <span className="text-xs font-semibold text-slate-300">New Profile</span>
            </div>

            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3 text-xs">
              {/* Avatar Selector */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">Avatar</label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  {AVATAR_OPTIONS.map(av => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setRegAvatar(av)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all border cursor-pointer ${
                        regAvatar === av 
                          ? 'bg-indigo-600 border-indigo-400 scale-105 shadow-sm text-white' 
                          : 'bg-slate-950/80 border-white/[0.08] hover:border-white/[0.2]'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* User ID */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                  User ID (e.g. sarah, alex)
                </label>
                <input
                  type="text"
                  value={regUserId}
                  onChange={(e) => setRegUserId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="username"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/[0.1] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Display Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Your Full Name"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/[0.1] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Role / Profile Label</label>
                <input
                  type="text"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  placeholder="e.g. Personal, Work, Guest"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/[0.1] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Passcode */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                  Passcode / PIN (Optional)
                </label>
                <input
                  type="password"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  placeholder="Optional PIN"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/[0.1] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {errorText && (
                <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-500/20 py-2 px-3 rounded-xl">
                  {errorText}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md mt-1 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Profile...' : 'Create Account & Unlock'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
