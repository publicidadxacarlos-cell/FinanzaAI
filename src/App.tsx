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

  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);

  return (
    <div className="flex h-screen w-full bg-midnight overflow-hidden relative">
      <div className={`absolute inset-0 bg-gradient-to-tr ${currentTheme.gradient} opacity-70 pointer-events-none transition-all duration-1000`}></div>

      <Sidebar currentView={currentView} setView={setView} isOpen={isSidebarOpen} toggle={() => setSidebarOpen(!isSidebarOpen)} currentTheme={currentTheme} setTheme={setCurrentTheme} themes={THEMES} />

      <div className="flex-1 flex flex-col h-screen relative overflow-hidden md:ml-64">
        
        <div className="sticky top-0 z-40">
          <MobileHeader
            currentView={currentView}
            currentTheme={currentTheme}
            onMenuClick={() => setSidebarOpen(true)}
            onSettingsClick={() => setView(View.SETTINGS)}
          />
        </div>

        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 md:pb-12 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            {currentView === View.DASHBOARD && <Dashboard transactions={transactions} onExport={() => {}} onSync={() => {}} isSyncing={isSyncing} theme={currentTheme} />}
            {currentView === View.ASSISTANT && <Assistant theme={currentTheme} />}
            {currentView === View.TRANSACTIONS && <Transactions transactions={transactions} addTransaction={(t) => setTransactions([t, ...transactions])} updateTransaction={(t) => setTransactions(transactions.map(i => i.id === t.id ? t : i))} deleteTransaction={(id) => setTransactions(transactions.filter(i => i.id !== id))} theme={currentTheme} />}
            {currentView === View.SCANNER && <Scanner onScanComplete={(t) => setTransactions([t, ...transactions])} theme={currentTheme} />}
            {currentView === View.VISION_BOARD && <VisionBoard theme={currentTheme} />}
            {currentView === View.SETTINGS && <Settings theme={currentTheme} onSync={() => {}} isSyncing={isSyncing} onClearData={() => setTransactions([])} themes={THEMES} setTheme={setCurrentTheme} />}
          </div>
        </main>

        {/* NAV ULTRA-FINA CON ICONOS GRANDES */}
        <nav className="md:hidden fixed bottom-6 inset-x-10 bg-navy/90 backdrop-blur-3xl border border-white/10 px-6 py-1 flex justify-between items-center z-50 rounded-full shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
           <button onClick={() => setView(View.DASHBOARD)} className={`p-2 transition-all ${currentView === View.DASHBOARD ? currentTheme.text : 'text-gray-500'}`}>
              <LayoutDashboard size={24} />
           </button>
           <button onClick={() => setView(View.TRANSACTIONS)} className={`p-2 transition-all ${currentView === View.TRANSACTIONS ? currentTheme.text : 'text-gray-500'}`}>
              <Receipt size={24} />
           </button>
           
           <div className="relative -translate-y-4">
               <button onClick={() => setView(View.SCANNER)} className={`bg-gradient-to-tr ${currentTheme.gradient} p-4 rounded-full border-2 border-midnight shadow-xl ${currentTheme.text} active:scale-90 transition-transform`}>
                  <ScanLine size={28} />
               </button>
           </div>

           <button onClick={() => setView(View.ASSISTANT)} className={`p-2 transition-all ${currentView === View.ASSISTANT ? currentTheme.text : 'text-gray-500'}`}>
              <Bot size={24} />
           </button>
           <button onClick={() => setView(View.VISION_BOARD)} className={`p-2 transition-all ${currentView === View.VISION_BOARD ? currentTheme.text : 'text-gray-500'}`}>
              <ImageIcon size={24} />
           </button>
        </nav>
      </div>
    </div>
  );
};

export default App;