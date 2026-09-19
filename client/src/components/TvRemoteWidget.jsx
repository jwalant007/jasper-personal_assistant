import React from 'react';
import UniversalTvRemoteWidget from './UniversalTvRemoteWidget';

/**
 * TvRemoteWidget - Backward compatibility wrapper for UniversalTvRemoteWidget
 * Provides full Universal Smart TV (Samsung, LG, Sony, Android TV, Fire TV, Roku)
 * and JioFiber Set-Top Box (ADB / IP control) integration.
 */
export default function TvRemoteWidget(props) {
  return <UniversalTvRemoteWidget {...props} />;
}
