// src/MobileHeader.tsx - VERSIÓN BLINDADA CONTRA ESTILOS EXTERNOS
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
    console.log(`🔄 MobileHeader BLINDADO. Vista: ${currentView}, Render #: ${renderCount.current}`);
  }, [currentView]);

  return (
    <>
      {/* Contenedor ABSOLUTO que IGNORA cualquier flujo de documento */}
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
          <Menu style={{ color: currentTheme.text.includes('gold') ? '#d4af37' : '#a855f7' }} size={24} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{
              fontSize: '1.25rem',
              fontFamily: 'Cinzel, serif',
              fontWeight: '700',
              background: 'linear-gradient(to bottom, #f3e5ab 0%, #d4af37 50%, #b8860b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.2))',
              margin: 0,
              cursor: 'pointer'
            }}>
              FinanzaAI [B{renderCount.current}]
            </h1>
            <span style={{
              fontSize: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color: currentTheme.text.includes('gold') ? '#d4af37' : '#a855f7',
              marginTop: '2px'
            }}>
              {currentTheme.name} | Vista: {currentView}
            </span>
          </div>
        </div>
        
        <button 
          onClick={onSettingsClick}
          style={{
            color: currentTheme.text.includes('gold') ? '#d4af37' : '#a855f7',
            padding: '0.5rem',
            borderRadius: '9999px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <SettingsIcon size={24} />
        </button>
      </div>
      
      {/* Espaciador para que el contenido principal no quede debajo del header fijo */}
      <div style={{ height: '80px', width: '100%' }}></div>
    </>
  );
};

export default MobileHeader;