
import React from 'react';
import { View, AppTheme } from '../types';
import { 
  LayoutDashboard, 
  Receipt, 
  Bot, 
  Image as ImageIcon, 
  ScanLine,
  Palette,
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isOpen: boolean;
  toggle: () => void;
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  themes: AppTheme[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, setView, isOpen, toggle, currentTheme, setTheme, themes 
}) => {
  const menuItems = [
    { id: View.DASHBOARD, label: 'Resumen Ejecutivo', icon: LayoutDashboard },
    { id: View.TRANSACTIONS, label: 'Libro Contable', icon: Receipt },
    { id: View.SCANNER, label: 'Escanear Documento', icon: ScanLine },
    { id: View.ASSISTANT, label: 'Analista AI', icon: Bot },
    { id: View.VISION_BOARD, label: 'Panel de Metas', icon: ImageIcon },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/70 z-40 md:hidden transition-opacity backdrop-blur-sm ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggle}
      />
      
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-midnight border-r border-gold-500/20 transform transition-transform duration-500 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-8 border-b border-gold-500/10">
          <div className="flex justify-between items-center mb-2">
              <h1 className="text-3xl font-executive font-bold gold-text-gradient tracking-tighter">
                FinanzaAI
              </h1>
              <button onClick={toggle} className="md:hidden text-gold-500"><X size={20} /></button>
          </div>
          <div className="h-[2px] w-12 bg-gold-500/50 mb-2"></div>
          <p className="text-[10px] text-gold-500/60 uppercase font-bold tracking-[0.2em]">Private Banking Suite</p>
        </div>

        <nav className="flex-1 px-5 py-8 space-y-3 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                if (window.innerWidth < 768) toggle();
              }}
              className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                currentView === item.id 
                  ? 'bg-gradient-to-r from-gold-600/20 to-transparent border-l-2 border-gold-500 text-gold-400' 
                  : 'text-gray-500 hover:text-gold-400 hover:bg-gold-500/5'
              }`}
            >
              <item.icon size={22} className={`${currentView === item.id ? 'text-gold-500' : 'group-hover:text-gold-500'} transition-colors`} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          ))}
          
          <div className="pt-6 mt-6 border-t border-gold-500/10">
              <button
                onClick={() => {
                    setView(View.SETTINGS);
                    if (window.innerWidth < 768) toggle();
                }}
                className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all ${
                    currentView === View.SETTINGS 
                    ? 'bg-gold-500/10 text-gold-400' 
                    : 'text-gray-500 hover:text-gold-500'
                }`}
                >
                <Settings size={22} />
                <span className="font-semibold text-sm">Configuración</span>
              </button>
          </div>
        </nav>

        <div className="p-8 border-t border-gold-500/10 bg-midnight/50 backdrop-blur-md">
            <p className="text-[10px] text-gold-500/40 uppercase font-bold mb-4 flex items-center gap-2">
                <Palette size={12} /> Colección de Temas
            </p>
            <div className="flex gap-3 mb-6">
                {themes.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t)}
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradient} border-2 transition-all hover:scale-110 ${currentTheme.id === t.id ? 'border-gold-500 ring-2 ring-gold-500/20' : 'border-white/10 grayscale hover:grayscale-0 opacity-40 hover:opacity-100'}`}
                        title={t.name}
                    />
                ))}
            </div>

            <div className="p-4 rounded-2xl border border-gold-500/20 bg-gold-500/5">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></div>
                    <h3 className="text-xs font-bold text-gold-500 uppercase">Estado: Operativo</h3>
                </div>
                <p className="text-[9px] text-gold-500/40 font-medium">Gemini Pro 3.1 Neural Engine</p>
            </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
