import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Shield, ShieldCheck, ShieldAlert, ShieldOff, Activity, Clock, Bell, BellOff,
  MessageSquare, Phone, Mail, Wifi, Bluetooth, Volume2, Monitor, Search, FileText,
  Trash2, Settings, Power, CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  Play, Pause, RotateCcw, Send, Zap, Brain, Eye, EyeOff, Lock, Unlock,
  Users, Star, UserPlus, Edit3, Check, X, Filter, Download, RefreshCw,
  Loader2, ChevronDown, ChevronUp, ArrowRight, Cpu, HardDrive, Globe,
  Sparkles, Radio, Hash, List, AlertCircle, Plus, Mic, MicOff, Smartphone
} from 'lucide-react';
import { getApiBase } from '../utils/apiConfig.js';

// Permission level metadata
const LEVEL_META = {
  0: { label: 'Read-Only', color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)', icon: Eye },
  1: { label: 'Low-Risk', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.12)', icon: Zap },
  2: { label: 'External Comm', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)', icon: Radio },
  3: { label: 'Sensitive', color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)', icon: Lock }
};

const TOOL_CATALOG = [
  { name: 'get_system_status', description: 'System CPU, memory & uptime', level: 0 },
  { name: 'get_time', description: 'Current date and time', level: 0 },
  { name: 'get_network_status', description: 'Network interfaces & connectivity', level: 0 },
  { name: 'search_files', description: 'Search files by name/extension', level: 0 },
  { name: 'read_file', description: 'Read contents of a permitted file', level: 0 },
  { name: 'search_memory', description: "Search Jasper's semantic memory", level: 0 },
  { name: 'set_pc_volume', description: 'Set, mute, or adjust PC volume', level: 1 },
  { name: 'open_application', description: 'Launch permitted applications', level: 1 },
  { name: 'create_reminder', description: 'Create a timed reminder', level: 1 },
  { name: 'send_tv_command', description: 'Send command to Smart TV', level: 1 },
  { name: 'wake_tv', description: 'Wake Smart TV via WoL', level: 1 },
  { name: 'open_phone_app', description: 'Open app on Android phone', level: 1 },
  { name: 'control_device', description: 'Control a smart device', level: 1 },
  { name: 'add_memory', description: "Store a fact in Jasper's memory", level: 1 },
  { name: 'enable_busy_mode', description: 'Enable auto-reply Busy Mode', level: 1 },
  { name: 'disable_busy_mode', description: 'Disable auto-reply Busy Mode', level: 1 },
  { name: 'send_message', description: 'Send message via WhatsApp/SMS', level: 2 },
  { name: 'make_call', description: 'Make a phone call', level: 2 },
  { name: 'send_phone_sms', description: 'Send SMS via Android phone', level: 2 },
  { name: 'delete_file', description: 'Permanently delete a file', level: 3 },
  { name: 'change_security_setting', description: 'Modify a security setting', level: 3 }
];

const BUSY_PRESETS = {
  drive: { label: 'Drive Mode', icon: '🚗', desc: "I'm currently driving" },
  meeting: { label: 'Meeting Mode', icon: '💼', desc: 'In a focus session' },
  sleep: { label: 'Sleep / DND', icon: '🌙', desc: 'Do not disturb' },
  custom: { label: 'Custom', icon: '✏️', desc: 'Your message' }
};

const LOG_ICONS = {
  message_received: '📨', message_classified: '🤖', escalation: '🔔',
  auto_reply_sent: '💬', tool_executing: '⚙️', tool_completed: '✅',
  tool_blocked: '🚫', tool_error: '💥', confirmation_requested: '🔒',
  tool_denied: '❌', task_plan_started: '🗂️', task_plan_completed: '🏁',
  api_tool_call: '🔧'
};

// ─── Sub-components ────────────────────────────────────────────────────────

function TabBtn({ id, label, icon: Icon, active, onClick, badge }) {
  return (
    <button
      id={`agent-tab-${id}`}
      onClick={() => onClick(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
        borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13,
        fontWeight: active ? 700 : 500, transition: 'all .2s',
        background: active ? 'rgba(0,212,255,0.15)' : 'transparent',
        color: active ? '#00d4ff' : 'rgba(200,220,255,0.6)',
        borderBottom: active ? '2px solid #00d4ff' : '2px solid transparent',
        position: 'relative', whiteSpace: 'nowrap'
      }}
    >
      <Icon size={15} />
      {label}
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 2, background: '#ef4444',
          color: '#fff', fontSize: 10, borderRadius: '50%', width: 16, height: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
        }}>{badge}</span>
      )}
    </button>
  );
}

