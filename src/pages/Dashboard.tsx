import React, { useMemo } from 'react';
import { Transaction, TransactionType, AppTheme } from '../types';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  onExport: () => void;
  onSync: () => void;
  isSyncing: boolean;
  theme: AppTheme;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, theme }) => {
  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((a, b) => a + b.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((a, b) => a + b.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div className="space-y-6 pb-20">
      {/* TARJETA PRINCIPAL: BALANCE TOTAL (EFECTO ORO DUBÁI) */}
      <div className="relative overflow-hidden rounded-[2rem] border border-gold-500/30 bg-gradient-to-b from-navy/80 to-midnight p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Wallet size={120} className="text-gold-500" />
        </div>
        
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-500/60 mb-2">Balance Total</p>
        <h2 className="text-4xl sm:text-5xl font-serif font-bold gold-text-gradient tracking-tight">
          {formatCurrency(totals.balance)}
        </h2>
        
        <div className="mt-6 flex gap-4">
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/20">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Activo</span>
          </div>
        </div>
      </div>

      {/* GRID DE INGRESOS Y GASTOS (CRYSTAL GLOW) */}
      <div className="grid grid-cols-2 gap-4">
        {/* INGRESOS */}
        <div className="group relative rounded-[1.5rem] border border-white/5 bg-white/[0.03] p-5 backdrop-blur-xl transition-all hover:border-gold-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <ArrowUpRight size={20} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Ingresos</p>
          <p className="mt-1 text-xl font-serif font-bold text-white tracking-tight leading-none">
            {formatCurrency(totals.income)}
          </p>
        </div>

        {/* GASTOS */}
        <div className="group relative rounded-[1.5rem] border border-white/5 bg-white/[0.03] p-5 backdrop-blur-xl transition-all hover:border-rose-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            <ArrowDownRight size={20} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Gastos</p>
          <p className="mt-1 text-xl font-serif font-bold text-white tracking-tight leading-none">
            {formatCurrency(totals.expense)}
          </p>
        </div>
      </div>

      {/* LISTADO DE ÚLTIMOS MOVIMIENTOS (EXECUTIVE STYLE) */}
      <div className="rounded-[2rem] border border-white/5 bg-navy/40 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="border-b border-white/5 p-6 flex justify-between items-center">
          <h3 className="font-serif text-lg font-bold gold-text-gradient">Movimientos Recientes</h3>
          <button className="text-[10px] font-bold uppercase tracking-widest text-gold-500 hover:opacity-70 transition-opacity">Ver todo</button>
        </div>
        
        <div className="divide-y divide-white/5">
          {transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border border-white/5 ${t.type === TransactionType.INCOME ? 'bg-emerald-500/5 text-emerald-500' : 'bg-rose-500/5 text-rose-500'}`}>
                  {t.type === TransactionType.INCOME ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div>
                  <p className="font-bold text-gray-200 text-sm">{t.description}</p>
                  <p className="text-[10px] uppercase tracking-tighter text-gray-500 font-medium">{t.category} • {t.date}</p>
                </div>
              </div>
              <p className={`font-serif font-bold text-lg ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-rose-400'}`}>
                {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
              </p>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-10 text-center text-gray-500 italic text-sm">No hay registros aún</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;