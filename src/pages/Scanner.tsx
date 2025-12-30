import React, { useState, useRef } from 'react';
import { analyzeReceipt } from '../services/geminiService';
import { Transaction, TransactionType, AppTheme } from '../types';
import { Loader2, Camera, Check, X } from 'lucide-react';

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
      // Separar el prefijo base64 para enviarlo a Gemini
      const base64Data = image.split(',')[1];
      const data = await analyzeReceipt(base64Data);
      
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        // Si Gemini no detecta fecha, usamos la actual
        date: data.date || new Date().toISOString().split('T')[0],
        amount: data.total || 0,
        description: data.merchant || 'Recibo escaneado',
        category: data.category || 'Compras',
        type: TransactionType.EXPENSE
      };
      
      onScanComplete(newTransaction);
      setImage(null);
      // He quitado el alert molesto y podrías poner un toast más adelante
    } catch (e) {
      console.error(e);
      alert("Error al analizar el recibo con Gemini. Intenta que la foto tenga buena luz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-navy/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 text-center">
        <h2 className={`text-3xl font-bold mb-2 ${theme.text}`}>Escáner Inteligente</h2>
        <p className="text-gray-400 mb-8">Captura tu ticket y deja que la IA haga el trabajo</p>

        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-[2rem] p-12 hover:border-white/20 transition-all cursor-pointer group"
          >
            <div className={`w-20 h-20 rounded-full ${theme.primary} mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
              <Camera className="text-white" size={32} />
            </div>
            <p className="text-white font-medium">Pulsa para tomar foto del ticket</p>
            
            {/* CAMBIO CLAVE: 
                - capture="environment" fuerza a abrir la cámara trasera en móviles.
                - Si se usa en PC, abrirá el explorador de archivos normal.
            */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
            />
          </div>
        ) : (
          <div className="relative max-w-sm mx-auto rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl animate-in zoom-in duration-300">
            <img src={image} alt="Ticket" className="w-full h-auto" />
            <button 
              onClick={() => setImage(null)}
              className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-black transition-colors"
            >
              <X size={20} />
            </button>
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
              <button 
                onClick={processImage}
                disabled={loading}
                className={`w-full ${theme.primary} text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:opacity-90 active:scale-95 transition-all`}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                {loading ? 'Analizando con IA...' : 'Confirmar y Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;