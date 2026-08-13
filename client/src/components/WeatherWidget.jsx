import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Thermometer, AlertTriangle, Compass, MapPin } from 'lucide-react';
import { subscribeLocation } from '../utils/locationService';

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [status, setStatus] = useState('Acquiring Telemetry...');
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
      setStatus('Syncing forecast...');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWeather(data.current_weather);
        setStatus(cityName || 'Nominal');
        
        // Evaluate atmospheric warning conditions (e.g. windspeed > 25km/h, storm code >= 80, or extreme temp)
        const code = data.current_weather.weathercode;
        const speed = data.current_weather.windspeed;
        const temp = data.current_weather.temperature;
        
        if (speed > 25 || code >= 80 || temp > 38 || temp < 0) {
          setIsWarning(true);
        } else {
          setIsWarning(false);
        }
      } else {
        setStatus('Fetch failed');
      }
    } catch (e) {
      console.error(e);
      setStatus('Service offline');
    }
  };

  const getWeatherIcon = (code) => {
    if (code === 0) return <Sun className="text-yellow-400 animate-spin" style={{ animationDuration: '20s' }} size={20} />;
    if (code >= 1 && code <= 3) return <Cloud className="text-sky-300" size={20} />;
    if (code >= 51 && code <= 67) return <CloudRain className="text-cyan-400 animate-bounce" size={20} />;
    if (code >= 71 && code <= 77) return <CloudSnow className="text-blue-100" size={20} />;
    if (code >= 80 && code <= 82) return <CloudRain className="text-cyan-500 animate-pulse" size={20} />;
    if (code >= 95) return <CloudLightning className="text-orange-400 animate-pulse" size={20} />;
    return <Cloud className="text-sky-400" size={20} />;
  };

  const getWeatherName = (code) => {
    if (code === 0) return 'Clear Sky';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 51 && code <= 67) return 'Drizzle/Rain';
    if (code >= 71 && code <= 77) return 'Snow Showers';
    if (code >= 80 && code <= 82) return 'Heavy Showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Cloudy';
  };

  return (
    <div className={`sidebar-widget-card select-none ${isWarning ? 'weather-warning-active' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center border-b border-cyan-500/10 pb-1.5 mb-2.5">
        <span className="font-orbitron font-extrabold text-[9px] text-cyan-400 tracking-wider flex items-center gap-1">
          <Compass size={11} className="text-cyan-400" />
          ATMOSPHERIC HUD
        </span>
        <span className={`font-mono text-[8px] uppercase font-bold tracking-widest flex items-center gap-1 ${isWarning ? 'text-orange-500 animate-pulse' : 'text-sky-400'}`}>
          <MapPin size={9} className="text-cyan-400" />
          {locationInfo?.city || status}
        </span>
      </div>

      {weather ? (
        <div className="flex flex-col gap-2 font-mono text-[10px]">
          {/* Main Temp Row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              {getWeatherIcon(weather.weathercode)}
              <span className="text-[9px] text-cyan-100 uppercase tracking-wider">{getWeatherName(weather.weathercode)}</span>
            </div>
            <div className="flex items-center gap-0.5 text-cyan-300 font-extrabold text-sm glow-cyan">
              <Thermometer size={12} className="text-cyan-400" />
              {weather.temperature}°C
            </div>
          </div>

          {/* Wind Speed and Alerts */}
          <div className="flex justify-between items-center text-[9px] text-sky-500">
            <span className="flex items-center gap-1">
              <Wind size={10} className="text-sky-600" />
              WIND: <strong className="text-cyan-400">{weather.windspeed} km/h</strong>
            </span>
            {isWarning ? (
              <span className="flex items-center gap-0.5 text-orange-400 font-bold uppercase animate-pulse">
                <AlertTriangle size={10} /> STORM WARNING
              </span>
            ) : (
              <span className="text-[8px] text-slate-400">
                {locationInfo?.region ? `${locationInfo.region}, ${locationInfo.country}` : (locationInfo?.source || 'GPS')}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="py-2 text-[9px] text-sky-600/70 font-mono text-center uppercase tracking-widest animate-pulse">
          Calibrating weather telemetry...
        </div>
      )}
    </div>
  );
}
