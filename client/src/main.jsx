import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { JasperProvider } from './context/index.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    const errStr = error?.toString() || '';
    if (errStr.includes('WebSocket') || errStr.includes('SecurityError') || errStr.includes('Failed to fetch')) {
      console.warn('[ErrorBoundary] Suppressed non-fatal browser network error:', errStr);
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
        <div style={{ padding: '24px', color: '#ffd700', fontFamily: 'sans-serif', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#08080a' }}>
          <h2 style={{ fontFamily: 'monospace', fontSize: '18px', color: '#f59e0b' }}>[JASPER SYSTEM DIAGNOSTIC]</h2>
          <p style={{ fontSize: '12px', color: '#a8a29e', maxWidth: '320px' }}>
            An unexpected client runtime exception occurred:
          </p>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#fcd34d', maxWidth: '90vw', overflowX: 'auto', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
            {'\n'}
            {this.state.error?.stack}
          </div>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }} 
            style={{ padding: '12px 24px', background: 'rgba(245, 197, 66, 0.2)', border: '1px solid #ffd700', color: '#ffd700', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold' }}
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
      <JasperProvider>
        <App />
      </JasperProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
