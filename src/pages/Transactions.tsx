import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType, AppTheme } from '../types';
import { categorizeTransaction } from '../services/geminiService';
import { Plus, Loader2, Trash2, Edit2, Check, X } from 'lucide-react';

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
  const formRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

  // Auto-reset del botón de borrar tras 3 segundos
  useEffect(() => {
    if (deleteConfirmId) {
      const timer = setTimeout(() => setDeleteConfirmId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteConfirmId]);

  // Cerrar edición si pulsas fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingId && formRef.current && !formRef.current.contains(event.target as Node)) {
        setEditingId(null); setDescription(''); setAmount(''); setCategory('');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingId]);

  useEffect(() => {
    if (!amount || editingId) return;
    const val = parseFloat(amount);
    if (!isNaN(val)) setType(val < 0 ? TransactionType.EXPENSE : TransactionType.INCOME);
  }, [amount, editingId]);

  const handleEditClick = (t: Transaction) => {
    if (editingId === t.id) {
        setEditingId(null); setDescription(''); setAmount(''); setCategory('');
        return;
    }
    setDeleteConfirmId(null);
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
      // --- MEJORA IA: Categorización real ---
      let finalCategory = category;
      
      if (!finalCategory) {
        const aiResponse = await categorizeTransaction(description);
        finalCategory = aiResponse && aiResponse !== "" ? aiResponse : "Varios";
      }

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
          setTimeout(() => onSync(), 500);
      }
      
      setDescription(''); setAmount(''); setCategory('');
    } catch (error) { 
      console.error("Error en el registro:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex justify-between items-center">
        <h2 className="gold-text-gradient font-executive text-3xl font-bold">
          {editingId ? '✏️ Edición VIP' : 'Libro Contable'}
        </h2>
        {editingId && (
          <button onClick={() => { setEditingId(null); setDescription(''); setAmount(''); }} className="text-[10px] font-black uppercase text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
            Cancelar
          </button>
        )}
      </div>

      <div ref={formRef} className={`p-6 rounded-3xl border transition-all duration-500 ${editingId ? 'bg-gold-500/10 border-gold-500 shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'bg-white/5 border-gold-500/30'}`}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] text-gold-300/60 uppercase font-black px-2 tracking-widest">Concepto</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500/50 transition-colors" 
              placeholder="Ej: Compra Mercadona"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-gold-300/60 uppercase font-black px-2 tracking-widest">Importe</label>
            <input 
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-serif outline-none focus:border-gold-500/50" 
              placeholder="0.00"
            />
          </div>
          <button type="submit" disabled={loading} className="h-[50px] rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] bg-gold-600 text-white shadow-lg hover:bg-gold-500 transition-all active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : editingId ? 'Guardar Cambios' : 'Registrar'}
          </button>
        </form>
      </div>

      {/* Tabla de Resultados */}
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
                <tr key={t.id} className={`transition-colors ${editingId === t.id ? 'bg-gold-500/5' : 'hover:bg-white/[0.02]'}`}>
                  <td className="p-6 text-gray-500 font-serif text-xs">{t.date}</td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-white font-bold text-sm leading-tight">{t.description}</p>
                      <div className="flex">
                        <span className="px-2.5 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-[11px] font-black uppercase tracking-wider shadow-sm">
                          {t.category || 'Varios'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={`p-6 text-right font-serif font-bold text-lg ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditClick(t)} className={`p-2 rounded-lg transition-all ${editingId === t.id ? 'bg-gold-500 text-black' : 'bg-white/5 text-gray-400 hover:text-gold-500'}`}><Edit2 size={14} /></button>
                      {deleteConfirmId === t.id ? (
                        <button onClick={() => { deleteTransaction?.(t.id); setDeleteConfirmId(null); }} className="p-2 bg-rose-600 rounded-lg text-white animate-pulse"><Check size={14} /></button>
                      ) : (
                        <button onClick={() => { setDeleteConfirmId(t.id); setEditingId(null); }} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-rose-500"><Trash2 size={14} /></button>
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