import React, { useState, useRef } from 'react';
import { analyzeReceipt } from '../services/geminiService';
import { Transaction, TransactionType, AppTheme } from '../types';
import { Loader2, Camera, Check, Upload, X } from 'lucide-react';

interface ScannerProps {
  onScanComplete: (t: Transaction) => void;
  theme: AppTheme;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete, theme }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setLoading(true);
    try {
      // Strip base64 prefix
      const base64Data = image.split(',')[1];
      const data = await analyzeReceipt(base64Data);
      
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        date: data.date || new Date().toISOString().split('T')[0],
        amount: data.total,
        // Use the extracted merchant name or default fallback
        description: data.merchant || 'Recibo escaneado',
        category: data.category || 'Compras',
        type: TransactionType.EXPENSE
      };
      
      onScanComplete(newTransaction);
      alert(`✅ Ticket procesado: ${newTransaction.description} - $${newTransaction.amount}`);
      setImage(null);
    } catch (error) {
      console.error(error);
      alert("❌ No se pudo leer el recibo. Asegúrate de que la imagen esté bien iluminada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white font-executive">Escáner Inteligente</h2>
        <p className="text-gray-400">
          Usa la cámara para fotografiar tus tickets. La IA extraerá el total y el comercio automáticamente.
        </p>
      </div>
      
      {!image ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Camera Button */}
          <button 
             onClick={() => fileInputRef.current?.click()}
             className={`col-span-1 md:col-span-2 group bg-gradient-to-br ${theme.gradient} hover:opacity-90 transition-all p-10 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center space-y-4`}
          >
             <div className="bg-white/20 p-6 rounded-full group-hover:scale-110 transition-transform">
                 <Camera className="w-12 h-12 text-white" />
             </div>
             <div className="text-center">
                 <h3 className="text-2xl font-bold text-white font-executive">Hacer Foto al Ticket</h3>
                 <p className="text-white/70 text-sm mt-1">Abre la cámara directamente</p>
             </div>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            capture="environment" 
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="bg-card p-4 rounded-3xl border border-white/5 shadow-2xl space-y-4">
            <div className="relative rounded-2xl overflow-hidden max-h-[60vh] bg-black">
                <img src={image} alt="Preview" className="w-full h-full object-contain mx-auto" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => setImage(null)}
                    className="py-3 px-6 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
                >
                    Repetir Foto
                </button>
                <button
                    onClick={processImage}
                    disabled={loading}
                    className="py-3 px-6 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Check />}
                    <span>{loading ? 'Procesando...' : 'Guardar Gasto'}</span>
                </button>
            </div>
            {loading && (
                <p className="text-center text-xs text-gray-400 animate-pulse">
                    Analizando comercio, fecha y total con Gemini Vision...
                </p>
            )}
        </div>
      )}
    </div>
  );
};

export default Scanner;