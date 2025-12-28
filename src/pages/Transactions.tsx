import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, AppTheme } from '../types';
import { categorizeTransaction } from '../services/geminiService';
import { Plus, Loader2, Trash2, Edit2, Check } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  updateTransaction?: (t: Transaction) => void;
  deleteTransaction?: (id: string) => void;
  theme: AppTheme;
  onSync: () => Promise<void>;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, addTransaction, updateTransaction, deleteTransaction, theme, onSync }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

  // Recuperado: Lógica de detección de signo
  useEffect(() => {
    if (!amount) return;
    const val = parseFloat(amount);
    if (!isNaN(val)) setType(val < 0 ? TransactionType.EXPENSE : TransactionType.INCOME);
  }, [amount]);

  // Recuperado: Scroll suave al editar
  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id);
    setDescription(t.description);
    const displayAmount = t.type === TransactionType.EXPENSE ? -Math.abs(t.amount) : t.amount;
    setAmount(displayAmount.toString());
    setCategory(t.category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    setLoading(true);
    try {
      let finalCategory = category || await categorizeTransaction(description);
      const numericAmount = parseFloat(amount);
      const transactionData: Transaction = {
        id: editingId || crypto.randomUUID(),
        date: new Date().toLocaleDateString('es-ES'),
        description,
        amount: Math.abs(numericAmount),
        type: numericAmount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME,
        category: finalCategory
      };
      if (editingId && updateTransaction) {
          updateTransaction(transactionData);
          setEditingId(null);
      } else {
          addTransaction(transactionData);
          onSync();
      }
      setDescription(''); setAmount(''); setCategory('');
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <h2 className="gold-text-gradient font-executive text-3xl font-bold">
        {editingId ? '✏️ Ajustar Operación' : 'Libro Contable'}
      </h2>

      <div className={`p-6 rounded-3xl border bg-white/5 backdrop-blur-md border-gold-500/30`}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] text-gold-300/60 uppercase font-black px-2 tracking-widest">Concepto</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500/50" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-gold-300/60 uppercase font-black px-2 tracking-widest">Importe</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-serif outline-none focus:border-gold-500/50" />
          </div>
          <button type="submit" disabled={loading} className="h-[50px] rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] bg-gold-600 text-white shadow-lg tracking-widest">
            {loading ? <Loader2 className="animate-spin" /> : <Plus size={16} />} {editingId ? 'Actualizar' : 'Registrar'}
          </button>
        </form>
      </div>

      <div className="bg-black/30 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-white/5 text-[9px] text-gold-300/40 uppercase tracking-[0.2em] font-black">
              <tr>
                <th className="p-6">Fecha</th>
                <th className="p-6">Descripción</th>
                <th className="p-6 text-right">Monto</th>
                <th className="p-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02]">
                  <td className="p-6 text-gray-500 font-serif text-xs">{t.date}</td>
                  <td className="p-6">
                    <p className="text-white font-bold text-sm">{t.description}</p>
                    <p className="text-[9px] text-gold-500/50 uppercase tracking-tighter">{t.category}</p>
                  </td>
                  <td className={`p-6 text-right font-serif font-bold text-lg ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditClick(t)} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-gold-500"><Edit2 size={14} /></button>
                      {deleteConfirmId === t.id ? (
                        <button onClick={() => { deleteTransaction?.(t.id); setDeleteConfirmId(null); }} className="p-2 bg-rose-600 rounded-lg text-white"><Check size={14} /></button>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(t.id)} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-rose-500"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;