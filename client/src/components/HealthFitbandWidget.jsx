import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Activity, 
  Bluetooth, 
  Zap, 
  Radio, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  X, 
  ShieldCheck, 
  Flame, 
  Footprints, 
  Clock, 
  Sliders,
  Volume2
} from 'lucide-react';

export default function HealthFitbandWidget({ onClose, onAskJasper }) {
  const [connectionMode, setConnectionMode] = useState('simulated'); // 'disconnected', 'ble', 'simulated'
  const [deviceName, setDeviceName] = useState('Virtual Fitband Pro');
  const [heartRate, setHeartRate] = useState(74);
  const [spO2, setSpO2] = useState(98);
  const [steps, setSteps] = useState(6480);
  const [calories, setCalories] = useState(320);
  const [activeMinutes, setActiveMinutes] = useState(45);
  const [stressLevel, setStressLevel] = useState(22); // 0 - 100
  const [hrv, setHrv] = useState(65); // ms
  const [vitalLogs, setVitalLogs] = useState([]);
  const [isAlerting, setIsAlerting] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isBleConnecting, setIsBleConnecting] = useState(false);
  const [bleError, setBleError] = useState(null);

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pulsePhaseRef = useRef(0);
  const gattDeviceRef = useRef(null);

  // Sync current vitals to localStorage so Gemini tool calls can query them instantly
  useEffect(() => {
    const vitalsData = {
      bpm: heartRate,
      spO2: spO2,
      steps: steps,
      calories: calories,
      stress: stressLevel,
      hrv: hrv,
      device: deviceName,
      status: heartRate > 120 ? 'Elevated HR' : spO2 < 95 ? 'Low SpO2' : 'Normal',
      lastUpdated: new Date().toLocaleTimeString()
    };
    localStorage.setItem('jasper_health_vitals', JSON.stringify(vitalsData));
  }, [heartRate, spO2, steps, calories, stressLevel, hrv, deviceName]);

  // Telemetry log updater
  useEffect(() => {
    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();
      const newEntry = {
        id: Date.now(),
        time: timestamp,
        bpm: heartRate,
        spO2: spO2,
        mode: connectionMode === 'ble' ? 'BLE Hardware' : 'Virtual Simulator'
      };
      setVitalLogs(prev => [newEntry, ...prev.slice(0, 19)]);
    }, 4000);
    return () => clearInterval(interval);
  }, [heartRate, spO2, connectionMode]);

  // Virtual Simulator loop
  useEffect(() => {
    if (connectionMode !== 'simulated') return;

    const interval = setInterval(() => {
      // Natural slight fluctuations in heart rate and SpO2
      setHeartRate(prev => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next = Math.max(58, Math.min(115, prev + delta));
        return next;
      });

      setSpO2(prev => {
        if (Math.random() > 0.8) {
          const delta = Math.floor(Math.random() * 3) - 1;
          return Math.max(94, Math.min(100, prev + delta));
        }
        return prev;
      });

      setSteps(prev => prev + Math.floor(Math.random() * 3));
      setCalories(prev => prev + (Math.random() > 0.6 ? 1 : 0));
    }, 2000);

    return () => clearInterval(interval);
  }, [connectionMode]);

  // Safety threshold checking
  useEffect(() => {
    if (heartRate > 120) {
      setIsAlerting(true);
      setAlertMessage(`HIGH HEART RATE WARNING: ${heartRate} BPM detected!`);
    } else if (spO2 < 94) {
      setIsAlerting(true);
      setAlertMessage(`LOW BLOOD OXYGEN ALERT: SpO2 dropped to ${spO2}%!`);
    } else {
      setIsAlerting(false);
      setAlertMessage('');
    }
  }, [heartRate, spO2]);

  // Live Pulse Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let running = true;
    const points = new Array(120).fill(40);

    const render = () => {
      if (!running || !canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update ECG waveform simulation based on heart rate
      pulsePhaseRef.current += (heartRate / 60) * 0.15;
      const phase = pulsePhaseRef.current % (Math.PI * 2);

      let pulseVal = 0;
      // Simulate P-Q-R-S-T wave peak
      if (phase > 1.2 && phase < 1.4) {
        pulseVal = -8; // P wave
      } else if (phase >= 1.4 && phase < 1.5) {
        pulseVal = 6; // Q wave
      } else if (phase >= 1.5 && phase < 1.7) {
        pulseVal = -32; // R wave (sharp pulse)
      } else if (phase >= 1.7 && phase < 1.85) {
        pulseVal = 14; // S wave
      } else if (phase >= 2.1 && phase < 2.5) {
        pulseVal = -10; // T wave
      }

      // Smooth noise
      const noise = (Math.random() - 0.5) * 2;
      const currentY = (height / 2) + pulseVal + noise;

      points.shift();
      points.push(currentY);

      // Draw ECG Line
      ctx.beginPath();
      ctx.strokeStyle = connectionMode === 'disconnected' 
        ? '#64748b' 
        : isAlerting ? '#ef4444' : '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = isAlerting ? '#ef4444' : '#00f0ff';
      ctx.shadowBlur = 10;

      const dx = width / (points.length - 1);
      for (let i = 0; i < points.length; i++) {
        const x = i * dx;
        const y = points[i];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pulse leading point
      const lastX = width - dx;
      const lastY = points[points.length - 1];
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fillStyle = isAlerting ? '#ef4444' : '#ffffff';
      ctx.fill();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [heartRate, connectionMode, isAlerting]);

  // Real BLE Fitband Connect via Web Bluetooth API
  const handleConnectBLE = async () => {
    if (!navigator.bluetooth) {
      setBleError('Web Bluetooth API is not supported in this browser environment. Using Virtual Simulator.');
      return;
    }

    setIsBleConnecting(true);
    setBleError(null);

    try {
      // Request device with standard BLE Heart Rate Service (0x180D) and Pulse Oximeter (0x1822)
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { services: [0x180d] },
          { services: ['pulse_oximeter'] }
        ],
        optionalServices: ['heart_rate', 'pulse_oximeter', 0x180d, 0x1822, 0x180a]
      });

      setDeviceName(device.name || 'Bluetooth Fitband');
      gattDeviceRef.current = device;

      const server = await device.gatt.connect();
      
      // Try Heart Rate Service
      try {
        const hrService = await server.getPrimaryService('heart_rate');
        const hrChar = await hrService.getCharacteristic('heart_rate_measurement');
        await hrChar.startNotifications();

        hrChar.addEventListener('characteristicvaluechanged', (event) => {
          const value = event.target.value;
          const flags = value.getUint8(0);
          const is16Bit = flags & 0x01;
          let bpmVal = 0;
          if (is16Bit) {
            bpmVal = value.getUint16(1, true);
          } else {
            bpmVal = value.getUint8(1);
          }
          if (bpmVal > 0) setHeartRate(bpmVal);
        });
      } catch (err) {
        console.warn('Heart rate service subscription warning:', err);
      }

      setConnectionMode('ble');
      setIsBleConnecting(false);
    } catch (err) {
      console.error('BLE connection error:', err);
      setIsBleConnecting(false);
      setBleError(err.message || 'BLE fitband connection cancelled or unavailable.');
    }
  };

  const getBpmZone = (bpm) => {
    if (bpm < 60) return { label: 'Resting / Low', color: '#38bdf8' };
    if (bpm <= 85) return { label: 'Normal / Optimal', color: '#10b981' };
    if (bpm <= 115) return { label: 'Active / Aerobic', color: '#f59e0b' };
    return { label: 'High / Alert', color: '#ef4444' };
  };

  const bpmZone = getBpmZone(heartRate);

  return (
    <div className="health-hub-container">
      {/* Header */}
      <div className="health-hub-header">
        <div className="health-hub-title-group">
          <div className="health-hub-icon-wrapper">
            <Activity className="icon-pulse" size={24} color="#00f0ff" />
          </div>
          <div>
            <h2 className="health-hub-title">HEALTH & FITBAND HUB</h2>
            <p className="health-hub-subtitle">Real-Time BLE Telemetry & Vital Signs Monitor</p>
          </div>
        </div>

        <div className="health-hub-actions">
          <button 
            className={`mode-btn ${connectionMode === 'simulated' ? 'active' : ''}`}
            onClick={() => {
              setConnectionMode('simulated');
              setDeviceName('Virtual Fitband Pro');
            }}
          >
            <Radio size={14} /> Virtual Simulator
          </button>

          <button 
            className={`mode-btn ${connectionMode === 'ble' ? 'active' : ''}`}
            onClick={handleConnectBLE}
            disabled={isBleConnecting}
          >
            <Bluetooth size={14} /> {isBleConnecting ? 'Pairing...' : 'Pair BLE Fitband'}
          </button>

          {onClose && (
            <button className="close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Safety Alert Banner if triggered */}
      {isAlerting && (
        <div className="vital-alert-banner">
          <AlertTriangle size={20} className="alert-icon-anim" />
          <span>{alertMessage}</span>
        </div>
      )}

      {bleError && (
        <div className="ble-error-banner">
          <AlertTriangle size={16} />
          <span>{bleError}</span>
        </div>
      )}

      {/* Status Bar */}
      <div className="health-status-bar">
        <div className="status-item">
          <span className="status-label">Device Status:</span>
          <span className="status-value highlight">
            <CheckCircle2 size={14} color="#10b981" /> {deviceName} ({connectionMode.toUpperCase()})
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">HR Zone:</span>
          <span className="status-value" style={{ color: bpmZone.color }}>
            {bpmZone.label}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Signal Uplink:</span>
          <span className="status-value">100% Active</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="health-grid">
        {/* Heart Rate Card */}
        <div className="health-card heart-rate-card">
          <div className="card-header">
            <span className="card-title"><Heart size={16} color="#ef4444" className="icon-pulse" /> Heart Rate (BPM)</span>
            <span className="live-badge">LIVE</span>
          </div>

          <div className="bpm-display-group">
            <div className="bpm-number">{heartRate}</div>
            <div className="bpm-unit-group">
              <span className="bpm-unit">BPM</span>
              <span className="bpm-subtext" style={{ color: bpmZone.color }}>{bpmZone.label}</span>
            </div>
          </div>

          {/* Pulse ECG Canvas */}
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} width={340} height={80} className="ecg-canvas" />
          </div>
        </div>

        {/* Oxygen Saturation Card (SpO2) */}
        <div className="health-card spo2-card">
          <div className="card-header">
            <span className="card-title"><Activity size={16} color="#00f0ff" /> Oxygen Saturation (SpO2 / O2)</span>
            <span className="live-badge">LIVE</span>
          </div>

          <div className="spo2-gauge-wrapper">
            <div className="spo2-circle">
              <svg viewBox="0 0 100 100" className="spo2-svg">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  stroke="#00f0ff" 
                  strokeWidth="8" 
                  fill="none" 
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * spO2) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                />
              </svg>
              <div className="spo2-value">
                <span>{spO2}%</span>
                <small>SpO2</small>
              </div>
            </div>

            <div className="spo2-info">
              <div className="spo2-stat">
                <span className="stat-label">Blood Oxygen Status</span>
                <span className="stat-value" style={{ color: spO2 >= 95 ? '#10b981' : '#ef4444' }}>
                  {spO2 >= 95 ? 'Normal Saturation' : 'Hypoxia Alert'}
                </span>
              </div>
              <div className="spo2-stat">
                <span className="stat-label">Heart Rate Var. (HRV)</span>
                <span className="stat-value">{hrv} ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity & Vitals Metrics Card */}
        <div className="health-card activity-card">
          <div className="card-header">
            <span className="card-title"><Footprints size={16} color="#f59e0b" /> Daily Activity & Energy</span>
            <span className="live-badge">TODAY</span>
          </div>

          <div className="activity-stats-grid">
            <div className="act-stat-item">
              <Footprints size={18} color="#38bdf8" />
              <div>
                <div className="act-val">{steps.toLocaleString()}</div>
                <div className="act-lbl">Steps</div>
              </div>
            </div>

            <div className="act-stat-item">
              <Flame size={18} color="#ef4444" />
              <div>
                <div className="act-val">{calories}</div>
                <div className="act-lbl">Kcal Burned</div>
              </div>
            </div>

            <div className="act-stat-item">
              <Clock size={18} color="#10b981" />
              <div>
                <div className="act-val">{activeMinutes}m</div>
                <div className="act-lbl">Active Time</div>
              </div>
            </div>

            <div className="act-stat-item">
              <Zap size={18} color="#a855f7" />
              <div>
                <div className="act-val">{stressLevel}/100</div>
                <div className="act-lbl">Stress Index</div>
              </div>
            </div>
          </div>
        </div>

        {/* Vital Signs Telemetry Stream */}
        <div className="health-card logs-card">
          <div className="card-header">
            <span className="card-title"><TrendingUp size={16} color="#a855f7" /> Vitals Telemetry Stream</span>
            <span className="log-count">{vitalLogs.length} Records</span>
          </div>

          <div className="vital-logs-list">
            {vitalLogs.length === 0 ? (
              <div className="empty-logs">Initialising telemetry stream...</div>
            ) : (
              vitalLogs.map(log => (
                <div key={log.id} className="log-row">
                  <span className="log-time">{log.time}</span>
                  <span className="log-bpm"><Heart size={12} color="#ef4444" /> {log.bpm} BPM</span>
                  <span className="log-spo2"><Activity size={12} color="#00f0ff" /> {log.spO2}% SpO2</span>
                  <span className="log-mode">{log.mode}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Voice Query Shortcuts */}
      <div className="health-voice-footer">
        <span className="voice-prompt-label"><Volume2 size={15} color="#00f0ff" /> Quick Voice Commands to Jasper:</span>
        <div className="voice-buttons">
          <button onClick={() => onAskJasper?.("Jasper, what is my heart rate and blood oxygen right now?")}>
            "What is my heart rate & O2?"
          </button>
          <button onClick={() => onAskJasper?.("Jasper, check my fitband health vitals summary")}>
            "Give me a full health summary"
          </button>
        </div>
      </div>
    </div>
  );
}
