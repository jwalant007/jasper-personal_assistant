import React, { createContext, useContext, useState, useEffect } from 'react';

const OsGestureContext = createContext({
  activeGesture: null,
  gestureStatus: 'IDLE',
  cursorPos: null,
  isGesturesEnabled: false,
  toggleGestures: () => {}
});

export function OsGestureProvider({ children }) {
  const [activeGesture, setActiveGesture] = useState(null);
  const [gestureStatus, setGestureStatus] = useState('IDLE');
  const [cursorPos, setCursorPos] = useState(null);
  const [isGesturesEnabled, setIsGesturesEnabled] = useState(false);

  useEffect(() => {
    const handleGestureEvent = (e) => {
      if (e.detail) {
        setActiveGesture(e.detail);
        if (e.detail.cursor) {
          setCursorPos(e.detail.cursor);
        }
      }
    };

    window.addEventListener('jasper:os-gesture', handleGestureEvent);
    return () => window.removeEventListener('jasper:os-gesture', handleGestureEvent);
  }, []);

  const toggleGestures = () => {
    setIsGesturesEnabled(prev => !prev);
  };

  return (
    <OsGestureContext.Provider
      value={{
        activeGesture,
        gestureStatus,
        setGestureStatus,
        cursorPos,
        isGesturesEnabled,
        setIsGesturesEnabled,
        toggleGestures
      }}
    >
      {children}
    </OsGestureContext.Provider>
  );
}

export function useOsGestures() {
  return useContext(OsGestureContext);
}
