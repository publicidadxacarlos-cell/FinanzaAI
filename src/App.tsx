import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
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
  Settings as SettingsIcon,
  Menu,
} from 'lucide-react';

const THEMES: AppTheme[] = [
  { 
    id: 'executive', 
    name: 'Executive Gold', 
    primary: 'bg-gold-500', 
    hover: 'hover:bg-gold-600',
    text: 'text-gold-500', 
    gradient: 'from-[#020617] via-[#0f172a] to-[#020617]',
    secondary: 'border-gold-500/30'
  },
  { 
    id: 'royal_blue', 
    name: 'Swedish Gold & Blue', 
    primary: 'bg-gold-500', 
    hover: 'hover:bg-gold-600',
    text: 'text-gold-500', 
    gradient: 'from-[#003060] via-[#00529B] to-[#003060]',
    secondary: 'border-gold-500/40'
  },
  { 
    id: 'amethyst', 
    name: 'Amethyst Luxe', 
    primary: 'bg-purple-600', 
    hover: 'hover:bg-purple-500',
    text: 'text-purple-400', 
    gradient: 'from-[#020617] via-[#1a0b2e] to-[#020617]',
    secondary: 'border-purple-500/40'
  }
];

const INITIAL_DATA: Transaction[] = [
    { id: '1', date: '2023-10-25', description: 'Inversión Portfolio', amount: 5000, category: 'Inversión', type: TransactionType.INCOME },
    { id: '2', date: '2023-10-26', description: 'Cena de Negocios', amount: 150.00, category: 'Comida', type: TransactionType.EXPENSE },
];