function StepIndicator({ steps, currentStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <React.Fragment key={i}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 70
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', transition: 'all .3s',
                background: done ? '#22c55e' : active ? '#00d4ff' : 'rgba(255,255,255,0.08)',
                border: `2px solid ${done ? '#22c55e' : active ? '#00d4ff' : 'rgba(255,255,255,0.15)'}`,
                boxShadow: active ? '0 0 12px rgba(0,212,255,0.5)' : 'none'
              }}>
                {done ? <Check size={14} color="#fff" /> : active ? <Loader2 size={14} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> : <span style={{ color: 'rgba(200,220,255,0.4)', fontSize: 12 }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 10, color: done ? '#22c55e' : active ? '#00d4ff' : 'rgba(200,220,255,0.4)', textAlign: 'center', lineHeight: 1.2 }}>{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, minWidth: 20, borderRadius: 2, background: done ? '#22c55e' : 'rgba(255,255,255,0.08)', transition: 'background .4s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PermissionBadge({ level }) {
  const meta = LEVEL_META[level] || LEVEL_META[0];
  const Icon = meta.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
      borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: meta.bgColor, color: meta.color, border: `1px solid ${meta.color}44`
    }}>
      <Icon size={10} /> L{level} · {meta.label}
    </span>
  );
}

// ─── MAIN WIDGET ───────────────────────────────────────────────────────────

