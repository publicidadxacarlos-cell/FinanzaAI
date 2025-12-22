// src/MobileHeader.tsx
import React, { useEffect, useRef } from 'react';
import { View, AppTheme } from './types';
import { Menu, Settings as SettingsIcon } from 'lucide-react';

interface MobileHeaderProps {
  currentView: View;
  currentTheme: AppTheme;
  onMenuClick: () => void;
  onSettingsClick: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentView,
  currentTheme,
  onMenuClick,
  onSettingsClick
}) => {
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    console.log(`🔄 MobileHeader. Vista: ${currentView}, Render #: ${renderCount.current}`);
  }, [currentView]);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem',
        backgroundColor: 'rgba(2, 6, 23, 0.6)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        height: '80px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={onMenuClick}>
          <Menu size={24} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ margin: 0 }}>FinanzaAI</h1>
            <span style={{ fontSize: '10px' }}>
              {currentTheme.name} | Vista: {currentView}
            </span>
          </div>
        </div>

        <button onClick={onSettingsClick}>
          <SettingsIcon size={24} />
        </button>
      </div>

      <div style={{ height: '80px' }} />
    </>
  );
};

export default MobileHeader;
