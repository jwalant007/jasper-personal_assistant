import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    const errStr = error?.toString() || '';
    if (errStr.includes('WebSocket') || errStr.includes('SecurityError') || errStr.includes('Failed to fetch')) {
      console.warn('[ErrorBoundary] Suppressed non-fatal network/security error:', errStr);
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }


  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error in Jasper Client:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', color: '#00f0ff', fontFamily: 'sans-serif', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#020205' }}>
          <h2 style={{ fontFamily: 'monospace', fontSize: '18px', color: '#ff5500' }}>[JASPER SYSTEM DIAGNOSTIC]</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '320px' }}>
            An unexpected client runtime exception occurred:
          </p>
          <div style={{ background: 'rgba(255, 85, 0, 0.1)', border: '1px solid rgba(255, 85, 0, 0.3)', padding: '12px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#fca5a5', maxWidth: '90vw', overflowX: 'auto' }}>
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }} 
            style={{ padding: '12px 24px', background: 'rgba(0, 240, 255, 0.2)', border: '1px solid #00f0ff', color: '#00f0ff', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold' }}
          >
            RESET LOCAL STATE & RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
