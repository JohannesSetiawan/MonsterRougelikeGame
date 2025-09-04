import React from 'react';
import { useResponsive } from '../hooks/useResponsive';
import './OrientationHint.css';

const OrientationHint: React.FC = () => {
  const screenInfo = useResponsive();

  // Only show hint on mobile portrait mode
  if (!screenInfo.isMobile || screenInfo.isLandscape) {
    return null;
  }

  return (
    <div className="orientation-hint">
      <div className="hint-content">
        <div className="phone-icon">📱</div>
        <p>For better gaming experience, try rotating your device to landscape mode!</p>
        <div className="rotate-icon">🔄</div>
      </div>
    </div>
  );
};

export default OrientationHint;