const App: React.FC = () => {
  const [currentView, setView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(THEMES[0]);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
      const saved = localStorage.getItem('transactions');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  useEffect(() => {
      localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const showNotification = (msg: string) => {
      setSyncNotification(msg);
      setTimeout(() => setSyncNotification(null), 3000);
  }

  const sendToSheet = async (t: Transaction, action: 'create' | 'update' | 'delete') => {
    const sheetUrl = localStorage.getItem('googleSheetUrl');
    if (!sheetUrl) return;
    try {
        await fetch(sheetUrl, {
            method: 'POST',
            mode: 'no-cors', 
            body: JSON.stringify({ ...t, action })
        });
        showNotification(action === 'delete' ? "🗑️ Eliminado" : action === 'update' ? "✏️ Actualizado" : "☁️ Sincronizado");
    } catch (e) {
        showNotification("❌ Error");
    }
  };

  const handleSyncAll = async () => {
    const sheetUrl = localStorage.getItem('googleSheetUrl');
    if (!sheetUrl) { setView(View.SETTINGS); return; }
    setIsSyncing(true);
    let count = 0;
    for (const t of [...transactions].reverse()) {
        try {
            await fetch(sheetUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ ...t, action: 'create' }) });
            count++;
            await new Promise(r => setTimeout(r, 600));
        } catch (e) {}
    }
    setIsSyncing(false);
    showNotification(`✅ ${count} sincronizados`);
  };

  return (
    <div className={`flex h-screen bg-midnight overflow-hidden transition-all duration-700 relative ${currentTheme.id === 'executive' ? 'theme-executive' : ''}`}>
      <div className={`absolute inset-0 bg-gradient-to-tr ${currentTheme.gradient} opacity-70 pointer-events-none transition-all duration-1000`}></div>

      <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[70] transition-all duration-500 ${syncNotification ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'}`}>
          <div className={`bg-navy border ${currentTheme.secondary} ${currentTheme.text} px-8 py-4 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] flex items-center gap-4 font-bold border-t-4`}>
              <div className={`${currentTheme.primary} p-1.5 rounded-full shadow-lg`}><div className="w-2 h-2 bg-white rounded-full"></div></div>
              {syncNotification}
          </div>
      </div>

      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        isOpen={isSidebarOpen} 
        toggle={() => setSidebarOpen(!isSidebarOpen)}
        currentTheme={currentTheme}
        setTheme={setCurrentTheme}
        themes={THEMES}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden md:ml-64 transition-all duration-300 relative z-10">
        <header className="md:hidden flex items-center justify-between p-6 bg-navy/60 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4" onClick={() => setSidebarOpen(true)}>
              <Menu className={currentTheme.text} size={24} />
              <div className="flex flex-col">
                  <h1 className="text-xl font-executive font-bold gold-text-gradient cursor-pointer">FinanzaAI</h1>
                  <span className={`text-[8px] font-bold uppercase tracking-[0.3em] ${currentTheme.text}`}>{currentTheme.name}</span>
              </div>
          </div>
          
          {/* Botón de ajustes - visible siempre excepto en Assistant */}
          {currentView !== View.ASSISTANT && (
            <button onClick={() => setView(View.SETTINGS)} className={`${currentTheme.text} p-2 rounded-full hover:bg-white/5 transition-all`}>
                <SettingsIcon size={24} />
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-12 pb-32 md:pb-12 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            {currentView === View.DASHBOARD && <Dashboard transactions={transactions} onExport={() => {}} onSync={handleSyncAll} isSyncing={isSyncing} theme={currentTheme} />}
            {currentView === View.TRANSACTIONS && <Transactions transactions={transactions} addTransaction={(t) => {setTransactions([t, ...transactions]); sendToSheet(t, 'create');}} updateTransaction={(t) => {setTransactions(transactions.map(item => item.id === t.id ? t : item)); sendToSheet(t, 'update');}} deleteTransaction={(id) => {const t = transactions.find(x => x.id === id); setTransactions(transactions.filter(x => x.id !== id)); if(t) sendToSheet(t, 'delete');}} theme={currentTheme} />}
            {currentView === View.SCANNER && <Scanner onScanComplete={(t) => {setTransactions([t, ...transactions]); sendToSheet(t, 'create');}} theme={currentTheme} />}
            {currentView === View.ASSISTANT && <Assistant theme={currentTheme} />}
            {currentView === View.VISION_BOARD && <VisionBoard theme={currentTheme} />}
            {currentView === View.SETTINGS && (
              <Settings 
                theme={currentTheme} 
                onSync={handleSyncAll} 
                isSyncing={isSyncing} 
                onClearData={() => setTransactions([])} 
                themes={THEMES} 
                setTheme={setCurrentTheme}
              />
            )}
          </div>
        </main>

        <nav className="md:hidden fixed bottom-6 inset-x-6 bg-navy/80 backdrop-blur-2xl border border-white/10 px-6 py-4 flex justify-between items-center z-50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
           <button onClick={() => setView(View.DASHBOARD)} className={`flex flex-col items-center gap-1 transition-all ${currentView === View.DASHBOARD ? currentTheme.text + ' scale-110' : 'text-gray-500'}`}>
              <LayoutDashboard size={24} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Panel</span>
           </button>
           <button onClick={() => setView(View.TRANSACTIONS)} className={`flex flex-col items-center gap-1 transition-all ${currentView === View.TRANSACTIONS ? currentTheme.text + ' scale-110' : 'text-gray-500'}`}>
              <Receipt size={24} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Libro</span>
           </button>
           
           <div className="relative -translate-y-10">
               <button onClick={() => setView(View.SCANNER)} className={`bg-gradient-to-tr ${currentTheme.gradient} p-5 rounded-full border-4 border-midnight shadow-[0_15px_30px_rgba(0,0,0,0.6)] ${currentTheme.text} transform active:scale-95 transition-all border-white/10`}>
                  <ScanLine size={28} />
               </button>
           </div>

           <button onClick={() => setView(View.ASSISTANT)} className={`flex flex-col items-center gap-1 transition-all ${currentView === View.ASSISTANT ? currentTheme.text + ' scale-110' : 'text-gray-500'}`}>
              <Bot size={24} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Asesor</span>
           </button>
           <button onClick={() => setView(View.VISION_BOARD)} className={`flex flex-col items-center gap-1 transition-all ${currentView === View.VISION_BOARD ? currentTheme.text + ' scale-110' : 'text-gray-500'}`}>
              <ImageIcon size={24} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Metas</span>
           </button>
        </nav>
      </div>
    </div>
  );
};

export default App;