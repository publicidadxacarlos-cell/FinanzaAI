// src/MobileHeader.tsx
import React from 'react';
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
  // Este componente se vuelve a crear desde cero cada vez que cambia currentView
  // gracias a la key en App.tsx
  return (
    <header 
      className="md:hidden flex items-center justify-between p-6 bg-navy/60 backdrop-blur-xl border-b border-white/5"
    >
      <div className="flex items-center gap-4" onClick={onMenuClick}>
        <Menu className={currentTheme.text} size={24} />
        <div className="flex flex-col">
          <h1 className="text-xl font-executive font-bold gold-text-gradient cursor-pointer">
            FinanzaAI
          </h1>
          <span className={`text-[8px] font-bold uppercase tracking-[0.3em] ${currentTheme.text}`}>
            {currentTheme.name}
          </span>
        </div>
      </div>
      
      {/* Botón SIEMPRE visible para forzar el re-render */}
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