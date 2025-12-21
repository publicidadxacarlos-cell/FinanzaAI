import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, AppTheme } from '../types';
import { categorizeTransaction } from '../services/geminiService';
import { Plus, Loader2, Trash2, Edit2, Save, X, Check } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  updateTransaction?: (t: Transaction) => void;
  deleteTransaction?: (id: string) => void;
  theme: AppTheme;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, addTransaction, updateTransaction, deleteTransaction, theme }) => {
  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState('');
  
  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Delete Confirmation State (ID of item waiting for confirmation)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Auto-detect Type based on Amount Sign
  useEffect(() => {
      if (!amount) return;
      
      const val = parseFloat(amount);
      if (!isNaN(val)) {
          if (val < 0) {
              setType(TransactionType.EXPENSE);
          } else {
              setType(TransactionType.INCOME);
          }
      }
  }, [amount]);

  const handleEditClick = (t: Transaction) => {
      setEditingId(t.id);
      setDescription(t.description);
      const displayAmount = t.type === TransactionType.EXPENSE ? -Math.abs(t.amount) : t.amount;
      setAmount(displayAmount.toString());
      setType(t.type);
      setCategory(t.category);
      setDeleteConfirmId(null); // Cancel any delete
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setEditingId(null);
      setDescription('');
      setAmount('');
      setType(TransactionType.EXPENSE);
      setCategory('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    setLoading(true);
    try {
      let finalCategory = category;
      if (!finalCategory || !editingId) {
          finalCategory = await categorizeTransaction(description);
      }

      const numericAmount = parseFloat(amount);
      const finalType = numericAmount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
      const absAmount = Math.abs(numericAmount);

      const transactionData: Transaction = {
        id: editingId || crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        description,
        amount: absAmount,
        type: finalType,
        category: finalCategory
      };

      if (editingId && updateTransaction) {
          updateTransaction(transactionData);
          setEditingId(null);
      } else {
          addTransaction(transactionData);
      }

      setDescription('');
      setAmount('');
      setCategory('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex justify-between items-center">
          <h2 className={`text-3xl font-bold ${theme.text} font-executive`}>
              {editingId ? '✏️ Editando Operación' : 'Libro Contable'}
          </h2>
          {editingId && (
              <button onClick={cancelEdit} className="text-sm text-red-400 hover:text-red-300 underline">
                  Cancelar Edición
              </button>
          )}
      </div>

      <div className={`p-6 rounded-3xl border shadow-xl transition-all duration-300 bg-navy/40 ${editingId ? 'border-blue-500 shadow-blue-500/10' : theme.secondary}`}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest px-2">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Inversión, Starbucks..."
              className={`w-full bg-midnight border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors`}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest px-2">Importe</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="-50.00 o 1000"
              className={`w-full bg-midnight border rounded-xl px-4 py-3 text-white font-mono focus:outline-none transition-colors ${
                  parseFloat(amount) < 0 ? 'border-rose-500/50 text-rose-300' : parseFloat(amount) > 0 ? theme.secondary + ' ' + theme.text : 'border-white/10'
              }`}
            />
          </div>

          <div className="space-y-2">
             <div className="flex bg-midnight rounded-xl p-1 border border-white/10 opacity-80 pointer-events-none">
               <button
                 type="button"
                 className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors uppercase tracking-widest ${type === TransactionType.EXPENSE ? 'bg-rose-500/20 text-rose-400' : 'text-gray-500'}`}
               >
                 Gasto
               </button>
               <button
                 type="button"
                 className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors uppercase tracking-widest ${type === TransactionType.INCOME ? theme.primary + '/20 ' + theme.text : 'text-gray-500'}`}
               >
                 Ingreso
               </button>
             </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`md:col-span-4 ${editingId ? 'bg-blue-600 hover:bg-blue-500' : `${theme.primary} ${theme.hover}`} text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xl uppercase tracking-widest text-xs`}
          >
            {loading ? <Loader2 className="animate-spin" /> : editingId ? <Save size={18} /> : <Plus size={18} />}
            <span>
                {loading ? 'Analizando...' : editingId ? 'Guardar Cambios' : 'Registrar Operación'}
            </span>
          </button>
        </form>
      </div>

      <div className={`bg-navy/20 rounded-3xl border ${theme.secondary} shadow-2xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              <tr>
                <th className="p-6">Fecha</th>
                <th className="p-6">Concepto</th>
                <th className="p-6">Categoría</th>
                <th className="p-6 text-right">Importe</th>
                <th className="p-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((t) => (
                <tr key={t.id} className={`hover:bg-white/5 transition-colors group ${editingId === t.id ? 'bg-white/5' : ''}`}>
                  <td className="p-6 text-gray-500 font-mono text-xs">{t.date}</td>
                  <td className="p-6 text-white font-semibold">{t.description}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg bg-midnight text-[10px] font-bold border border-white/5 uppercase tracking-widest ${theme.text}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className={`p-6 text-right font-bold font-executive text-lg ${t.type === TransactionType.INCOME ? theme.text : 'text-rose-500'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}
                  </td>
                  <td className="p-6 text-right">
                     <div className="flex justify-end gap-3">
                        {deleteConfirmId === t.id ? (
                            <div className="flex items-center bg-rose-500/10 rounded-xl p-1 animate-fade-in border border-rose-500/20">
                                <button
                                    onClick={() => {
                                        if (deleteTransaction) deleteTransaction(t.id);
                                        setDeleteConfirmId(null);
                                    }}
                                    className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleEditClick(t)}
                                    className={`p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all md:opacity-0 group-hover:opacity-100`}
                                >
                                    <Edit2 size={16} />
                                </button>
                                {deleteTransaction && (
                                    <button 
                                        onClick={() => setDeleteConfirmId(t.id)}
                                        className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all md:opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </>
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