export default function JasperAgentHubWidget({ onClose }) {
  const [activeTab, setActiveTab] = useState('console');
  const apiBase = getApiBase();
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  // ── Agent Console state
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleHistory, setConsoleHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [pendingConfirmations, setPendingConfirmations] = useState([]);
  const consoleEndRef = useRef(null);

  // ── Busy Mode state
  const [busyConfig, setBusyConfig] = useState(null);
  const [busyLoading, setBusyLoading] = useState(false);
  const [simSender, setSimSender] = useState('Alex');
  const [simMessage, setSimMessage] = useState('Hey, can you talk?');
  const [simResult, setSimResult] = useState(null);
  const [simRunning, setSimRunning] = useState(false);

  // ── Activity Log state
  const [logEntries, setLogEntries] = useState([]);
  const [logFilter, setLogFilter] = useState('all');
  const [logLoading, setLogLoading] = useState(false);

  // ── Priority Contacts state
  const [priorityContacts, setPriorityContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', identifiers: '', priority: 'always_notify', customReply: '' });
  const [editingContact, setEditingContact] = useState(null);
  const [contactsLoading, setContactsLoading] = useState(false);

  // ── Permissions state
  const [permissionsConfig, setPermissionsConfig] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const EXEC_STEPS = ['Intent', 'Tool Select', 'Permission', 'Execute', 'Verify', 'Result'];

  // ─── WebSocket ───────────────────────────────────────────────────────────
  useEffect(() => {
    const wsUrl = apiBase.replace(/^http/, 'ws');
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'ACTIVITY_LOG_UPDATE') {
          setLogEntries(prev => [msg.entry, ...prev].slice(0, 200));
        }
        if (msg.type === 'PERMISSION_REQUEST') {
          setPendingConfirmations(prev => [...prev, msg]);
        }
        if (msg.type === 'BUSY_MODE_ESCALATION') {
          setLogEntries(prev => [{
            id: `esc-${Date.now()}`, type: 'escalation', icon: '🔔',
            text: `HIGH PRIORITY: ${msg.sender} — "${msg.message.substring(0, 60)}"`,
            timestamp: msg.timestamp
          }, ...prev].slice(0, 200));
        }
        if (msg.type === 'TASK_STEP_START') {
          setCurrentStep(msg.step - 1);
        }
        if (msg.type === 'TASK_STEP_DONE') {
          setCurrentStep(msg.step);
        }
      } catch (_e) {}
    };

    return () => ws.close();
  }, [apiBase]);

  // ─── Data fetching ───────────────────────────────────────────────────────
  const fetchBusyConfig = useCallback(async () => {
    try {
      const r = await fetch(`${apiBase}/api/busy/config`);
      setBusyConfig(await r.json());
    } catch (e) { console.error(e); }
  }, [apiBase]);

  const fetchLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const r = await fetch(`${apiBase}/api/agent/activity-log?limit=150`);
      const d = await r.json();
      setLogEntries(d.entries || []);
    } catch (e) { console.error(e); } finally { setLogLoading(false); }
  }, [apiBase]);

  const fetchPriorityContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const r = await fetch(`${apiBase}/api/busy/priority-contacts`);
      const d = await r.json();
      setPriorityContacts(d.contacts || []);
    } catch (e) { console.error(e); } finally { setContactsLoading(false); }
  }, [apiBase]);

  const fetchPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    try {
      const r = await fetch(`${apiBase}/api/agent/permissions`);
      setPermissionsConfig(await r.json());
    } catch (e) { console.error(e); } finally { setPermissionsLoading(false); }
  }, [apiBase]);

  useEffect(() => {
    fetchBusyConfig();
    fetchLog();
    fetchPriorityContacts();
    fetchPermissions();
  }, [fetchBusyConfig, fetchLog, fetchPriorityContacts, fetchPermissions]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleHistory]);

  // ─── Console Execution ───────────────────────────────────────────────────
  const runConsoleCommand = async (e) => {
    e?.preventDefault();
    if (!consoleInput.trim() || isProcessing) return;
    const query = consoleInput.trim();
    setConsoleInput('');
    setIsProcessing(true);
    setCurrentStep(0);

    const userEntry = { id: Date.now(), type: 'user', text: query, timestamp: new Date().toLocaleTimeString() };
    setConsoleHistory(prev => [...prev, userEntry]);

    try {
      // Step 1: Intent
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 300));

      // Step 2: Tool Select
      setCurrentStep(2);
      await new Promise(r => setTimeout(r, 300));

      // Step 3: Permission
      setCurrentStep(3);
      const res = await fetch(`${apiBase}/api/agent/query`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();

      // Step 4-5: Execute + Verify
      setCurrentStep(4);
      await new Promise(r => setTimeout(r, 200));
      setCurrentStep(5);
      await new Promise(r => setTimeout(r, 200));
      setCurrentStep(6);

      const agentEntry = {
        id: Date.now() + 1, type: 'agent', text: data.response || 'Task completed.',
        toolsExecuted: data.toolsExecuted || [], timestamp: new Date().toLocaleTimeString()
      };
      setConsoleHistory(prev => [...prev, agentEntry]);
    } catch (err) {
      setConsoleHistory(prev => [...prev, {
        id: Date.now() + 2, type: 'error', text: `Error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsProcessing(false);
      setCurrentStep(-1);
    }
  };

  const handleConfirm = async (id, approved) => {
    setPendingConfirmations(prev => prev.filter(c => c.id !== id));
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PERMISSION_RESPONSE', id, approved }));
      } else {
        await fetch(`${apiBase}/api/agent/confirm`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, approved })
        });
      }
    } catch (e) { console.error(e); }
  };

  const runTool = async (toolName, args = {}) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${apiBase}/api/agent/execute`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolName, args })
      });
      const data = await res.json();
      setConsoleHistory(prev => [...prev, {
        id: Date.now(), type: 'agent',
        text: data.success ? `✅ ${toolName} completed successfully.` : `❌ ${data.error || data.reason}`,
        toolsExecuted: [{ tool: toolName, result: data.result }],
        timestamp: new Date().toLocaleTimeString()
      }]);
      setActiveTab('console');
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  // ─── Busy Mode actions ───────────────────────────────────────────────────
  const toggleBusy = async () => {
    setBusyLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/busy/toggle`, { method: 'POST' });
      const d = await res.json();
      setBusyConfig(d.config);
    } catch (e) { console.error(e); } finally { setBusyLoading(false); }
  };

  const updateBusyConfig = async (updates) => {
    try {
      const res = await fetch(`${apiBase}/api/busy/config`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const d = await res.json();
      if (d.config) setBusyConfig(d.config);
    } catch (e) { console.error(e); }
  };

  const runSimulation = async () => {
    setSimRunning(true);
    setSimResult(null);
    try {
      const res = await fetch(`${apiBase}/api/busy/simulate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'whatsapp', sender: simSender, message: simMessage })
      });
      const d = await res.json();
      setSimResult(d.result);
      await fetchLog();
    } catch (e) { console.error(e); } finally { setSimRunning(false); }
  };

  // ─── Priority Contacts actions ────────────────────────────────────────────
  const addContact = async () => {
    if (!newContact.name.trim()) return;
    try {
      const res = await fetch(`${apiBase}/api/busy/priority-contacts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newContact,
          identifiers: newContact.identifiers.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      const d = await res.json();
      if (d.contacts) setPriorityContacts(d.contacts);
      setNewContact({ name: '', identifiers: '', priority: 'always_notify', customReply: '' });
    } catch (e) { console.error(e); }
  };

  const deleteContact = async (id) => {
    try {
      const res = await fetch(`${apiBase}/api/busy/priority-contacts/${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.contacts) setPriorityContacts(d.contacts);
    } catch (e) { console.error(e); }
  };

  const updateToolPermission = async (toolName, field, value) => {
    try {
      const res = await fetch(`${apiBase}/api/agent/permissions/tool`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, override: { [field]: value } })
      });
      const d = await res.json();
      if (d.config) setPermissionsConfig(d.config);
    } catch (e) { console.error(e); }
  };

  const clearLog = async () => {
    try {
      await fetch(`${apiBase}/api/agent/activity-log`, { method: 'DELETE' });
      setLogEntries([]);
    } catch (e) { console.error(e); }
  };

  const exportLog = () => {
    const blob = new Blob([JSON.stringify(logEntries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `jasper-activity-log-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ─── Styles ───────────────────────────────────────────────────────────────
  const glass = {
    background: 'rgba(10,15,35,0.92)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0,212,255,0.12)',
    borderRadius: 16
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: 10, padding: '10px 14px', color: '#e0f0ff', fontSize: 14,
    width: '100%', outline: 'none', fontFamily: 'inherit'
  };

  const btnPrimary = {
    background: 'linear-gradient(135deg, #0ea5e9, #00d4ff)', border: 'none',
    borderRadius: 10, padding: '10px 20px', color: '#000', fontWeight: 700,
    fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
  };

  const btnDanger = { ...btnPrimary, background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff' };
  const btnSuccess = { ...btnPrimary, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff' };

  const filterLog = logEntries.filter(e => {
    if (logFilter === 'all') return true;
    if (logFilter === 'messages') return e.type?.includes('message') || e.type?.includes('reply');
    if (logFilter === 'tools') return e.type?.includes('tool') || e.type?.includes('task');
    if (logFilter === 'alerts') return e.type === 'escalation' || e.priority === 'high';
    return true;
  });

  const priorityColors = {
    always_notify: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Always Notify', icon: '🔴' },
    notify_during_hours: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Notify During Hours', icon: '🟡' },
    normal: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Normal Priority', icon: '🟢' }
  };

  // ─── Tab Renderers ────────────────────────────────────────────────────────

  const renderConsole = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      {/* Step indicator */}
      {isProcessing && (
        <div style={{ ...glass, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'rgba(200,220,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Execution Pipeline</div>
          <StepIndicator steps={EXEC_STEPS} currentStep={currentStep} />
        </div>
      )}

      {/* Pending confirmations */}
      {pendingConfirmations.length > 0 && (
        <div style={{ ...glass, padding: 14, borderColor: 'rgba(245,158,11,0.3)' }}>
          <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} /> Pending Confirmations ({pendingConfirmations.length})
          </div>
          {pendingConfirmations.map(c => (
            <div key={c.id} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#e0f0ff', fontWeight: 600 }}>{c.description || c.tool}</div>
              <div style={{ fontSize: 11, color: 'rgba(200,220,255,0.5)', marginTop: 3 }}>
                <PermissionBadge level={c.level} /> · Args: {JSON.stringify(c.args || {}).substring(0, 80)}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button id={`confirm-approve-${c.id}`} onClick={() => handleConfirm(c.id, true)} style={btnSuccess}>
                  <Check size={14} /> Approve
                </button>
                <button id={`confirm-deny-${c.id}`} onClick={() => handleConfirm(c.id, false)} style={btnDanger}>
                  <X size={14} /> Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat history */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {consoleHistory.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(200,220,255,0.3)' }}>
            <Bot size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <div style={{ fontSize: 14 }}>JASPER Agent Console</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Type a command or try: "What's my system status?" or "Enable busy mode"</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              {["What's the time?", "Open Notepad", "System status", "Enable busy mode"].map(s => (
                <button key={s} onClick={() => setConsoleInput(s)} style={{
                  background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 20, padding: '6px 14px', color: '#00d4ff', fontSize: 12, cursor: 'pointer'
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {consoleHistory.map(entry => (
          <div key={entry.id} style={{
            display: 'flex', flexDirection: entry.type === 'user' ? 'row-reverse' : 'row',
            gap: 10, alignItems: 'flex-start'
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: entry.type === 'user' ? 'rgba(59,130,246,0.3)' : entry.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(0,212,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${entry.type === 'user' ? '#3b82f6' : entry.type === 'error' ? '#ef4444' : '#00d4ff'}44`
            }}>
              {entry.type === 'user' ? <Hash size={14} color="#3b82f6" /> : entry.type === 'error' ? <AlertCircle size={14} color="#ef4444" /> : <Bot size={14} color="#00d4ff" />}
            </div>
            <div style={{ maxWidth: '80%' }}>
              <div style={{
                background: entry.type === 'user' ? 'rgba(59,130,246,0.1)' : entry.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(0,212,255,0.07)',
                border: `1px solid ${entry.type === 'user' ? 'rgba(59,130,246,0.2)' : entry.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(0,212,255,0.15)'}`,
                borderRadius: entry.type === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                padding: '10px 14px', fontSize: 13, color: '#e0f0ff', lineHeight: 1.5
              }}>
                {entry.text}
              </div>
              {entry.toolsExecuted?.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {entry.toolsExecuted.map((t, i) => (
                    <div key={i} style={{
                      fontSize: 11, color: 'rgba(200,220,255,0.5)', display: 'flex', alignItems: 'center', gap: 6,
                      background: 'rgba(0,212,255,0.05)', borderRadius: 6, padding: '4px 10px'
                    }}>
                      <CheckCircle2 size={10} color="#22c55e" />
                      <code style={{ color: '#00d4ff' }}>{t.tool || t.intent}</code>
                      {t.result && <span>→ {JSON.stringify(t.result).substring(0, 60)}</span>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 10, color: 'rgba(200,220,255,0.3)', marginTop: 4, paddingLeft: 4 }}>{entry.timestamp}</div>
            </div>
          </div>
        ))}
        <div ref={consoleEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={runConsoleCommand} style={{ display: 'flex', gap: 8 }}>
        <input
          id="agent-console-input"
          value={consoleInput}
          onChange={e => setConsoleInput(e.target.value)}
          placeholder="Tell Jasper what to do..."
          style={{ ...inputStyle, flex: 1 }}
          disabled={isProcessing}
        />
        <button id="agent-console-send" type="submit" style={btnPrimary} disabled={isProcessing || !consoleInput.trim()}>
          {isProcessing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );

  const renderBusyMode = () => {
    if (!busyConfig) return <div style={{ textAlign: 'center', padding: 40, color: 'rgba(200,220,255,0.4)' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: 'auto' }} /></div>;
    const isActive = busyConfig.enabled;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', height: '100%' }}>
        {/* Master toggle */}
        <div style={{ ...glass, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e0f0ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                {isActive ? <BellOff size={18} color="#00d4ff" /> : <Bell size={18} color="rgba(200,220,255,0.5)" />}
                Busy Mode
              </div>
              <div style={{ fontSize: 12, color: 'rgba(200,220,255,0.5)', marginTop: 4 }}>
                {isActive ? `Active · ${BUSY_PRESETS[busyConfig.preset]?.label || 'Custom'}` : 'Disabled — incoming messages handled normally'}
              </div>
            </div>
            <button
              id="busy-mode-toggle"
              onClick={toggleBusy}
              disabled={busyLoading}
              style={{
                ...isActive ? btnSuccess : btnPrimary,
                padding: '10px 24px', fontSize: 14,
                background: isActive ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#0ea5e9,#00d4ff)'
              }}
            >
              {busyLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : isActive ? <><Power size={16} /> ON</> : <><Power size={16} /> OFF</>}
            </button>
          </div>
          {isActive && (
            <div style={{ marginTop: 12, padding: 10, background: 'rgba(0,212,255,0.08)', borderRadius: 10, border: '1px solid rgba(0,212,255,0.2)', fontSize: 12, color: '#00d4ff' }}>
              🤖 JASPER is actively managing your messages. All actions are logged.
            </div>
          )}
        </div>

        {/* Presets */}
        <div style={{ ...glass, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,220,255,0.7)', marginBottom: 12 }}>Reply Preset</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.entries(BUSY_PRESETS).map(([key, p]) => (
              <button
                key={key}
                id={`busy-preset-${key}`}
                onClick={() => updateBusyConfig({ preset: key })}
                style={{
                  background: busyConfig.preset === key ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${busyConfig.preset === key ? '#00d4ff' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10, transition: 'all .2s'
                }}
              >
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: busyConfig.preset === key ? '#00d4ff' : '#e0f0ff' }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(200,220,255,0.4)' }}>{p.desc}</div>
                </div>
                {busyConfig.preset === key && <Check size={14} color="#00d4ff" style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>
          {busyConfig.preset === 'custom' && (
            <textarea
              id="busy-custom-reply"
              rows={3}
              value={busyConfig.customReply || ''}
              onChange={e => updateBusyConfig({ customReply: e.target.value })}
              placeholder="Your custom auto-reply message..."
              style={{ ...inputStyle, marginTop: 10, resize: 'vertical' }}
            />
          )}
          {busyConfig.preset !== 'custom' && (
            <div style={{ marginTop: 10, padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 12, color: 'rgba(200,220,255,0.6)', fontStyle: 'italic' }}>
              "{busyConfig.presets?.[busyConfig.preset]}"
            </div>
          )}
        </div>

        {/* Allowed Apps */}
        <div style={{ ...glass, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,220,255,0.7)', marginBottom: 12 }}>Allowed Apps</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[
              { key: 'whatsapp', label: 'WhatsApp', icon: '💬' },
              { key: 'instagram', label: 'Instagram', icon: '📸' },
              { key: 'email', label: 'Email', icon: '📧' },
              { key: 'sms', label: 'SMS', icon: '📱' }
            ].map(app => {
              const enabled = busyConfig.allowedApps?.[app.key];
              return (
                <button
                  key={app.key}
                  id={`busy-app-${app.key}`}
                  onClick={() => updateBusyConfig({ allowedApps: { ...(busyConfig.allowedApps || {}), [app.key]: !enabled } })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                    borderRadius: 20, border: `1px solid ${enabled ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                    background: enabled ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                    color: enabled ? '#22c55e' : 'rgba(200,220,255,0.5)', cursor: 'pointer', fontSize: 13
                  }}
                >
                  {app.icon} {app.label}
                  {enabled ? <Check size={12} /> : <X size={12} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings row */}
        <div style={{ ...glass, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,220,255,0.7)' }}>Settings</div>
          {[
            { key: 'aiRepliesEnabled', label: 'AI Smart Replies (Gemini)', icon: Sparkles, desc: 'Generate context-aware replies instead of preset' },
            { key: 'askConfirmationBeforeSend', label: 'Ask before sending', icon: AlertTriangle, desc: 'JASPER will notify you before each auto-reply' },
            { key: 'identifyAsAI', label: 'Identify as AI', icon: Bot, desc: 'Auto-replies will mention JASPER is responding' },
            { key: 'mentionAvailability', label: 'Mention availability', icon: Clock, desc: "Include user's expected availability in replies" }
          ].map(s => {
            const Icon = s.icon;
            const enabled = busyConfig[s.key];
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={15} color="rgba(200,220,255,0.5)" />
                  <div>
                    <div style={{ fontSize: 13, color: '#e0f0ff' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(200,220,255,0.4)' }}>{s.desc}</div>
                  </div>
                </div>
                <button
                  id={`busy-setting-${s.key}`}
                  onClick={() => updateBusyConfig({ [s.key]: !enabled })}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: enabled ? '#22c55e' : 'rgba(255,255,255,0.12)', position: 'relative', transition: 'all .2s'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: enabled ? 22 : 3, width: 18, height: 18,
                    borderRadius: '50%', background: '#fff', transition: 'left .2s'
                  }} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Simulation panel */}
        <div style={{ ...glass, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,220,255,0.7)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Radio size={14} /> Live Simulation
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input id="sim-sender" value={simSender} onChange={e => setSimSender(e.target.value)} placeholder="Sender name" style={{ ...inputStyle, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input id="sim-message" value={simMessage} onChange={e => setSimMessage(e.target.value)} placeholder="Test message..." style={{ ...inputStyle, flex: 1 }} />
            <button id="sim-run" onClick={runSimulation} style={btnPrimary} disabled={simRunning}>
              {simRunning ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
              Test
            </button>
          </div>
          {simResult && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: simResult.action === 'escalate' ? 'rgba(239,68,68,0.1)' : simResult.action === 'reply' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${simResult.action === 'escalate' ? 'rgba(239,68,68,0.3)' : simResult.action === 'reply' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: simResult.action === 'escalate' ? '#ef4444' : simResult.action === 'reply' ? '#22c55e' : 'rgba(200,220,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Action: {simResult.action}
              </div>
              {simResult.classification && <div style={{ fontSize: 12, color: 'rgba(200,220,255,0.6)', marginBottom: 6 }}>Priority: {simResult.classification.priority} — {simResult.classification.reason}</div>}
              {simResult.reply && <div style={{ fontSize: 13, color: '#e0f0ff', fontStyle: 'italic' }}>"{simResult.reply}"</div>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActivityLog = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[['all','All'],['messages','Messages'],['tools','Tools'],['alerts','Alerts']].map(([v, l]) => (
            <button key={v} id={`log-filter-${v}`} onClick={() => setLogFilter(v)} style={{
              padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
              background: logFilter === v ? 'rgba(0,212,255,0.15)' : 'transparent',
              color: logFilter === v ? '#00d4ff' : 'rgba(200,220,255,0.5)'
            }}>{l}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button id="log-refresh" onClick={fetchLog} style={{ ...btnPrimary, padding: '8px 14px' }}><RefreshCw size={14} /></button>
          <button id="log-export" onClick={exportLog} style={{ ...btnPrimary, padding: '8px 14px' }}><Download size={14} /></button>
          <button id="log-clear" onClick={clearLog} style={{ ...btnDanger, padding: '8px 14px' }}><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Log entries */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {logLoading && <div style={{ textAlign: 'center', padding: 30, color: 'rgba(200,220,255,0.4)' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /></div>}
        {!logLoading && filterLog.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(200,220,255,0.3)' }}>
            <Activity size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
            <div>No activity logged yet</div>
          </div>
        )}
        {filterLog.map(entry => {
          const icon = entry.icon || LOG_ICONS[entry.type] || '📋';
          const isHigh = entry.priority === 'high' || entry.type === 'escalation';
          const ts = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '';
          return (
            <div key={entry.id} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px',
              borderRadius: 10, transition: 'background .15s',
              background: isHigh ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isHigh ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#e0f0ff', lineHeight: 1.4 }}>
                  {entry.text || entry.tool || entry.type?.replace(/_/g, ' ')}
                  {entry.tool && !entry.text && ` — ${entry.tool}`}
                </div>
                {(entry.reply || entry.result || entry.reason) && (
                  <div style={{ fontSize: 11, color: 'rgba(200,220,255,0.45)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.reply || entry.result || entry.reason}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(200,220,255,0.3)', flexShrink: 0 }}>{ts}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPriorityContacts = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14, overflowY: 'auto' }}>
      {/* Contact list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {contactsLoading ? (
          <div style={{ textAlign: 'center', padding: 30 }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /></div>
        ) : priorityContacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'rgba(200,220,255,0.3)' }}>
            <Users size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
            <div>No priority contacts set</div>
          </div>
        ) : (
          priorityContacts.map(contact => {
            const pm = priorityColors[contact.priority] || priorityColors.normal;
            return (
              <div key={contact.id} style={{
                ...glass, padding: 14, display: 'flex', alignItems: 'center', gap: 14
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  background: pm.bg, border: `2px solid ${pm.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                }}>{pm.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e0f0ff' }}>{contact.name}</div>
                  <div style={{ fontSize: 11, color: pm.color, marginTop: 2 }}>{pm.label}</div>
                  {contact.customReply && <div style={{ fontSize: 11, color: 'rgba(200,220,255,0.4)', marginTop: 3, fontStyle: 'italic' }}>"{contact.customReply.substring(0, 60)}"</div>}
                  {contact.notifyHours && <div style={{ fontSize: 11, color: 'rgba(200,220,255,0.4)', marginTop: 3 }}>⏰ {contact.notifyHours.start} – {contact.notifyHours.end}</div>}
                </div>
                <button
                  id={`delete-contact-${contact.id}`}
                  onClick={() => deleteContact(contact.id)}
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#ef4444' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add contact form */}
      <div style={{ ...glass, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,220,255,0.7)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserPlus size={14} /> Add Priority Contact
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input id="new-contact-name" value={newContact.name} onChange={e => setNewContact(p => ({...p, name: e.target.value}))} placeholder="Contact name (e.g. Mom)" style={inputStyle} />
          <input id="new-contact-ids" value={newContact.identifiers} onChange={e => setNewContact(p => ({...p, identifiers: e.target.value}))} placeholder="Identifiers (comma-separated, e.g. mom, mother)" style={inputStyle} />
          <select id="new-contact-priority" value={newContact.priority} onChange={e => setNewContact(p => ({...p, priority: e.target.value}))} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="always_notify">🔴 Always Notify</option>
            <option value="notify_during_hours">🟡 Notify During Hours</option>
            <option value="normal">🟢 Normal Priority</option>
          </select>
          <input id="new-contact-reply" value={newContact.customReply} onChange={e => setNewContact(p => ({...p, customReply: e.target.value}))} placeholder="Custom reply (leave blank for preset)" style={inputStyle} />
          <button id="add-contact-btn" onClick={addContact} style={btnPrimary}>
            <Plus size={14} /> Add Contact
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: 14, background: 'rgba(0,212,255,0.06)', borderRadius: 12, border: '1px solid rgba(0,212,255,0.12)', fontSize: 12, color: 'rgba(200,220,255,0.6)', lineHeight: 1.6 }}>
        <strong style={{ color: '#00d4ff' }}>How priority contacts work:</strong><br />
        🔴 <strong>Always Notify</strong> — JASPER will never silently suppress. User is always alerted immediately.<br />
        🟡 <strong>Notify During Hours</strong> — Only notify during configured time window.<br />
        🟢 <strong>Normal</strong> — Standard auto-reply behavior without escalation.
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14, overflowY: 'auto' }}>
      {/* Level legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Object.entries(LEVEL_META).map(([level, meta]) => {
          const Icon = meta.icon;
          return (
            <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: meta.bgColor, border: `1px solid ${meta.color}44`, fontSize: 12 }}>
              <Icon size={12} color={meta.color} />
              <span style={{ color: meta.color, fontWeight: 600 }}>L{level}</span>
              <span style={{ color: 'rgba(200,220,255,0.6)' }}>{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* Tool table */}
      <div style={{ ...glass, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 0 }}>
          {/* Header */}
          {['Tool', 'Level', 'Enabled', 'Confirm'].map(h => (
            <div key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'rgba(200,220,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>{h}</div>
          ))}
          {/* Rows */}
          {TOOL_CATALOG.map((tool, i) => {
            const override = permissionsConfig?.tool_overrides?.[tool.name] || {};
            const isEnabled = override.enabled !== false;
            const requireConfirm = override.requireConfirmation === true || (tool.level === 3);
            const rowBg = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
            return (
              <React.Fragment key={tool.name}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: rowBg }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e0f0ff', fontFamily: 'monospace' }}>{tool.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(200,220,255,0.4)', marginTop: 2 }}>{tool.description}</div>
                </div>
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', background: rowBg }}>
                  <PermissionBadge level={tool.level} />
                </div>
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', background: rowBg }}>
                  <button
                    id={`perm-enable-${tool.name}`}
                    onClick={() => updateToolPermission(tool.name, 'enabled', !isEnabled)}
                    disabled={tool.level === 3 && false}
                    style={{
                      width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                      background: isEnabled ? '#22c55e' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all .2s'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 2, left: isEnabled ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                  </button>
                </div>
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', background: rowBg }}>
                  {tool.level >= 2 ? (
                    <button
                      id={`perm-confirm-${tool.name}`}
                      onClick={() => updateToolPermission(tool.name, 'requireConfirmation', !requireConfirm)}
                      style={{
                        width: 38, height: 22, borderRadius: 11, border: 'none', cursor: tool.level === 3 ? 'not-allowed' : 'pointer',
                        background: requireConfirm ? '#f59e0b' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all .2s',
                        opacity: tool.level === 3 ? 0.5 : 1
                      }}
                    >
                      <div style={{ position: 'absolute', top: 2, left: requireConfirm ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: 'rgba(200,220,255,0.25)' }}>—</span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Global settings */}
      {permissionsConfig?.global_settings && (
        <div style={{ ...glass, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,220,255,0.7)', marginBottom: 12 }}>Global Settings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, color: '#e0f0ff' }}>Log All Actions</div>
                <div style={{ fontSize: 11, color: 'rgba(200,220,255,0.4)' }}>Record every tool execution in the activity log</div>
              </div>
              <button id="global-log-actions" style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: permissionsConfig.global_settings.logAllActions ? '#22c55e' : 'rgba(255,255,255,0.12)', position: 'relative'
              }} onClick={() => {
                const newVal = !permissionsConfig.global_settings.logAllActions;
                fetch(`${apiBase}/api/agent/permissions/global`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: { logAllActions: newVal } }) }).then(() => fetchPermissions());
              }}>
                <div style={{ position: 'absolute', top: 3, left: permissionsConfig.global_settings.logAllActions ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: 14, background: 'rgba(239,68,68,0.06)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.15)', fontSize: 12, color: 'rgba(200,220,255,0.6)', lineHeight: 1.6 }}>
        <strong style={{ color: '#ef4444' }}>Security Note:</strong> L3 (Sensitive) actions always require explicit confirmation regardless of settings. The AI can never bypass the permission layer or execute arbitrary system commands.
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(5,10,25,0.95)', borderRadius: 16, overflow: 'hidden', fontFamily: "'Inter', 'Outfit', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px 0', background: 'rgba(0,212,255,0.04)', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0ea5e9,#00d4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(0,212,255,0.4)' }}>
              <Brain size={20} color="#000" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#e0f0ff', letterSpacing: 0.5 }}>JASPER Agent Hub</div>
              <div style={{ fontSize: 11, color: 'rgba(200,220,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: wsConnected ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
                {wsConnected ? 'Live — Agent Online' : 'Connecting...'}
                {busyConfig?.enabled && <span style={{ marginLeft: 4, color: '#00d4ff', fontWeight: 600 }}>· Busy Mode Active</span>}
              </div>
            </div>
          </div>
          {onClose && (
            <button id="agent-hub-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'rgba(200,220,255,0.6)' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingBottom: 0 }}>
          <TabBtn id="console" label="Agent Console" icon={Bot} active={activeTab==='console'} onClick={setActiveTab} badge={pendingConfirmations.length} />
          <TabBtn id="busy" label="Busy Mode" icon={BellOff} active={activeTab==='busy'} onClick={setActiveTab} />
          <TabBtn id="log" label="Activity Log" icon={Activity} active={activeTab==='log'} onClick={setActiveTab} badge={logEntries.filter(e => e.priority === 'high' || e.type === 'escalation').length} />
          <TabBtn id="contacts" label="Priority Contacts" icon={Users} active={activeTab==='contacts'} onClick={setActiveTab} />
          <TabBtn id="permissions" label="Permissions" icon={ShieldCheck} active={activeTab==='permissions'} onClick={setActiveTab} />
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', padding: 16 }}>
        {activeTab === 'console' && renderConsole()}
        {activeTab === 'busy' && renderBusyMode()}
        {activeTab === 'log' && renderActivityLog()}
        {activeTab === 'contacts' && renderPriorityContacts()}
        {activeTab === 'permissions' && renderPermissions()}
      </div>
    </div>
  );
}
