import React, { useMemo } from 'react';
import { Transaction, TransactionType, AppTheme } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon } from 'lucide-react';

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
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const getFontSizeClass = (val: string) => {
    const len = val.length;
    if (len > 20) return 'text-lg sm:text-xl lg:text-2xl';
    if (len > 16) return 'text-xl sm:text-2xl lg:text-3xl';
    if (len > 12) return 'text-2xl sm:text-3xl lg:text-[2.25rem]';
    return 'text-3xl sm:text-4xl lg:text-[2.5rem]';
  };

  const balanceString = formatCurrency(totals.balance);

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex justify-between items-end border-b border-white/5 pb-8">
        <div>
            <p className={`text-[10px] uppercase font-bold tracking-[0.4em] mb-2 opacity-60 ${theme.text}`}>Estatus Financiero</p>
            <h2 className="text-4xl font-executive font-bold text-white flex items-center gap-5">
              <CalendarIcon className={theme.text} size={32} /> Patrimonio
            </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`col-span-1 md:col-span-1 p-8 md:p-10 rounded-[2.5rem] border ${theme.secondary} bg-navy/40 relative overflow-hidden group shadow-2xl transition-all hover:scale-[1.01] flex flex-col justify-center min-h-[160px]`}>
          <div className={`absolute top-0 right-0 w-40 h-40 ${theme.primary} opacity-5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-1000`}></div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-3">Balance Consolidado</p>
          <div className="relative">
            <h3 className={`font-executive font-bold text-white drop-shadow-lg leading-none transition-all duration-300 ${getFontSizeClass(balanceString)}`}>
              {balanceString}
            </h3>
          </div>
        </div>

        <div className={`bg-navy/40 p-8 rounded-[2rem] border ${theme.secondary} hover:border-emerald-500/30 transition-all shadow-xl flex flex-col justify-center`}>
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Ingresos</p>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><ArrowUpRight size={20} /></div>
          </div>
          <h4 className="text-2xl sm:text-3xl font-executive font-bold text-emerald-500 truncate">{formatCurrency(totals.income)}</h4>
        </div>

        <div className={`bg-navy/40 p-8 rounded-[2rem] border ${theme.secondary} hover:border-rose-500/30 transition-all shadow-xl flex flex-col justify-center`}>
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Gastos</p>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500"><ArrowDownRight size={20} /></div>
          </div>
          <h4 className="text-2xl sm:text-3xl font-executive font-bold text-rose-500 truncate">{formatCurrency(totals.expense)}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className={`lg:col-span-2 bg-navy/20 p-10 rounded-[2.5rem] border ${theme.secondary} shadow-2xl min-w-0`}>
           <h3 className={`text-sm font-bold uppercase tracking-[0.2em] mb-10 ${theme.text}`}>Distribución de Capital</h3>
           <div className="h-[280px] w-full" style={{ minHeight: '280px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={[{name: 'Ingresos', value: totals.income || 1}, {name: 'Gastos', value: totals.expense || 0}]} 
                      cx="50%" cy="50%" 
                      innerRadius={70} 
                      outerRadius={90} 
                      paddingAngle={10} 
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1200}
                    >
                      <Cell fill={theme.id === 'executive' || theme.id === 'royal_blue' ? '#d4af37' : '#9333ea'} stroke="none" />
                      <Cell fill="#1e293b" stroke="none" />
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}} />
                  </PieChart>
               </ResponsiveContainer>
           </div>
        </div>

        <div className={`lg:col-span-3 bg-navy/20 rounded-[2.5rem] border ${theme.secondary} overflow-hidden shadow-2xl`}>
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className={`text-sm font-bold uppercase tracking-[0.2em] ${theme.text}`}>Últimas Operaciones</h3>
              <span className={`text-[10px] font-bold ${theme.primary} bg-white/5 px-4 py-1.5 rounded-full border border-white/10 text-white uppercase tracking-widest`}>visto reciente</span>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-white/5 text-[11px] opacity-40 uppercase tracking-[0.2em]">
                      <tr>
                          <th className="p-6 font-bold">Fecha</th>
                          <th className="p-6 font-bold">Concepto</th>
                          <th className="p-6 text-right font-bold">Importe</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                      {transactions.slice(0, 7).map((t) => (
                          <tr key={t.id} className="hover:bg-white/5 transition-all">
                              <td className="p-6 text-gray-500 font-mono text-xs">{t.date}</td>
                              <td className="p-6">
                                <p className="font-semibold text-gray-200">{t.description}</p>
                                <span className="text-[10px] opacity-40 uppercase tracking-widest">{t.category}</span>
                              </td>
                              <td className={`p-6 text-right font-executive font-bold text-xl ${t.type === TransactionType.INCOME ? theme.text : 'text-rose-500'}`}>
                                  {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                              </td>
                          </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-10 text-center text-gray-500 italic">No hay registros aún</td>
                        </tr>
                      )}
                  </tbody>
              </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;