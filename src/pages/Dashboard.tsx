import React, { useMemo } from 'react';
import { Transaction, TransactionType, AppTheme } from '../types';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';

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
    new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* TÍTULO DE SECCIÓN: PATRIMONIO */}
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">Resumen de Cuenta</p>
        <h1 className="gold-text-gradient font-executive text-4xl font-bold">Patrimonio</h1>
      </div>

      {/* TARJETA PRINCIPAL: BALANCE TOTAL */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-gold-500/40 bg-gradient-to-br from-white/10 to-transparent p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-500/80 mb-3">Balance Neto Total</p>
        <h2 className="text-4xl sm:text-5xl font-serif font-bold gold-text-gradient tracking-tighter drop-shadow-sm">
          {formatCurrency(totals.balance)}
        </h2>
        <div className="mt-8 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Cuenta Auditada</span>
        </div>
      </div>

      {/* GRID DE INGRESOS Y GASTOS - ESTILO DUBÁI PREMIUM */}
      <div className="grid grid-cols-2 gap-4">
        {/* Tarjeta Ingresos */}
        <div className="relative rounded-[2rem] border border-emerald-500/20 bg-white/[0.03] p-6 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all active:scale-95">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowUpRight size={20} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Ingresos</p>
          <p className="mt-1 text-2xl font-serif font-bold text-emerald-400 tracking-tight">
            {formatCurrency(totals.income)}
          </p>
        </div>

        {/* Tarjeta Gastos */}
        <div className="relative rounded-[2rem] border border-rose-500/20 bg-white/[0.03] p-6 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all active:scale-95">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ArrowDownRight size={20} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Gastos</p>
          <p className="mt-1 text-2xl font-serif font-bold text-rose-400 tracking-tight">
            {formatCurrency(totals.expense)}
          </p>
        </div>
      </div>

      {/* LISTADO ACTIVIDAD RECIENTE */}
      <div className="rounded-[2.5rem] border border-white/5 bg-black/20 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="border-b border-white/5 p-6 text-center">
          <h3 className="font-serif text-lg font-bold gold-text-gradient">Últimos Movimientos</h3>
        </div>
        <div className="divide-y divide-white/5">
          {transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between p-5 hover:bg-white/[0.03] transition-all">
              <div className="flex items-center gap-4">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center border border-white/10 ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {t.type === TransactionType.INCOME ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
                <div>
                  <p className="font-bold text-gray-100 text-sm">{t.description}</p>
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 mt-0.5">{t.category}</p>
                </div>
              </div>
              <p className={`font-serif font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-rose-400'}`}>
                {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;