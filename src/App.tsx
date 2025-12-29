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
import { LayoutDashboard, Receipt, ScanLine, Bot, Image as ImageIcon } from 'lucide-react';

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

  const syncSingleTransaction = async (t: Transaction, action: 'create' | 'delete' | 'update' = 'create') => {
    const sheetUrl = localStorage.getItem('googleSheetUrl');
    if (!sheetUrl) return;
    try {
      await fetch(sheetUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ ...t, action }) });
    } catch (e) { console.error("Sync error:", e); }
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
    const exists = transactions.find(item => item.id === t.id);
    setTransactions(prev => {
      if (exists) return prev.map(item => item.id === t.id ? t : item);
      return [t, ...prev];
    });
    syncSingleTransaction(t, exists ? 'update' : 'create');
  };

  const handleDelete = (id: string) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (transactionToDelete) syncSingleTransaction(transactionToDelete, 'delete');
  };

  return (
    // CAMBIO: Añadido min-h-screen y asegurado que el fondo sea midnight total
    <div className="flex min-h-screen h-screen overflow-hidden bg-midnight relative">
      <div className={`absolute inset-0 bg-gradient-to-tr ${currentTheme.gradient} opacity-70 pointer-events-none`} />
      
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        isOpen={isSidebarOpen} 
        toggle={() => setSidebarOpen(!isSidebarOpen)} 
        currentTheme={currentTheme} 
        setTheme={setCurrentTheme} 
        themes={THEMES} 
      />
      
      {/* CAMBIO: Asegurado flex-1 y h-full para el contenedor de contenido */}
      <div className="flex-1 flex flex-col h-full overflow-hidden md:ml-64 relative z-10">
        <MobileHeader 
          currentView={currentView} 
          currentTheme={currentTheme} 
          onMenuClick={() => setSidebarOpen(true)} 
          onSettingsClick={() => setView(View.SETTINGS)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-12 pb-28 text-white">
          <div className="max-w-6xl mx-auto">
            {currentView === View.DASHBOARD && <Dashboard transactions={transactions} onExport={() => {}} onSync={handleSyncAll} isSyncing={isSyncing} theme={currentTheme} />}
            {currentView === View.TRANSACTIONS && <Transactions transactions={transactions} addTransaction={handleAddOrUpdate} updateTransaction={handleAddOrUpdate} deleteTransaction={handleDelete} theme={currentTheme} onSync={handleSyncAll} />}
            {currentView === View.SCANNER && <Scanner onScanComplete={handleAddOrUpdate} theme={currentTheme} />}
            {currentView === View.ASSISTANT && <Assistant theme={currentTheme} />}
            {currentView === View.VISION_BOARD && <VisionBoard theme={currentTheme} />}
            {currentView === View.SETTINGS && <Settings theme={currentTheme} onSync={handleSyncAll} isSyncing={isSyncing} onClearData={() => setTransactions([])} themes={THEMES} setTheme={setCurrentTheme} />}
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-3 right-3 bg-navy/95 backdrop-blur-xl border border-white/10 px-4 py-1.5 flex justify-between items-center z-50 rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <button onClick={() => setView(View.DASHBOARD)} className={`flex flex-col items-center transition-all ${currentView === View.DASHBOARD ? 'text-gold-500 scale-110' : 'text-gray-500'}`}>
            <LayoutDashboard size={22} /><span className="text-[9px] font-bold uppercase mt-1">Panel</span>
          </button>
          <button onClick={() => setView(View.TRANSACTIONS)} className={`flex flex-col items-center transition-all ${currentView === View.TRANSACTIONS ? 'text-gold-500 scale-110' : 'text-gray-500'}`}>
            <Receipt size={22} /><span className="text-[9px] font-bold uppercase mt-1">Libro</span>
          </button>
          <div className="relative -translate-y-4">
            <button onClick={() => setView(View.SCANNER)} className="bg-gold-600 p-3.5 rounded-full border-2 border-white/20 text-white shadow-[0_0_20px_rgba(212,175,55,0.4)]"><ScanLine size={24} /></button>
          </div>
          <button onClick={() => setView(View.ASSISTANT)} className={`flex flex-col items-center transition-all ${currentView === View.ASSISTANT ? 'text-gold-500 scale-110' : 'text-gray-500'}`}>
            <Bot size={22} /><span className="text-[9px] font-bold uppercase mt-1">Asesor</span>
          </button>
          <button onClick={() => setView(View.VISION_BOARD)} className={`flex flex-col items-center transition-all ${currentView === View.VISION_BOARD ? 'text-gold-500 scale-110' : 'text-gray-500'}`}>
            <ImageIcon size={22} /><span className="text-[9px] font-bold uppercase mt-1">Metas</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default App;