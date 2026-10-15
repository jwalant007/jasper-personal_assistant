import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { JasperProvider } from './context/index.jsx';
import { getApiBase } from './utils/apiConfig.js';
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
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                window.location.href = window.location.pathname + '?t=' + Date.now();
              }} 
              style={{ padding: '10px 20px', background: 'rgba(103, 223, 255, 0.2)', border: '1px solid #67DFFF', color: '#67DFFF', borderRadius: '8px', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 'bold' }}
            >
              RELOAD SAFE WORKSPACE
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                if ('caches' in window) {
                  try {
                    caches.keys().then(names => {
                      names.forEach(name => caches.delete(name));
                    });
                  } catch (e) {}
                }
                window.location.href = window.location.pathname + '?t=' + Date.now();
              }} 
              style={{ padding: '10px 20px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fcd34d', borderRadius: '8px', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 'bold' }}
            >
              RESET ALL STATE & RELOAD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global Automated Authentication, Multi-User Header & Mobile Backend Router Interceptor
if (typeof window !== 'undefined' && window.fetch) {
  const nativeFetch = window.fetch;
  window.fetch = function(input, init) {
    const token = localStorage.getItem('jasper_auth_token') || 'jasper';
    const currentUserId = localStorage.getItem('jasper_current_user_id') || 'jwalant';

    let resolvedInput = input;
    if (typeof input === 'string' && input.startsWith('/api')) {
      try {
        const base = getApiBase();
        if (base && !base.includes('localhost:5173')) {
          resolvedInput = `${base.replace(/\/+$/, '')}${input}`;
        }
      } catch (_) {}
    }

    const isApi = (typeof resolvedInput === 'string' && (resolvedInput.startsWith('/api') || resolvedInput.includes('/api/'))) ||
                  (resolvedInput instanceof Request && resolvedInput.url && resolvedInput.url.includes('/api/'));

    if (isApi) {
      init = init || {};
      const customHeaders = new Headers(init.headers || {});
      if (!customHeaders.has('x-jasper-token')) {
        customHeaders.set('x-jasper-token', token);
      }
      if (!customHeaders.has('x-user-id')) {
        customHeaders.set('x-user-id', currentUserId);
      }
      init.headers = customHeaders;
    }
    return nativeFetch.call(this, resolvedInput, init);
  };
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
