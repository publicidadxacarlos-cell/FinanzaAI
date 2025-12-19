// src/MobileHeader.tsx - VERSIÓN A PRUEBA DE FALLOS
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
    console.log(`🔄 MobileHeader RENDERIZADO. Vista: ${currentView}, Render #: ${renderCount.current}`);
  }, [currentView]);

return (
  <header 
    data-mobile-header={`view-${currentView}-render-${renderCount.current}`}
    className="md:hidden flex items-center justify-between p-6 bg-navy/60 backdrop-blur-xl border-b border-white/5"
    // ESTILOS para evitar que se "suba"
    style={{
      transform: 'translateY(0) !important',
      marginTop: '0 !important',
      top: '0 !important',
      position: 'sticky'
    }}
  >
    <div className="flex items-center gap-4" onClick={onMenuClick}>
      <Menu className={currentTheme.text} size={24} />
      <div className="flex flex-col">
        <h1 className="text-xl font-executive font-bold gold-text-gradient cursor-pointer">
          FinanzaAI [R{renderCount.current}]
        </h1>
        <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${currentTheme.text}`}>
          {currentTheme.name} | Vista: {currentView}
        </span>
      </div>
    </div>
    
    <button 
      onClick={onSettingsClick}
      className={`${currentTheme.text} p-2 rounded-full hover:bg-white/5 transition-all`}
    >
      <SettingsIcon size={24} />
    </button>
  </header>
);
};

export default MobileHeader;