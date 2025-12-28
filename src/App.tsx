import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MobileHeader from './MobileHeader';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Scanner from './pages/Scanner';
import Assistant from './pages/Assistant';
import VisionBoard from './pages/VisionBoard';
import Settings from './pages/Settings';
import { View, Transaction, TransactionType, AppTheme } from './types';
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
  Bot,
  Image as ImageIcon,
} from 'lucide-react';

const THEMES: AppTheme[] = [
  { id: 'executive', name: 'Executive Gold', primary: 'bg-gold-500', hover: 'hover:bg-gold-600', text: 'text-gold-500', gradient: 'from-[#020617] via-[#0f172a] to-[#020617]', secondary: 'border-gold-500/30' },
  { id: 'royal_blue', name: 'Swedish Gold & Blue', primary: 'bg-gold-500', hover: 'hover:bg-gold-600', text: 'text-gold-500', gradient: 'from-[#003060] via-[#00529B] to-[#003060]', secondary: 'border-gold-500/40' },
  { id: 'amethyst', name: 'Amethyst Luxe', primary: 'bg-purple-600', hover: 'hover:bg-purple-500', text: 'text-purple-400', gradient: 'from-[#020617] via-[#1a0b2e] to-[#020617]', secondary: 'border-purple-500/40' }
];

const App: React.FC = () => {
  const [currentView, setView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(THEMES[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) mainElement.scrollTo(0, 0);
  }, [currentView]);

  // 🚀 FUNCIÓN PARA SINCRONIZAR UNA SOLA TRANSACCIÓN (AUTO-SYNC)
  const syncSingleTransaction = async (t: Transaction) => {
    const sheetUrl = localStorage.getItem('googleSheetUrl');
    if (!sheetUrl) return;
    try {
      await fetch(sheetUrl, { 
        method: 'POST', 
        mode: 'no-cors', 
        body: JSON.stringify({ ...t, action: 'create' }) 
      });
    } catch (error) {
      console.error("Error en auto-sync:", error);
    }
  };

  const handleSyncAll = async () => {
    const sheetUrl = localStorage.getItem('googleSheetUrl');
    if (!sheetUrl) { setView(View.SETTINGS); return; }
    setIsSyncing(true);
    for (const t of [...transactions].reverse()) {
      try {
        await fetch(sheetUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ ...t, action: 'create' }) });
        await new Promise(r => setTimeout(r, 600));
      } catch {}
    }
    setIsSyncing(false);
  };

  const handleAddOrUpdate = (t: Transaction) => {
    setTransactions(prev => {
      const exists = prev.find(item => item.id === t.id);
      if (exists) {
        return prev.map(item => item.id === t.id ? t : item);
      }
      return [t, ...prev];
    });
    
    // Si es nueva (no estamos editando), sincronizar automáticamente
    syncSingleTransaction(t);
  };

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className={`flex h-screen overflow-hidden bg-[#010409] relative`}>
      {/* REFLEJOS DE FONDO TIPO BANCO PRIVADO */}
      <div className={`absolute inset-0 bg-gradient-to-tr ${currentTheme.gradient} opacity-80 pointer-events-none`} />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/5 blur-[120px] rounded-full pointer-events-none" />

      <Sidebar
        currentView={currentView}
        setView={setView}
        isOpen={isSidebarOpen}
        toggle={() => setSidebarOpen(!isSidebarOpen)}
        currentTheme={currentTheme}
        setTheme={setCurrentTheme}
        themes={THEMES}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden md:ml-64 relative z-10">
        <MobileHeader
          key={`mobile-header-${currentView}`}
          currentView={currentView}
          currentTheme={currentTheme}
          onMenuClick={() => setSidebarOpen(true)}
          onSettingsClick={() => setView(View.SETTINGS)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-12 pb-28 md:pb-12 text-white">
          <div className="max-w-6xl mx-auto">
            {currentView === View.DASHBOARD && (
              <Dashboard transactions={transactions} onExport={() => {}} onSync={handleSyncAll} isSyncing={isSyncing} theme={currentTheme} />
            )}
            {currentView === View.TRANSACTIONS && (
              <Transactions 
                transactions={transactions} 
                addTransaction={handleAddOrUpdate} 
                updateTransaction={handleAddOrUpdate}
                deleteTransaction={handleDelete}
                theme={currentTheme} 
                onSync={handleSyncAll} // Pasamos la función de sync
              />
            )}
            {currentView === View.SCANNER && (
              <Scanner onScanComplete={handleAddOrUpdate} theme={currentTheme} />
            )}
            {currentView === View.ASSISTANT && <Assistant theme={currentTheme} />}
            {currentView === View.VISION_BOARD && <VisionBoard theme={currentTheme} />}
            {currentView === View.SETTINGS && (
              <Settings theme={currentTheme} onSync={handleSyncAll} isSyncing={isSyncing} onClearData={() => setTransactions([])} themes={THEMES} setTheme={setCurrentTheme} />
            )}
          </div>
        </main>

        {/* BOTTOM NAV CON CRISTAL ESMERILADO */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-midnight/60 backdrop-blur-2xl border border-white/10 px-6 py-3 flex justify-between items-center z-50 rounded-[2rem] shadow-2xl">
          <button onClick={() => setView(View.DASHBOARD)} className={`flex flex-col items-center transition-all ${currentView === View.DASHBOARD ? currentTheme.text + ' scale-110' : 'text-gray-500 opacity-50'}`}>
            <LayoutDashboard size={20} strokeWidth={currentView === View.DASHBOARD ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Panel</span>
          </button>
          
          <button onClick={() => setView(View.TRANSACTIONS)} className={`flex flex-col items-center transition-all ${currentView === View.TRANSACTIONS ? currentTheme.text + ' scale-110' : 'text-gray-500 opacity-50'}`}>
            <Receipt size={20} strokeWidth={currentView === View.TRANSACTIONS ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Libro</span>
          </button>
          
          <div className="relative -translate-y-6">
            <button onClick={() => setView(View.SCANNER)} className="bg-gradient-to-tr from-gold-400 to-gold-600 p-4 rounded-full border-4 border-[#010409] text-midnight shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <ScanLine size={24} strokeWidth={2.5} />
            </button>
          </div>
          
          <button onClick={() => setView(View.ASSISTANT)} className={`flex flex-col items-center transition-all ${currentView === View.ASSISTANT ? currentTheme.text + ' scale-110' : 'text-gray-500 opacity-50'}`}>
            <Bot size={20} strokeWidth={currentView === View.ASSISTANT ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">IA</span>
          </button>
          
          <button onClick={() => setView(View.VISION_BOARD)} className={`flex flex-col items-center transition-all ${currentView === View.VISION_BOARD ? currentTheme.text + ' scale-110' : 'text-gray-500 opacity-50'}`}>
            <ImageIcon size={20} strokeWidth={currentView === View.VISION_BOARD ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Metas</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default App;