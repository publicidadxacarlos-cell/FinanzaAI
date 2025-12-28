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
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-6 bg-midnight/60 backdrop-blur-xl border-b border-white/10 h-20 box-border">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={onMenuClick}>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-active:scale-95 transition-transform">
            <Menu size={20} className="text-gold-400" />
          </div>
          <div className="flex flex-col">
            <h1 className="gold-text-gradient font-executive text-xl font-bold tracking-tight leading-none">
              FinanzaAI
            </h1>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gold-300/60 mt-1">
              {currentView.replace('_', ' ')} • {currentTheme.name}
            </span>
          </div>
        </div>

        <button 
          onClick={onSettingsClick}
          className="p-2.5 rounded-full bg-gradient-to-tr from-white/5 to-transparent border border-white/10 text-gray-400 active:rotate-90 transition-all duration-500"
        >
          <SettingsIcon size={20} />
        </button>
      </header>

      {/* Espaciador para que el contenido no se meta debajo del header */}
      <div className="h-20 w-full flex-shrink-0" />
    </>
  );
};

export default MobileHeader;