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

const INITIAL_DATA: Transaction[] = [{ id: '1', date: '2023-10-25', description: 'Inversión Portfolio', amount: 5000, category: 'Inversión', type: TransactionType.INCOME }];

const App: React.FC = () => {
  const [currentView, setView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(THEMES[0]);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
      const saved = localStorage.getItem('transactions');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);

  return (
    <div className={`flex h-screen w-full bg-midnight overflow-hidden relative ${currentTheme.id === 'executive' ? 'theme-executive' : ''}`}>
      {/* Sidebar de tu código original */}
      <Sidebar currentView={currentView} setView={setView} isOpen={isSidebarOpen} toggle={() => setSidebarOpen(!isSidebarOpen)} currentTheme={currentTheme} setTheme={setCurrentTheme} themes={THEMES} />

      <div className="flex-1 flex flex-col h-screen relative overflow-hidden md:ml-64 z-10">
        
        {/* Tu MobileHeader blindado (Él ya maneja su propio espacio) */}
        <MobileHeader
          currentView={currentView}
          currentTheme={currentTheme}
          onMenuClick={() => setSidebarOpen(true)}
          onSettingsClick={() => setView(View.SETTINGS)}
        />

        {/* Contenido principal con scroll limpio */}
        <main className="flex-1 overflow-y-auto px-4 pb-32">
          <div className="max-w-6xl mx-auto animate-fade-in">
            {currentView === View.DASHBOARD && <Dashboard transactions={transactions} onExport={() => {}} onSync={() => {}} isSyncing={false} theme={currentTheme} />}
            {currentView === View.ASSISTANT && <Assistant theme={currentTheme} />}
            {currentView === View.TRANSACTIONS && <Transactions transactions={transactions} addTransaction={(t) => setTransactions([t, ...transactions])} theme={currentTheme} />}
            {currentView === View.SCANNER && <Scanner onScanComplete={(t) => setTransactions([t, ...transactions])} theme={currentTheme} />}
            {currentView === View.VISION_BOARD && <VisionBoard theme={currentTheme} />}
            {currentView === View.SETTINGS && <Settings theme={currentTheme} onSync={() => {}} isSyncing={false} onClearData={() => {}} themes={THEMES} setTheme={setCurrentTheme} />}
          </div>
        </main>

        {/* BOTONERA: Cuadro ultra-fino (h-12) + Iconos grandes (size 32) */}
        <nav className="md:hidden fixed bottom-6 inset-x-8 z-[100]">
          <div className="bg-navy/80 backdrop-blur-3xl border border-white/10 h-12 rounded-full flex justify-around items-center px-2 shadow-2xl">
            <button onClick={() => setView(View.DASHBOARD)} className={`p-2 transition-all ${currentView === View.DASHBOARD ? currentTheme.text : 'text-gray-400'}`}>
              <LayoutDashboard size={32} strokeWidth={1.5} />
            </button>
            
            <button onClick={() => setView(View.TRANSACTIONS)} className={`p-2 transition-all ${currentView === View.TRANSACTIONS ? currentTheme.text : 'text-gray-400'}`}>
              <Receipt size={32} strokeWidth={1.5} />
            </button>
            
            {/* Botón Central Scanner más prominente */}
            <div className="relative -translate-y-4">
               <button onClick={() => setView(View.SCANNER)} className={`${currentTheme.primary} p-4 rounded-full border-4 border-midnight shadow-xl text-white active:scale-95 transition-transform`}>
                  <ScanLine size={32} strokeWidth={2.5} />
               </button>
            </div>

            <button onClick={() => setView(View.ASSISTANT)} className={`p-2 transition-all ${currentView === View.ASSISTANT ? currentTheme.text : 'text-gray-400'}`}>
              <Bot size={32} strokeWidth={1.5} />
            </button>
            
            <button onClick={() => setView(View.VISION_BOARD)} className={`p-2 transition-all ${currentView === View.VISION_BOARD ? currentTheme.text : 'text-gray-400'}`}>
              <ImageIcon size={32} strokeWidth={1.5} />
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default App;