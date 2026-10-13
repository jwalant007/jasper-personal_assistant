import React, { useState, useRef, useEffect } from 'react';
import { useJasperUser } from '../context/JasperUserContext';
import { User, Users, Plus, Lock, KeyRound, Check, ChevronDown, Sparkles, X, Shield, ArrowRight, Trash2 } from 'lucide-react';

const AVATAR_OPTIONS = ['👑', '🚀', '💻', '🧠', '⚡', '👤', '🎨', '🔬', '🛡️', '🌟'];

export default function UserProfileMenu({ onLockSystem }) {
  const { 
    currentUser, 
    usersList, 
    switchUser, 
    register, 
    deleteUserAccount, 
    logout 
  } = useJasperUser();

  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [switchPinModalUser, setSwitchPinModalUser] = useState(null);
  const [switchPinInput, setSwitchPinInput] = useState('');
  const [switchError, setSwitchError] = useState('');
  
  // New User Form State
  const [newUserId, setNewUserId] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Personal Assistant User');
  const [newPin, setNewPin] = useState('');
  const [newAvatar, setNewAvatar] = useState('👤');
  const [addError, setAddError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectUser = async (targetUser) => {
    if (targetUser.userId === currentUser?.userId) {
      setIsOpen(false);
      return;
    }

    if (targetUser.hasPin) {
      setSwitchPinModalUser(targetUser);
      setSwitchPinInput('');
      setSwitchError('');
      setIsOpen(false);
      return;
    }

    const res = await switchUser(targetUser.userId);
    if (res.success) {
      setIsOpen(false);
    } else {
      alert(res.error || 'Failed to switch profile');
    }
  };

  const handleSwitchWithPin = async (e) => {
    e.preventDefault();
    if (!switchPinModalUser) return;
    setSwitchError('');
    const res = await switchUser(switchPinModalUser.userId, switchPinInput);
    if (res.success) {
      setSwitchPinModalUser(null);
      setSwitchPinInput('');
    } else {
      setSwitchError(res.error || 'Invalid PIN for profile');
    }
  };

  const handleCreateNewUser = async (e) => {
    e.preventDefault();
    setAddError('');
    const cleanId = newUserId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanId) {
      setAddError('User ID must contain alphanumeric characters');
      return;
    }
    if (!newName.trim()) {
      setAddError('Display Name is required');
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      userId: cleanId,
      name: newName.trim(),
      pin: newPin.trim(),
      avatar: newAvatar,
      role: newRole.trim() || 'User'
    });
    setIsSubmitting(false);

    if (res.success) {
      setShowAddModal(false);
      setNewUserId('');
      setNewName('');
      setNewPin('');
      setIsOpen(false);
    } else {
      setAddError(res.error || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (e, userIdToDelete) => {
    e.stopPropagation();
    if (userIdToDelete === 'jwalant') {
      alert('Cannot delete the root owner account (jwalant)');
      return;
    }
    if (window.confirm(`Are you sure you want to delete profile "${userIdToDelete}" and all associated personal data?`)) {
      const res = await deleteUserAccount(userIdToDelete);
      if (!res.success) {
        alert(res.error || 'Failed to delete account');
      }
    }
  };

  const renderAvatarBadge = (avatar, name, sizeClass = "w-5 h-5 text-xs") => {
    if (avatar && (avatar.startsWith('http') || avatar.startsWith('data:'))) {
      return <img src={avatar} alt={name} className={`${sizeClass} rounded-full object-cover`} />;
    }
    if (!avatar || avatar.length > 2 || avatar === 'cyan' || avatar === 'blue') {
      return (
        <span className={`${sizeClass} rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center font-sans`}>
          {name ? name.charAt(0).toUpperCase() : 'J'}
        </span>
      );
    }
    return (
      <span className={`${sizeClass} rounded-full bg-slate-800 border border-white/[0.1] flex items-center justify-center flex-shrink-0`}>
        {avatar}
      </span>
    );
  };

  return (
    <div className="relative inline-block font-sans" ref={menuRef}>
      {/* Trigger Button Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#171D28] hover:bg-[#1C2331] border border-white/[0.08] hover:border-cyan-400/40 transition-all text-xs cursor-pointer shadow-sm group backdrop-blur-md"
        title="Active Account & Profile Switcher"
      >
        {renderAvatarBadge(currentUser?.avatar, currentUser?.name, "w-5 h-5 text-[10px]")}
        <div className="flex flex-col text-left">
          <span className="font-medium text-slate-200 text-[11px] leading-tight truncate max-w-[80px] sm:max-w-[110px]">
            {currentUser?.name || 'User'}
          </span>
          <span className="text-[9px] text-slate-400 font-mono leading-none">
            @{currentUser?.userId || 'jwalant'}
          </span>
        </div>
        <ChevronDown size={12} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#171D28] border border-white/[0.1] backdrop-blur-2xl shadow-2xl p-3 z-[9999] flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150 select-none">
          {/* Active Profile Header Card */}
          <div className="p-3 rounded-xl bg-[#111620] border border-white/[0.06] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-white/[0.1] flex items-center justify-center text-lg shadow-sm">
              {renderAvatarBadge(currentUser?.avatar, currentUser?.name, "w-10 h-10 text-base")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs text-white truncate flex items-center gap-1.5">
                {currentUser?.name || 'Owner'}
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">@{currentUser?.userId || 'jwalant'}</div>
              <div className="text-[9px] text-slate-400 font-sans truncate">{currentUser?.role || 'Personal Assistant User'}</div>
            </div>
          </div>

          {/* Section: Switch User Profiles */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Users size={12} /> Profiles ({usersList.length})</span>
              <button
                onClick={() => {
                  setShowAddModal(true);
                  setIsOpen(false);
                }}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-medium transition-colors"
              >
                <Plus size={11} /> New Profile
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
              {usersList.map((user) => {
                const isActive = user.userId.toLowerCase() === currentUser?.userId?.toLowerCase();
                return (
                  <div
                    key={user.userId}
                    onClick={() => handleSelectUser(user)}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border text-xs group ${
                      isActive 
                        ? 'bg-indigo-500/15 border-indigo-500/30 text-white font-medium' 
                        : 'bg-slate-800/30 border-white/[0.04] hover:bg-slate-800/70 hover:border-white/[0.1] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 border border-white/[0.06] flex items-center justify-center text-xs">
                        {user.avatar || '👤'}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-[11px] leading-tight flex items-center gap-1">
                          {user.name}
                          {user.hasPin && <KeyRound size={9} className="text-amber-400" title="Protected by PIN" />}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono leading-none">@{user.userId}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isActive ? (
                        <Check size={14} className="text-indigo-400" />
                      ) : (
                        <>
                          <button
                            onClick={(e) => handleDeleteUser(e, user.userId)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-opacity"
                            title="Delete profile"
                          >
                            <Trash2 size={12} />
                          </button>
                          <ArrowRight size={12} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-white/[0.06] my-0.5" />

          {/* Bottom Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onLockSystem) onLockSystem();
                else logout();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-850 hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 text-slate-300 hover:text-rose-300 text-xs font-medium transition-all"
            >
              <Lock size={12} /> Lock Screen
            </button>
            <button
              onClick={() => {
                setShowAddModal(true);
                setIsOpen(false);
              }}
              className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition-all font-medium shadow-sm shadow-indigo-500/20"
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      )}

      {/* Switch PIN Prompt Modal */}
      {switchPinModalUser && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/[0.1] p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{switchPinModalUser.avatar || '👤'}</span>
                <div>
                  <h3 className="font-semibold text-sm text-white">Enter Passcode</h3>
                  <div className="text-[11px] text-slate-400">@{switchPinModalUser.userId} ({switchPinModalUser.name})</div>
                </div>
              </div>
              <button 
                onClick={() => setSwitchPinModalUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSwitchWithPin} className="flex flex-col gap-3">
              <label className="text-xs text-slate-300">Enter PIN / passcode for this profile:</label>
              <input
                type="password"
                value={switchPinInput}
                onChange={(e) => setSwitchPinInput(e.target.value)}
                placeholder="PIN"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {switchError && (
                <div className="text-xs text-rose-400">{switchError}</div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSwitchPinModalUser(null)}
                  className="px-3.5 py-2 rounded-xl border border-white/[0.08] text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm shadow-indigo-500/20"
                >
                  Unlock & Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New User Profile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/[0.1] p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Create User Profile</h3>
                  <div className="text-[11px] text-slate-400">Isolated chats, memories, finances & notes</div>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="flex flex-col gap-3 text-xs">
              {/* Avatar Selector */}
              <div>
                <label className="text-[11px] text-slate-300 mb-1.5 block">Choose Avatar</label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {AVATAR_OPTIONS.map(av => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setNewAvatar(av)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all border ${
                        newAvatar === av 
                          ? 'bg-indigo-600 border-indigo-400 scale-105 shadow-md shadow-indigo-500/20' 
                          : 'bg-slate-800/80 border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* User ID */}
              <div>
                <label className="text-[11px] text-slate-300 mb-1 block">User ID (Unique identifier, e.g. sarah, alex_work)</label>
                <input
                  type="text"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="e.g. sarah"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="text-[11px] text-slate-300 mb-1 block">Display Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Role / Description */}
              <div>
                <label className="text-[11px] text-slate-300 mb-1 block">Role / Purpose (Optional)</label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Personal Assistant, Work Tasks"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* PIN / Passcode */}
              <div>
                <label className="text-[11px] text-slate-300 mb-1 block">PIN / Passcode (Optional — leave blank for 1-click switch)</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Optional 4-digit PIN"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {addError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {addError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl border border-white/[0.08] text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
                >
                  {isSubmitting ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
