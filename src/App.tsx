import React, { useState, useEffect } from 'react';
// IMPORTACIONES CON RUTAS EXACTAS SEGÚN TU ESTRUCTURA
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

const INITIAL_DATA: Transaction[] = [
    { id: '1', date: '2023-10-25', description: 'Inversión Portfolio', amount: 5000, category: 'Inversión', type: TransactionType.INCOME },
    { id: '2', date: '2023-10-26', description: 'Cena de Negocios', amount: 150.00, category: 'Comida', type: TransactionType.EXPENSE },
];

const App: React.FC = () => {
  const [currentView, setView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(THEMES[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
      const saved = localStorage.getItem('transactions');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  useEffect(() => {
      localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <div className={`flex h-screen bg-midnight overflow-hidden transition-all duration-700 relative ${currentTheme.id === 'executive' ? 'theme-executive' : ''}`}>
      <div className={`absolute inset-0 bg-gradient-to-tr ${currentTheme.gradient} opacity-70 pointer-events-none transition-all duration-1000`}></div>

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
        
        <MobileHeader
          currentView={currentView}
          currentTheme={currentTheme}
          onMenuClick={() => setSidebarOpen(true)}
          onSettingsClick={() => setView(View.SETTINGS)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-12 pb-32 md:pb-12 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            {currentView === View.DASHBOARD && (
              <Dashboard transactions={transactions} onExport={() => {}} onSync={handleSyncAll} isSyncing={isSyncing} theme={currentTheme} />
            )}
            {currentView === View.ASSISTANT && (
              <Assistant theme={currentTheme} />
            )}
            {currentView === View.TRANSACTIONS && (
              <Transactions 
                transactions={transactions} 
                addTransaction={(t) => setTransactions([t, ...transactions])} 
                updateTransaction={(t) => setTransactions(transactions.map(i => i.id === t.id ? t : i))} 
                deleteTransaction={(id) => setTransactions(transactions.filter(i => i.id !== id))} 
                theme={currentTheme} 
              />
            )}
            {currentView === View.SCANNER && (
              <Scanner onScanComplete={(t) => setTransactions([t, ...transactions])} theme={currentTheme} />
            )}
            {currentView === View.VISION_BOARD && (
              <VisionBoard theme={currentTheme} />
            )}
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

        {/* BOTONERA MINI */}
        <nav className="md:hidden fixed bottom-5 inset-x-8 bg-navy/85 backdrop-blur-3xl border border-white/10 px-6 py-2.5 flex justify-between items-center z-50 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.7)]">
           <button onClick={() => setView(View.DASHBOARD)} className={`flex flex-col items-center gap-0.5 ${currentView === View.DASHBOARD ? currentTheme.text : 'text-gray-500'}`}>
              <LayoutDashboard size={20} />
              <span className="text-[8px] font-bold uppercase tracking-tighter">Panel</span>
           </button>
           <button onClick={() => setView(View.TRANSACTIONS)} className={`flex flex-col items-center gap-0.5 ${currentView === View.TRANSACTIONS ? currentTheme.text : 'text-gray-500'}`}>
              <Receipt size={20} />
              <span className="text-[8px] font-bold uppercase tracking-tighter">Libro</span>
           </button>
           <div className="relative -translate-y-8">
               <button onClick={() => setView(View.SCANNER)} className={`bg-gradient-to-tr ${currentTheme.gradient} p-4 rounded-full border-[3px] border-midnight ${currentTheme.text} shadow-lg active:scale-90 transition-transform`}>
                  <ScanLine size={24} />
               </button>
           </div>
           <button onClick={() => setView(View.ASSISTANT)} className={`flex flex-col items-center gap-0.5 ${currentView === View.ASSISTANT ? currentTheme.text : 'text-gray-500'}`}>
              <Bot size={20} />
              <span className="text-[8px] font-bold uppercase tracking-tighter">Asesor</span>
           </button>
           <button onClick={() => setView(View.VISION_BOARD)} className={`flex flex-col items-center gap-0.5 ${currentView === View.VISION_BOARD ? currentTheme.text : 'text-gray-500'}`}>
              <ImageIcon size={20} />
              <span className="text-[8px] font-bold uppercase tracking-tighter">Metas</span>
           </button>
        </nav>
      </div>
    </div>
  );
};

export default App;