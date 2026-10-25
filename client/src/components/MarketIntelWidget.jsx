import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Activity, 
  Sparkles, 
  Bell, 
  RefreshCw, 
  AlertCircle, 
  ShieldCheck, 
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { playJarvisBeep } from '../utils/jarvisAudioSynth';

export default function MarketIntelWidget({ onClose }) {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [timeframe, setTimeframe] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertTarget, setAlertTarget] = useState('');
  const [alerts, setAlerts] = useState([]);

  const [assets, setAssets] = useState([
    { symbol: 'BTC', name: 'Bitcoin', price: '$67,420.50', change: '+3.42%', positive: true, sparkline: [64200, 64800, 65100, 64900, 65800, 66300, 67420] },
    { symbol: 'ETH', name: 'Ethereum', price: '$3,480.20', change: '+2.15%', positive: true, sparkline: [3380, 3400, 3390, 3420, 3450, 3460, 3480] },
    { symbol: 'SOL', name: 'Solana', price: '$178.60', change: '-1.20%', positive: false, sparkline: [184, 182, 180, 181, 179, 177, 178] },
    { symbol: 'NIFTY', name: 'Nifty 50', price: '₹24,850.30', change: '+0.68%', positive: true, sparkline: [24600, 24650, 24700, 24720, 24800, 24830, 24850] },
    { symbol: 'SPX', name: 'S&P 500', price: '$5,815.20', change: '+0.45%', positive: true, sparkline: [5780, 5790, 5785, 5800, 5810, 5812, 5815] },
    { symbol: 'GOLD', name: 'Gold (Oz)', price: '$2,735.80', change: '+1.10%', positive: true, sparkline: [2700, 2710, 2705, 2720, 2728, 2732, 2735] }
  ]);

  const activeAssetData = assets.find(a => a.symbol === selectedAsset) || assets[0];

  const handleRefresh = () => {
    setIsRefreshing(true);
    playJarvisBeep('click');
    setTimeout(() => {
      setIsRefreshing(false);
      playJarvisBeep('success');
      setAssets(prev => prev.map(a => {
        const delta = (Math.random() * 0.8 - 0.3);
        const isPos = delta >= 0;
        return {
          ...a,
          positive: isPos,
          change: `${isPos ? '+' : ''}${delta.toFixed(2)}%`
        };
      }));
    }, 1200);
  };

  const addPriceAlert = (e) => {
    e.preventDefault();
    if (!alertTarget) return;
    playJarvisBeep('command');
    setAlerts(prev => [...prev, { id: Date.now(), asset: selectedAsset, price: alertTarget }]);
    setAlertTarget('');
  };

  const removeAlert = (id) => {
    playJarvisBeep('click');
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Helper to render SVG Sparkline
  const renderSparkline = (points, positive) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const w = 240;
    const h = 60;
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 10) - 5;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <polyline
          fill="none"
          stroke={positive ? '#10b981' : '#f43f5e'}
          strokeWidth="2.5"
          points={coords}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#090d16]/95 text-slate-100 rounded-2xl overflow-hidden border border-emerald-500/25 backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <TrendingUp className="w-5 h-5 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h2 className="text-base font-bold font-orbitron tracking-wider text-emerald-300 flex items-center gap-2 uppercase">
              Market Intelligence & Crypto Ticker
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-mono">
                Live Sparklines
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Global Equities, Crypto Assets & Sentiment Sentinel
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Polling...' : 'Sync Tickers'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {/* Asset Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {assets.map(asset => (
            <button
              key={asset.symbol}
              onClick={() => {
                playJarvisBeep('click');
                setSelectedAsset(asset.symbol);
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedAsset === asset.symbol
                  ? 'border-emerald-500 bg-emerald-950/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-200">{asset.symbol}</span>
                <span className={`text-[10px] font-mono flex items-center ${asset.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {asset.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {asset.change}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-100">{asset.price}</div>
            </button>
          ))}
        </div>

        {/* Selected Asset Spotlight & Sparkline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase">{activeAssetData.name} ({activeAssetData.symbol})</span>
                <div className="text-2xl font-bold font-orbitron text-slate-100 mt-0.5">
                  {activeAssetData.price}
                  <span className={`ml-3 text-sm font-mono ${activeAssetData.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {activeAssetData.change}
                  </span>
                </div>
              </div>

              {/* Timeframe Selectors */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-mono">
                {['24h', '7d', '30d', '1y'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      timeframe === tf ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Sparkline Canvas */}
            <div className="pt-2 pb-1">
              {renderSparkline(activeAssetData.sparkline, activeAssetData.positive)}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">24h Volume</span>
                <span className="text-slate-200 font-bold">$24.8 Billion</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">All-Time High</span>
                <span className="text-slate-200 font-bold">$73,750</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Volatility Rating</span>
                <span className="text-amber-300 font-bold">Medium (Beta 1.1)</span>
              </div>
            </div>
          </div>

          {/* Fear & Greed Gauge + Price Alerts */}
          <div className="lg:col-span-4 space-y-4">
            {/* Fear & Greed */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Crypto Fear & Greed</span>
                <span className="text-emerald-400 font-mono font-bold">68 / 100</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full w-[68%]" />
              </div>
              <div className="text-[11px] text-emerald-300 font-mono text-center pt-1">
                Sentiment: Greed (Bullish Expansion)
              </div>
            </div>

            {/* Target Alert Form */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-emerald-400" /> Set Price Alert
              </div>
              <form onSubmit={addPriceAlert} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`e.g. $70,000 for ${selectedAsset}`}
                  value={alertTarget}
                  onChange={(e) => setAlertTarget(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer hover:bg-emerald-400"
                >
                  Arm
                </button>
              </form>

              {alerts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {alerts.map(a => (
                    <div key={a.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span>{a.asset} target: <strong className="text-emerald-300">{a.price}</strong></span>
                      <button onClick={() => removeAlert(a.id)} className="text-slate-500 hover:text-rose-400 cursor-pointer">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time Socket Feed: SYNCHRONIZED</span>
        </div>
        <div className="text-emerald-400">
          Latency: 14ms
        </div>
      </div>
    </div>
  );
}
