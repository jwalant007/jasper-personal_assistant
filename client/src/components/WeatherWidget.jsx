import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Thermometer, AlertTriangle, Compass, MapPin } from 'lucide-react';
import { subscribeLocation } from '../utils/locationService';

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [status, setStatus] = useState('Locating...');
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeLocation((loc) => {
      if (loc) {
        setLocationInfo(loc);
        fetchWeather(loc.lat, loc.lon, loc.city);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchWeather = async (lat, lon, cityName) => {
    try {
      setStatus('Syncing...');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWeather(data.current_weather);
        setStatus(cityName || 'Active');
        
        const code = data.current_weather.weathercode;
        const speed = data.current_weather.windspeed;
        const temp = data.current_weather.temperature;
        
        if (speed > 25 || code >= 80 || temp > 38 || temp < 0) {
          setIsWarning(true);
        } else {
          setIsWarning(false);
        }
      } else {
        setStatus('Unavailable');
      }
    } catch (e) {
      console.error(e);
      setStatus('Offline');
    }
  };

  const getWeatherIcon = (code) => {
    if (code === 0) return <Sun className="text-amber-400" size={18} />;
    if (code >= 1 && code <= 3) return <Cloud className="text-slate-300" size={18} />;
    if (code >= 51 && code <= 67) return <CloudRain className="text-indigo-400" size={18} />;
    if (code >= 71 && code <= 77) return <CloudSnow className="text-blue-200" size={18} />;
    if (code >= 80 && code <= 82) return <CloudRain className="text-indigo-400" size={18} />;
    if (code >= 95) return <CloudLightning className="text-amber-400" size={18} />;
    return <Cloud className="text-slate-400" size={18} />;
  };

  const getWeatherName = (code) => {
    if (code === 0) return 'Clear Sky';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 51 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Heavy Rain';
    if (code >= 95) return 'Thunderstorm';
    return 'Cloudy';
  };

  return (
    <div className={`p-3 rounded-xl bg-[#0e111a]/60 border border-white/[0.07] shadow-sm select-none transition-all ${isWarning ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/[0.06] pb-2 mb-2.5">
        <span className="font-semibold text-xs text-slate-200 tracking-tight flex items-center gap-1.5">
          <Compass size={13} className="text-slate-400" />
          Local Weather
        </span>
        <span className={`text-[11px] font-medium flex items-center gap-1 ${isWarning ? 'text-amber-400' : 'text-slate-400'}`}>
          <MapPin size={11} className="text-slate-500" />
          {locationInfo?.city || status}
        </span>
      </div>

      {weather ? (
        <div className="flex flex-col gap-2 text-xs">
          {/* Main Temp Row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {getWeatherIcon(weather.weathercode)}
              <span className="text-xs text-slate-200 font-medium">{getWeatherName(weather.weathercode)}</span>
            </div>
            <div className="flex items-center gap-0.5 text-slate-100 font-semibold text-base">
              <Thermometer size={14} className="text-slate-400" />
              {weather.temperature}°C
            </div>
          </div>

          {/* Wind Speed and Alerts */}
          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-white/[0.04]">
            <span className="flex items-center gap-1">
              <Wind size={12} className="text-slate-500" />
              Wind: <strong className="text-slate-300 font-normal">{weather.windspeed} km/h</strong>
            </span>
            {isWarning ? (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <AlertTriangle size={11} /> Hazard Watch
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">
                {locationInfo?.region ? `${locationInfo.region}` : (locationInfo?.source || 'GPS')}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="py-2 text-xs text-slate-500 text-center">
          Loading weather...
        </div>
      )}
    </div>
  );
}
